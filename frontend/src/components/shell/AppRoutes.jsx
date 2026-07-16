import React from 'react';
import { useAppStore } from '../../stores/appStore';

const CRMLeadDashboard = React.lazy(() => import('../../screens/CRMLeadDashboard.jsx'));
const ClientBriefStudio = React.lazy(() => import('../../screens/ClientBriefStudio.jsx'));
const InteractiveCADScreen = React.lazy(() => import('../../screens/InteractiveCADScreen.jsx'));
const DrawingsElevationsStudio = React.lazy(() => import('../../screens/DrawingsElevationsStudio.jsx'));
const MaterialCatalogScreen = React.lazy(() => import('../../screens/MaterialCatalogScreen.jsx'));
const Render3DStudio = React.lazy(() => import('../../screens/Render3DStudio.jsx'));
const RenderEditWorkspace = React.lazy(() => import('../../screens/RenderEditWorkspace.jsx'));
const CutlistNestingScreen = React.lazy(() => import('../../screens/CutlistNestingScreen.jsx'));
const ProjectManagementScreen = React.lazy(() => import('../../screens/ProjectManagementScreen.jsx'));
const DesignStudioScreen = React.lazy(() => import('../../screens/DesignStudioScreen.jsx'));
const FinanceScreen = React.lazy(() => import('../../screens/FinanceScreen.jsx'));
const TimelineScreen = React.lazy(() => import('../../screens/TimelineScreen.jsx'));
const JobsScreen = React.lazy(() => import('../../screens/JobsScreen.jsx'));
const CommandCenterScreen = React.lazy(() => import('../../screens/CommandCenterScreen.jsx'));
const PricingScreen = React.lazy(() => import('../../screens/PricingScreen.jsx'));
const CommerceStageScreen = React.lazy(() => import('../../screens/CommerceStageScreen.jsx'));
const CeilingStudio = React.lazy(() => import('../../screens/CeilingStudio'));
const TvUnitGenerator = React.lazy(() => import('../../screens/TvUnitGenerator'));
const OrchestratorStudio = React.lazy(() => import('../../screens/OrchestratorStudio.jsx'));
const ConsumerOnboarding = React.lazy(() => import('../../screens/ConsumerOnboarding.jsx'));
const SystemsAdminScreen = React.lazy(() => import('../../screens/SystemsAdminScreen'));
const VendorIntelligence = React.lazy(() => import('../../screens/VendorIntelligence.jsx'));
const PinterestLearning = React.lazy(() => import('../../screens/PinterestLearning.jsx'));
const FloorPlanAnalyzerScreen = React.lazy(() => import('../../screens/FloorPlanAnalyzerScreen.jsx'));
const SettingsPanel = React.lazy(() => import('../../screens/SettingsPanel.jsx'));
import AuraBrainChat from '../layout/AuraBrainChat';

const PROJECT_LOCKED_ROUTES = new Set([]);

export default function AppRoutes() {
  const activeTab = useAppStore((state) => state.activeTab);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);

  const requiresProject = PROJECT_LOCKED_ROUTES.has(activeTab);
  const projectMissing = requiresProject && !selectedProjectId;

  React.useEffect(() => {
    if (projectMissing) {
      useAppStore.getState().navigateTab('projects');
    }
  }, [projectMissing]);

  const renderScreen = () => {
    const screen = (() => {
      if (projectMissing) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-md text-center space-y-3">
              <h3 className="text-sm font-bold text-slate-100">No project selected</h3>
              <p className="text-xs text-slate-400">Select or create a project to unlock this workspace. Project-gated tools stay disabled until a project is active.</p>
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
        case 'render-edit':
          return <RenderEditWorkspace projectId={selectedProjectId} renderId={null} />;
        case 'cutlist':
          return <CutlistNestingScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('crm')} />;
        case 'ceiling':
          return <CeilingStudio projectId={selectedProjectId} />;
        case 'floorplan':
          return <FloorPlanAnalyzerScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('studio')} />;
        case 'finance':
          return <FinanceScreen projectId={selectedProjectId} />;
        case 'pricing':
          return <PricingScreen projectId={selectedProjectId} />;
        case 'commerce':
          return <CommerceStageScreen projectId={selectedProjectId} />;
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
        case 'system-routes':
          return (
            <div className="p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Live Route Tester</h3>
              <p className="text-[10px] text-slate-400">Use this panel to verify backend connectivity from the browser.</p>
              <pre className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3">{JSON.stringify({
                backend: 'local backend', // shows local backend
                note: 'Open Settings > Providers & Settings to run smoke checks',
                tip: 'Or run: node scripts/smoke-runner.mjs'
              }, null, 2)}</pre>
            </div>
          );
        case 'settings':
          return <SettingsPanel />;
        case 'tvunit':
          return <TvUnitGenerator projectId={selectedProjectId} />;
        case 'orchestrator':
          return <OrchestratorStudio projectId={selectedProjectId} />;
        default:
          return <CRMLeadDashboard onProjectClosed={(id) => useAppStore.getState().setSelectedProjectId(id)} />;
      }
    })();

    return (
      <React.Suspense fallback={<div className="flex items-center justify-center h-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Loading workspace...</div>}>
        {screen}
      </React.Suspense>
    );
  };

  return <>{renderScreen()}</>;
}
