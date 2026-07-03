import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import AppShell from './components/shell/AppShell';
import AppRoutes from './components/shell/AppRoutes';
import TutorialOverlay from './components/tutorial/TutorialOverlay';

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  React.useEffect(() => {
    const seen = localStorage.getItem('tutorialSeen');
    if (!seen) setShowTutorial(true);
  }, []);
  const fetchStatsAndProjects = useAppStore((state) => state.fetchStatsAndProjects);
  const activeTab = useAppStore((state) => state.activeTab);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const fetchActiveJobs = useAppStore((state) => state.fetchActiveJobs);
  const prevActiveJobsCount = useAppStore((state) => state.prevActiveJobsCount);
  const activeJobs = useAppStore((state) => state.activeJobs);
  const setPrevActiveJobsCount = useAppStore((state) => state.setPrevActiveJobsCount);
  const setOrchestratorMode = useAppStore((state) => state.setOrchestratorMode);
  const [loading, setLoading] = React.useState(true);
  const [connectivity, setConnectivity] = React.useState('online');

  React.useEffect(() => {
    fetchStatsAndProjects().finally(() => setLoading(false));
  }, [fetchStatsAndProjects]);

  React.useEffect(() => {
    const handleOnline = () => setConnectivity('online');
    const handleOffline = () => setConnectivity('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setConnectivity(navigator.onLine ? 'online' : 'offline');
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#020617] text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 mx-auto animate-pulse">
            <LayoutDashboard className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Loading workspace</div>
          <div className="text-[10px] text-slate-500">Starting backend, syncing projects, and loading layout...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showTutorial && (
        <TutorialOverlay
          open={showTutorial}
          onClose={() => setShowTutorial(false)}
          onFinished={() => setShowTutorial(false)}
        />
      )}
      <div className={`fixed top-3 right-3 z-50 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
        connectivity === 'online' ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' : 'border-red-500/40 text-red-300 bg-red-950/40'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${connectivity === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`} />
        {connectivity === 'online' ? 'Online' : 'Offline'}
      </div>
      <AppShell
        activeTab={activeTab}
        onNavigate={(tab) => useAppStore.getState().navigateTab(tab)}
        currentTime={new Date()}
      >
        <AppRoutes />
      </AppShell>
    </div>
  );
}
