import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import AppShell from './components/shell/AppShell';
import AppRoutes from './components/shell/AppRoutes';

export default function App() {
  const fetchStatsAndProjects = useAppStore((state) => state.fetchStatsAndProjects);
  const activeTab = useAppStore((state) => state.activeTab);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const fetchActiveJobs = useAppStore((state) => state.fetchActiveJobs);
  const prevActiveJobsCount = useAppStore((state) => state.prevActiveJobsCount);
  const activeJobs = useAppStore((state) => state.activeJobs);
  const setPrevActiveJobsCount = useAppStore((state) => state.setPrevActiveJobsCount);
  const setOrchestratorMode = useAppStore((state) => state.setOrchestratorMode);

  useEffect(() => {
    fetchStatsAndProjects();
  }, [fetchStatsAndProjects, activeTab, selectedProjectId]);

  useEffect(() => {
    let interval;
    if (selectedProjectId) {
      fetchActiveJobs(selectedProjectId);
      interval = setInterval(() => fetchActiveJobs(selectedProjectId), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedProjectId, fetchActiveJobs]);

  useEffect(() => {
    if (activeJobs.length === 0 && prevActiveJobsCount > 0) {
      fetchStatsAndProjects();
    }
    setPrevActiveJobsCount(activeJobs.length);
  }, [activeJobs, prevActiveJobsCount, fetchStatsAndProjects, setPrevActiveJobsCount]);

  return (
    <AppShell
      activeTab={activeTab}
      onNavigate={(tab) => useAppStore.getState().navigateTab(tab)}
      currentTime={new Date()}
    >
      <AppRoutes />
    </AppShell>
  );
}
