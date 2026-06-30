// ============================================================
// PRIORITY 3: Render Approval Gating System
// server/services/workflow-engine/approval-gating.js
// Controls what flows to PDF brief and cutlist based on approvals
// ============================================================

/**
 * APPROVAL GATING ARCHITECTURE:
 * 
 * Every project follows this gate sequence:
 * 
 * Floor Plan → Renders Generated → [GATE] Renders Approved → PDF Brief → [GATE] Brief Approved → Cutlist
 * 
 * Each gate:
 * - Blocks downstream actions if not passed
 * - Shows clear status in the UI
 * - Requires explicit designer action to pass
 * - Cannot be bypassed without a manual override (logged)
 * 
 * Stage gates implemented:
 * 1. render-approval: At least 1 variant must be approved
 * 2. brief-approval: PDF brief must be marked as client-approved
 * 3. cutlist-readiness: Modules must be defined and parts generated
 * 4. workspace-signoff: Production must sign off before export
 */

const db = require('../database');

class ApprovalGatingService {
  constructor() {
    this.gates = new Map();
    this.initializeGates();
  }

  initializeGates() {
    // Define all gates with their conditions and consequences
    this.gates.set('render-approval', {
      name: 'Render Approval',
      order: 3,
      description: 'At least one AI render variant must be approved by the designer',
      checkConditions: async (projectId) => {
        const renders = await this.findRenders(projectId);
        return {
          passed: renders.some(r => r.status === 'approved'),
          details: {
            totalRenders: renders.length,
            approvedCount: renders.filter(r => r.status === 'approved').length,
            pendingReview: renders.filter(r => r.status === 'pending-review').length,
            rejectedCount: renders.filter(r => r.status === 'rejected').length
          },
          blockingMessage: 'Please approve at least one render variant before generating the PDF brief',
          blockingAction: { screen: 'ai-render-studio', button: 'Review & Approve Renders' }
        };
      },
      onPass: async (projectId) => {
        await db.updateProjectStage(projectId, 'render-approved');
        await this.logAudit(projectId, 'render-approval', 'passed');
      },
      onFail: async (projectId) => {
        await this.logAudit(projectId, 'render-approval', 'blocked');
      }
    });

    this.gates.set('brief-approval', {
      name: 'Brief Approval',
      order: 4,
      description: 'Client must approve the PDF brief before cutlist can be created',
      checkConditions: async (projectId) => {
        const briefs = await this.findBriefs(projectId);
        const latestBrief = briefs[0];
        return {
          passed: latestBrief?.status === 'client-approved',
          details: {
            briefGenerated: !!latestBrief,
            clientApproved: latestBrief?.status === 'client-approved',
            currentStatus: latestBrief?.status || 'not-generated',
            revision: latestBrief?.revision || 0
          },
          blockingMessage: 'Client must approve the PDF brief before proceeding to cutlist',
          blockingAction: { screen: 'pdf-briefs', button: 'Mark as Client Approved' }
        };
      },
      onPass: async (projectId) => {
        await db.updateProjectStage(projectId, 'brief-approved');
        await this.logAudit(projectId, 'brief-approval', 'passed');
      }
    });

    this.gates.set('cutlist-readiness', {
      name: 'Cutlist Readiness',
      order: 5,
      description: 'Cutlist project must have modules defined and parts generated',
      checkConditions: async (projectId) => {
        const cutlists = await this.findCutlists(projectId);
        const latestCutlist = cutlists[0];
        const modules = latestCutlist ? await this.findCutlistModules(latestCutlist.id) : [];
        const parts = latestCutlist ? await this.findCutlistParts(latestCutlist.id) : [];
        
        return {
          passed: modules.length >= 1 && parts.length >= 1,
          details: {
            cutlistExists: !!latestCutlist,
            moduleCount: modules.length,
            partCount: parts.length,
            status: latestCutlist?.status || 'not-created'
          },
          blockingMessage: 'Define modules and generate parts before sheet optimization',
          blockingAction: { screen: 'cutlists', button: 'Generate Parts' }
        };
      },
      onPass: async (projectId) => {
        await db.updateProjectStage(projectId, 'cutlist-ready');
      }
    });

    this.gates.set('workspace-signoff', {
      name: 'Workspace Sign-off',
      order: 6,
      description: 'Production team must sign off before final export',
      checkConditions: async (projectId) => {
        const signoffs = await this.findSignoffs(projectId);
        return {
          passed: signoffs.some(s => s.type === 'workspace' && s.status === 'signed'),
          details: {
            signed: signoffs.filter(s => s.status === 'signed').length,
            pending: signoffs.filter(s => s.status === 'pending').length
          },
          blockingMessage: 'Production sign-off required before workshop export',
          blockingAction: { screen: 'cutlists', button: 'Request Production Sign-off' }
        };
      },
      onPass: async (projectId) => {
        await db.updateProjectStage(projectId, 'delivered');
        await this.logAudit(projectId, 'workspace-signoff', 'passed');
      }
    });
  }

  /**
   * Check if a specific gate is passed for a project
   */
  async checkGate(projectId, gateName) {
    const gate = this.gates.get(gateName);
    if (!gate) {
      return { error: `Unknown gate: ${gateName}` };
    }

    const result = await gate.checkConditions(projectId);
    
    if (result.passed) {
      await gate.onPass(projectId);
    } else {
      await gate.onFail(projectId);
    }

    return {
      gate: gate.name,
      passed: result.passed,
      details: result.details,
      blockingMessage: result.blockingMessage,
      blockingAction: result.blockingAction,
      progress: this.calculateGateProgress(gate.order)
    };
  }

  /**
   * Check ALL gates for a project (returns complete pipeline status)
   */
  async checkAllGates(projectId) {
    const results = [];
    const sortedGates = [...this.gates.values()].sort((a, b) => a.order - b.order);
    
    for (const gate of sortedGates) {
      const result = await gate.checkConditions(projectId);
      results.push({
        gate: result.passed ? '✅' : '⏳',
        name: gate.name,
        passed: result.passed,
        details: result.details,
        blockingMessage: result.blockingMessage,
        blockingAction: result.blockingAction
      });
      
      // If a gate fails, all subsequent gates are blocked
      if (!result.passed) {
        break;
      }
    }

    return {
      projectId,
      gates: results,
      overallProgress: this.calculateOverallProgress(results),
      currentBlockingGate: results.find(r => !r.passed)
    };
  }

  /**
   * Get the next action required for a project
   */
  async getNextAction(projectId) {
    const gates = await this.checkAllGates(projectId);
    const blockingGate = gates.currentBlockingGate;
    
    if (!blockingGate) {
      return { action: 'all-complete', message: 'All gates passed. Ready for delivery.' };
    }

    return {
      action: 'blocked',
      gate: blockingGate.name,
      message: blockingGate.blockingMessage,
      button: blockingGate.blockingAction?.button || 'Continue',
      screen: blockingGate.blockingAction?.screen || 'dashboard',
      urgency: this.getUrgencyLevel(gates)
    };
  }

  /**
   * Force-pass a gate (with audit trail)
   */
  async overrideGate(projectId, gateName, reason, userId) {
    const gate = this.gates.get(gateName);
    if (!gate) {
      return { error: `Unknown gate: ${gateName}` };
    }

    await this.logAudit(projectId, `${gateName}-override`, {
      reason,
      userId,
      timestamp: new Date().toISOString()
    });

    await gate.onPass(projectId);

    return {
      gate: gate.name,
      overridden: true,
      reason,
      note: 'Manual override applied. Verify downstream results.'
    };
  }

  /**
   * Approve a render variant (core action that unlocks PDF brief)
   */
  async approveRender(projectId, renderId, variantId) {
    // Mark the variant as approved
    const db = require('../database');
    await db.approveRenderVariant(renderId, variantId);
    
    // Check if this passes the render-approval gate
    return await this.checkGate(projectId, 'render-approval');
  }

  /**
   * Approve the PDF brief (marks as client approved)
   */
  async approveBrief(projectId, briefId) {
    const db = require('../database');
    await db.approveBrief(briefId);
    
    return await this.checkGate(projectId, 'brief-approval');
  }

  /**
   * Sign off from production/workshop
   */
  async signoffWorkspace(projectId, signerName, notes) {
    const db = require('../database');
    
    const signoffId = 'sig-' + Date.now();
    await db.saveSignoff({
      id: signoffId,
      projectId,
      type: 'workspace',
      status: 'signed',
      signerName,
      notes,
      signedAt: new Date().toISOString()
    });

    return await this.checkGate(projectId, 'workspace-signoff');
  }

  // ---- Helper Methods ----

  async findRenders(projectId) {
    const db = require('../database');
    const renders = await db.getProjectRenders(projectId);
    const variants = renders.flatMap(r => r.variants || []);
    return variants.map(v => ({
      id: v.id,
      generationId: v.generation_id,
      variantKey: v.variant_key,
      status: v.status || 'pending-review',
      name: v.name
    }));
  }

  async findBriefs(projectId) {
    const db = require('../database');
    // Assumes briefs table exists from intake_briefs
    return db.getAll ? await db.getAll('intake_briefs', { project_id: projectId }) : [];
  }

  async findCutlists(projectId) {
    const db = require('../database');
    return db.getAll ? await db.getAll('cutlist_projects', { project_id: projectId }) : [];
  }

  async findCutlistModules(cutlistId) {
    const db = require('../database');
    return db.getAll ? await db.getAll('cutlist_modules', { cutlist_project_id: cutlistId }) : [];
  }

  async findCutlistParts(cutlistId) {
    const db = require('../database');
    return db.getAll ? await db.getAll('cutlist_parts', { cutlist_project_id: cutlistId }) : [];
  }

  async findSignoffs(projectId) {
    const db = require('../database');
    return db.getAll ? await db.getAll('workspace_signoffs', { project_id: projectId }) : [];
  }

  async logAudit(projectId, action, details) {
    const db = require('../database');
    if (db.logAudit) {
      await db.logAudit({ projectId, action, details, timestamp: new Date().toISOString() });
    }
  }

  calculateGateProgress(currentOrder) {
    const totalGates = this.gates.size;
    return Math.round((currentOrder / totalGates) * 100);
  }

  calculateOverallProgress(gateResults) {
    const passed = gateResults.filter(g => g.passed).length;
    return Math.round((passed / gateResults.length) * 100);
  }

  getUrgencyLevel(gates) {
    const passedGates = gates.gates.filter(g => g.passed).length;
    const totalGates = gates.gates.length;
    
    if (passedGates === 0) return 'low';
    if (passedGates === totalGates) return 'complete';
    if (passedGates >= totalGates / 2) return 'high';
    return 'medium';
  }
}

module.exports = new ApprovalGatingService();