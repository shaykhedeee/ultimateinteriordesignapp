// ============================================================
// PRIORITY 3+6: Workflow Engine Routes
// server/routes/workflow-engine.js
// API endpoints for approval gating + sign-off workflow
// ============================================================

const express = require('express');
const router = express.Router();
const approvalGating = require('../services/workflow-engine/approval-gating');
const db = require('../services/database');

// ============================================================
// GATE STATUS
// GET /api/workflow/gates/:projectId
// Returns the status of all pipeline gates for a project
// ============================================================
router.get('/gates/:projectId', async (req, res) => {
  try {
    const gates = await approvalGating.checkAllGates(req.params.projectId);
    const nextAction = await approvalGating.getNextAction(req.params.projectId);
    
    res.json({
      ...gates,
      nextAction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// APPROVE RENDER
// POST /api/workflow/approve-render/:projectId/:renderId
// Marks a render variant as approved and checks the gate
// ============================================================
router.post('/approve-render/:projectId/:renderId', async (req, res) => {
  try {
    const { projectId, renderId } = req.params;
    const { variantId } = req.body;
    
    const result = await approvalGating.approveRender(projectId, renderId, variantId);
    
    res.json({
      success: true,
      projectId,
      renderId,
      variantApproved: variantId,
      gateResult: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// REJECT RENDER
// POST /api/workflow/reject-render/:projectId/:renderId
// Marks a render variant as rejected
// ============================================================
router.post('/reject-render/:projectId/:renderId', async (req, res) => {
  try {
    const { projectId, renderId } = req.params;
    const { variantId, reason } = req.body;
    
    await db.rejectRenderVariant(renderId, variantId, reason);
    
    res.json({
      success: true,
      projectId,
      renderId,
      variantId,
      status: 'rejected',
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// APPROVE BRIEF
// POST /api/workflow/approve-brief/:projectId/:briefId
// Marks PDF brief as client-approved and checks the gate
// ============================================================
router.post('/approve-brief/:projectId/:briefId', async (req, res) => {
  try {
    const { projectId, briefId } = req.params;
    
    const result = await approvalGating.approveBrief(projectId, briefId);
    
    res.json({
      success: true,
      projectId,
      briefId,
      status: 'client-approved',
      gateResult: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// WORKSPACE SIGNOFF
// POST /api/workflow/signoff/:projectId
// Production team signs off before export
// ============================================================
router.post('/signoff/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { signerName, notes, checklist } = req.body;
    
    if (!signerName || !signerName.trim()) {
      return res.status(400).json({ error: 'Signer name is required' });
    }
    
    const signoffId = 'sig-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    
    // Check if table exists, create if not
    db.run(`CREATE TABLE IF NOT EXISTS workspace_signoffs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      signer_name TEXT NOT NULL,
      notes TEXT,
      checklist_json TEXT,
      status TEXT DEFAULT 'signed',
      signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`INSERT INTO workspace_signoffs (id, project_id, signer_name, notes, checklist_json, status, signed_at)
      VALUES (?, ?, ?, ?, ?, 'signed', datetime('now'))`,
      [signoffId, projectId, signerName.trim(), (notes || '').trim(), JSON.stringify(checklist || {})]
    );
    
    // Check the gate
    const gateResult = await approvalGating.checkGate(projectId, 'workspace-signoff');
    
    res.json({
      success: true,
      id: signoffId,
      projectId,
      signerName: signerName.trim(),
      notes: (notes || '').trim(),
      checklistCount: Object.values(checklist || {}).filter(Boolean).length,
      signedAt: new Date().toISOString(),
      gateResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CHECK SIGNOFF STATUS
// GET /api/workflow/signoff-status/:projectId
// Returns whether a project has been signed off
// ============================================================
router.get('/signoff-status/:projectId', async (req, res) => {
  try {
    const signoffs = db.getAll('SELECT * FROM workspace_signoffs WHERE project_id = ? ORDER BY signed_at DESC', [req.params.projectId]);
    
    res.json({
      projectId: req.params.projectId,
      signed: signoffs.length > 0,
      signoffs: signoffs.map(s => ({
        id: s.id,
        signerName: s.signer_name,
        signedAt: s.signed_at,
        notes: s.notes
      })),
      latestSignoff: signoffs[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// OVERRIDE GATE
// POST /api/workflow/override-gate/:projectId
// Force-pass a gate (audit-logged)
// ============================================================
router.post('/override-gate/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { gateName, reason } = req.body;
    
    if (!gateName) {
      return res.status(400).json({ error: 'gateName is required' });
    }
    
    const result = await approvalGating.overrideGate(
      projectId, gateName, reason || 'Manual override', req.body.userId || 'system'
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET NEXT ACTION
// GET /api/workflow/next-action/:projectId
// Returns the single next action the user should take
// ============================================================
router.get('/next-action/:projectId', async (req, res) => {
  try {
    const nextAction = await approvalGating.getNextAction(req.params.projectId);
    res.json(nextAction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PIPELINE SUMMARY
// GET /api/workflow/pipeline-summary
// Returns summary of all projects across pipeline stages
// ============================================================
router.get('/pipeline-summary', async (req, res) => {
  try {
    const projects = db.getAll('SELECT * FROM client_projects ORDER BY updated_at DESC');
    
    const stages = {
      'onboarding': { label: 'Onboarding', count: 0, projects: [] },
      'floor-plan': { label: 'Floor Plan', count: 0, projects: [] },
      'render-review': { label: 'Render Review', count: 0, projects: [] },
      'render-approved': { label: 'Render Approved', count: 0, projects: [] },
      'pdf-brief': { label: 'PDF Brief', count: 0, projects: [] },
      'brief-approved': { label: 'Brief Approved', count: 0, projects: [] },
      'cutlist': { label: 'Cutlist Project', count: 0, projects: [] },
      'cutlist-ready': { label: 'Cutlist Ready', count: 0, projects: [] },
      'delivered': { label: 'Delivered', count: 0, projects: [] }
    };
    
    for (const project of projects) {
      const stage = project.current_stage || 'onboarding';
      if (stages[stage]) {
        stages[stage].count++;
        stages[stage].projects.push({
          id: project.id,
          name: project.client_name,
          readiness: calculateReadiness(stage)
        });
      }
    }
    
    const totalProjects = projects.length;
    const completedProjects = stages['delivered'].count;
    const inProgress = totalProjects - completedProjects;
    
    res.json({
      totalProjects,
      completedProjects,
      inProgress,
      completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
      stages: Object.values(stages).filter(s => s.count > 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateReadiness(stage) {
  const readinessMap = {
    'onboarding': 10,
    'floor-plan': 25,
    'render-review': 40,
    'render-approved': 55,
    'pdf-brief': 65,
    'brief-approved': 75,
    'cutlist': 85,
    'cutlist-ready': 92,
    'delivered': 100
  };
  return readinessMap[stage] || 0;
}

module.exports = router;