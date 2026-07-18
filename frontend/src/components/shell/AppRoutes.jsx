import React from 'react';
import { useAppStore } from '../../stores/appStore';

const lazyWithRecovery = (loader, key) => React.lazy(async () => {
  try {
    return await loader();
  } catch (error) {
    const message = String(error?.message || error || '');
    const isStaleChunk = /dynamically imported module|importing a module script failed|chunkloaderror/i.test(message);
    const recoveryKey = `ultida:chunk-recovery:${key}`;
    if (isStaleChunk && typeof window !== 'undefined' && !sessionStorage.getItem(recoveryKey)) {
      sessionStorage.setItem(recoveryKey, '1');
      window.location.reload();
      return new Promise(() => {});
    }
    throw error;
  }
});

const ClientBriefStudio = lazyWithRecovery(() => import('../../screens/ClientBriefStudio.jsx'), 'brief');
const InteractiveCADScreen = lazyWithRecovery(() => import('../../screens/InteractiveCADScreen.jsx'), 'cad');
const DrawingsElevationsStudio = lazyWithRecovery(() => import('../../screens/DrawingsElevationsStudio.jsx'), 'drawings');
const MaterialCatalogScreen = lazyWithRecovery(() => import('../../screens/MaterialCatalogScreen.jsx'), 'materials');
const Render3DStudio = lazyWithRecovery(() => import('../../screens/Render3DStudio.jsx'), 'renders');
const RenderEditWorkspace = lazyWithRecovery(() => import('../../screens/RenderEditWorkspace.jsx'), 'render-edit');
const CutlistNestingScreen = lazyWithRecovery(() => import('../../screens/CutlistNestingScreen.jsx'), 'cutlist');
const ProjectManagementScreen = lazyWithRecovery(() => import('../../screens/ProjectManagementScreen.jsx'), 'projects');
const DesignStudioScreen = lazyWithRecovery(() => import('../../screens/DesignStudioScreen.jsx'), 'studio');
const FinanceScreen = lazyWithRecovery(() => import('../../screens/FinanceScreen.jsx'), 'finance');
const TimelineScreen = lazyWithRecovery(() => import('../../screens/TimelineScreen.jsx'), 'timeline');
const CommandCenterScreen = lazyWithRecovery(() => import('../../screens/CommandCenterScreen.jsx'), 'command-center');
const PricingScreen = lazyWithRecovery(() => import('../../screens/PricingScreen.jsx'), 'pricing');
const CommerceStageScreen = lazyWithRecovery(() => import('../../screens/CommerceStageScreen.jsx'), 'commerce');
const CeilingStudio = lazyWithRecovery(() => import('../../screens/CeilingStudio'), 'ceiling');
const TvUnitGenerator = lazyWithRecovery(() => import('../../screens/TvUnitGenerator'), 'tvunit');
const OrchestratorStudio = lazyWithRecovery(() => import('../../screens/OrchestratorStudio.jsx'), 'orchestrator');
const ConsumerOnboarding = lazyWithRecovery(() => import('../../screens/ConsumerOnboarding.jsx'), 'onboarding');
const SystemsAdminScreen = lazyWithRecovery(() => import('../../screens/SystemsAdminScreen'), 'system-admin');
const VendorIntelligence = lazyWithRecovery(() => import('../../screens/VendorIntelligence.jsx'), 'vendor');
const DesignLibraryScreen = lazyWithRecovery(() => import('../../screens/DesignLibraryScreen.jsx'), 'reference-library');
const FloorPlanAnalyzerScreen = lazyWithRecovery(() => import('../../screens/FloorPlanAnalyzerScreen.jsx'), 'floorplan');
const SettingsPanel = lazyWithRecovery(() => import('../../screens/SettingsPanel.jsx'), 'settings');
import AuraBrainChat from '../layout/AuraBrainChat';

const PROJECT_LOCKED_ROUTES = new Set([
  'brief', 'cad', 'floorplan', 'studio', 'drawings', 'materials', 'renders',
  'render-edit', 'cutlist', 'ceiling', 'tvunit', 'finance', 'pricing',
  'commerce', 'timeline', 'vendor', 'orchestrator', 'rooms', '3d', 'floors'
]);
const LEGACY_ROUTE_REDIRECTS = {
  crm: 'projects',
  jobs: 'dashboard',
  pinterest: 'reference-library'
};

class RouteErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ULTIDA] workspace failed to render', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#f7f2ea]">
        <div className="max-w-lg w-full rounded-lg border border-[#d9cec0] bg-[#fffdf9] p-5 space-y-3 shadow-sm">
          <h2 className="text-xs font-black uppercase text-[#9f352b]">Workspace unavailable</h2>
          <p className="text-sm text-[#5f554c]">This workspace failed to load. Your saved project data is unchanged.</p>
          <pre className="max-h-32 overflow-auto rounded-md border border-[#e4dad0] bg-[#f8f3ec] p-3 text-xs text-[#756a60] whitespace-pre-wrap">{String(this.state.error?.message || this.state.error)}</pre>
          <div className="flex gap-2">
            <button type="button" onClick={() => this.setState({ error: null })} className="rounded-md border border-[#cdbfb2] px-3 py-2 text-xs font-bold text-[#3f352e]">Retry workspace</button>
            <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-[#503629] px-3 py-2 text-xs font-bold text-white">Reload app</button>
          </div>
        </div>
      </div>
    );
  }
}

export default function AppRoutes() {
  const activeTab = useAppStore((state) => state.activeTab);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);

  const requiresProject = PROJECT_LOCKED_ROUTES.has(activeTab);
  const projectMissing = requiresProject && !selectedProjectId;

  React.useEffect(() => {
    const redirect = LEGACY_ROUTE_REDIRECTS[activeTab];
    if (redirect) useAppStore.getState().navigateTab(redirect);
    else if (projectMissing) useAppStore.getState().navigateTab('projects');
  }, [activeTab, projectMissing]);

  const renderScreen = () => {
    const screen = (() => {
      if (projectMissing) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="bg-[#fffdf9] border border-[#d9cec0] rounded-lg p-6 max-w-md text-center space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-[#2f2823]">Select a project first</h3>
              <p className="text-sm text-[#6c6056]">Create or select a project to continue this design journey.</p>
              <button type="button" onClick={() => useAppStore.getState().navigateTab('projects')} className="rounded-md bg-[#503629] px-4 py-2 text-sm font-bold text-white">Open project pipeline</button>
            </div>
          </div>
        );
      }

      switch (activeTab) {
        case 'dashboard':
          return <CommandCenterScreen projectId={selectedProjectId} onNavigateToTab={(tab) => useAppStore.getState().navigateTab(tab)} />;
        case 'projects':
          return <ProjectManagementScreen onNavigateToProject={(id, project) => {
            const store = useAppStore.getState();
            if (project) store.setSelectedProject(project);
            store.setSelectedProjectId(id);
            store.fetchStatsAndProjects().catch(() => {});
            store.navigateTab('brief');
          }} />;
        case 'brief':
          return <ClientBriefStudio projectId={selectedProjectId} onBriefSaved={() => useAppStore.getState().navigateTab('floorplan')} />;
        case 'cad':
          return <InteractiveCADScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('studio')} />;
        case 'reference-library':
          return <DesignLibraryScreen onUseInspiration={() => useAppStore.getState().navigateTab('studio')} />;
        case 'studio':
          return <DesignStudioScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('materials')} />;
        case 'drawings':
          return <DrawingsElevationsStudio projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('cutlist')} />;
        case 'materials':
          return <MaterialCatalogScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('renders')} />;
        case 'renders':
          return <Render3DStudio projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('drawings')} />;
        case 'render-edit':
          return <RenderEditWorkspace projectId={selectedProjectId} renderId={null} />;
        case 'cutlist':
          return <CutlistNestingScreen projectId={selectedProjectId} onComplete={() => useAppStore.getState().navigateTab('finance')} />;
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
        case 'vendor':
          return <VendorIntelligence projectId={selectedProjectId} />;
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
          return <CommandCenterScreen projectId={selectedProjectId} onNavigateToTab={(tab) => useAppStore.getState().navigateTab(tab)} />;
      }
    })();

    return (
      <RouteErrorBoundary key={activeTab}>
        <React.Suspense fallback={<div className="flex items-center justify-center h-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Loading workspace...</div>}>
          {screen}
        </React.Suspense>
      </RouteErrorBoundary>
    );
  };

  return <>{renderScreen()}</>;
}
