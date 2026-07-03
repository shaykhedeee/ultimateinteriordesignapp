import React from 'react';
import { useAppStore } from '../../stores/appStore';

import CRMLeadDashboard from '../../screens/CRMLeadDashboard.jsx';
import ClientBriefStudio from '../../screens/ClientBriefStudio.jsx';
import InteractiveCADScreen from '../../screens/InteractiveCADScreen.jsx';
import DrawingsElevationsStudio from '../../screens/DrawingsElevationsStudio.jsx';
import MaterialCatalogScreen from '../../screens/MaterialCatalogScreen.jsx';
import Render3DStudio from '../../screens/Render3DStudio.jsx';
import CutlistNestingScreen from '../../screens/CutlistNestingScreen.jsx';
import ProjectManagementScreen from '../../screens/ProjectManagementScreen.jsx';
import DesignStudioScreen from '../../screens/DesignStudioScreen.jsx';
import FinanceScreen from '../../screens/FinanceScreen.jsx';
import TimelineScreen from '../../screens/TimelineScreen.jsx';
import JobsScreen from '../../screens/JobsScreen.jsx';
import CommandCenterScreen from '../../screens/CommandCenterScreen.jsx';
import CeilingStudio from '../../screens/CeilingStudio';
import TvUnitGenerator from '../../screens/TvUnitGenerator';
import SystemsAdminScreen from '../../screens/SystemsAdminScreen';
import VendorIntelligence from '../../screens/VendorIntelligence.jsx';
import PinterestLearning from '../../screens/PinterestLearning.jsx';
import FloorPlanAnalyzerScreen from '../../screens/FloorPlanAnalyzerScreen.jsx';
import AuraBrainChat from '../layout/AuraBrainChat';

const PROJECT_LOCKED_ROUTES = new Set([
  'brief',
  'cad',
  'studio',
  'drawings',
  'materials',
  'renders',
  'cutlist',
  'ceiling',
  'tvunit',
  'finance',
  'timeline',
  'jobs',
  'vendor',
  'pinterest',
  'floorplan'
]);

export default function AppRoutes() {
  const activeTab = useAppStore((state) => state.activeTab);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);

  const requiresProject = PROJECT_LOCKED_ROUTES.has(activeTab);
  const projectMissing = requiresProject && !selectedProjectId;

  const renderScreen = () => {
    if (projectMissing) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-md text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-100">No project selected</h3>
            <p className="text-xs text-slate-400">
              Select or create a project to unlock this workspace. Project-gated tools stay disabled until a project is active.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <CommandCenterScreen projectId={selectedProjectId} onNavigateToTab={(tab) => useAppStore.getState().navigateTab(tab)} />;
      case 'crm':
        return <CRMLeadDashboard onProjectClosed={(id) => useAppStore.getState().setSelectedProjectId(id)} />;
      case 'projects':
        return <ProjectManagementScreen onNavigateToProject={(id) => { useAppStore.getState().setSelectedProjectId(id); useAppStore.getState().navigateTab('brief'); }} />;
      case 'brief':
        return <ClientBriefStudio projectId={selectedProjectId} onBriefSaved={() => useAppStore.getState().navigateTab('cad')} />;
      case 'cad':
        return <InteractiveCADScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('studio')} />;
      case 'studio':
        return <DesignStudioScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('drawings')} />;
      case 'drawings':
        return <DrawingsElevationsStudio projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('materials')} />;
      case 'materials':
        return <MaterialCatalogScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('renders')} />;
      case 'renders':
        return <Render3DStudio projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('cutlist')} />;
      case 'cutlist':
        return <CutlistNestingScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('crm')} />;
      case 'ceiling':
        return <CeilingStudio projectId={selectedProjectId} />;
      case 'floorplan':
        return <FloorPlanAnalyzerScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('studio')} />;
      case 'finance':
        return <FinanceScreen projectId={selectedProjectId} />;
      case 'timeline':
        return <TimelineScreen projectId={selectedProjectId} />;
      case 'jobs':
        return <JobsScreen projectId={selectedProjectId} />;
      case 'vendor':
        return <VendorIntelligence projectId={selectedProjectId} />;
      case 'pinterest':
        return <PinterestLearning projectId={selectedProjectId} />;
      case 'command-center':
        return <CommandCenterScreen projectId={selectedProjectId} />;
      case 'aura':
        return <AuraBrainChat
          messages={useAppStore.getState().chatMessages}
          onSendMessage={useAppStore.getState().handleSendMessage}
          onExecuteAction={useAppStore.getState().handleExecuteAction}
          onRetryMessage={useAppStore.getState().handleRetryMessage}
          project={useAppStore.getState().selectedProject}
          providerStatus={null}
          isOpen
          onClose={() => useAppStore.getState().setActiveTab('dashboard')}
        />;
      case 'rooms':
      case '3d':
        return <Render3DStudio projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('cutlist')} />;
      case 'floors':
        return <FloorPlanAnalyzerScreen projectId={selectedProjectId} />;
      case 'system-admin':
        return <SystemsAdminScreen />;
      case 'tvunit':
        return <TvUnitGenerator projectId={selectedProjectId} />;
      default:
        return <CRMLeadDashboard onProjectClosed={(id) => useAppStore.getState().setSelectedProjectId(id)} />;
    }
  };

  return <>{renderScreen()}</>;
}
