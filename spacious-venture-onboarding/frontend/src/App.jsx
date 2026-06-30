import React from 'react';
import { StudioShell } from './components/StudioShell.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import {
  AdminDashboardScreen, BriefsScreen, CutlistsScreen,
  HelpScreen, LibraryScreen, MaterialsScreen, PackagesScreen,
  PipelineScreen, ProjectsScreen, RendersScreen, SettingsScreen
} from './screens/ManagementScreens/index.js';
import { useStudioApp } from './hooks/useStudioApp.js';
import { useNotifications } from './hooks/useNotifications.js';
import AIRenderStudioEnhanced from './screens/AIRenderStudioEnhanced.jsx';

export function App() {
  const {
    activeNav, setActiveNav, form, project, designPackage,
    providerStatus, studioSettings, updateStudioSettings,
    startNewClient, clearAll, laminates, library, generating,
    uploading, activeMoodboard, floorPlanDraft, floorPlanAnalysis,
    canGenerate, cutlist, adminSummary, projectList, screenProps,
    status, activeRoom
  } = useStudioApp();

  const { toasts, dismiss } = useNotifications();

  return (
    <StudioShell
      activeNav={activeNav}
      onNavChange={setActiveNav}
      activeStep={screenProps.activeStep}
      setActiveStep={screenProps.setActiveStep}
      form={form}
      project={project}
      designPackage={designPackage}
      providerStatus={providerStatus}
      studioSettings={studioSettings}
      onDesignerInfoChange={(field, value) => updateStudioSettings(field, value)}
      onStartClient={startNewClient}
      onClearAll={clearAll}
      laminates={laminates}
      library={library}
      generating={generating}
      uploading={uploading}
      onGenerate={screenProps.createPackage}
      onRegenerate={screenProps.regenerateRoom}
      onUploadReferences={screenProps.uploadReferences}
      onDownloadProposal={screenProps.downloadProposal}
      onCreateCutlistProject={screenProps.createCutlistProject}
      onRefreshLibrary={screenProps.refreshLibrary}
      onExportBackup={screenProps.exportBackup}
      activeMoodboard={activeMoodboard}
      floorPlanDraft={floorPlanDraft}
      floorPlanAnalysis={floorPlanAnalysis}
      canGenerate={canGenerate}
      cutlist={cutlist}
      adminSummary={adminSummary}
      projectList={projectList}
      toasts={toasts}
      onDismissToast={dismiss}
    >
      {renderScreen(activeNav, screenProps)}
    </StudioShell>
  );
}

function renderScreen(activeNav, props) {
  if (activeNav === 'admin') return <AdminDashboardScreen {...props} />;
  if (activeNav === 'projects') return <ProjectsScreen {...props} />;
  if (activeNav === 'pipeline') return <PipelineScreen {...props} />;
  if (activeNav === 'briefs') return <BriefsScreen {...props} />;
  if (activeNav === 'cutlists') return <CutlistsScreen {...props} />;
  if (activeNav === 'library') return <LibraryScreen {...props} />;
  if (activeNav === 'materials') return <MaterialsScreen {...props} />;
  if (activeNav === 'renders') return <AIRenderStudioEnhanced {...props} projectId={props.project?.id} floorPlanData={props.floorPlanDraft} />;
  if (activeNav === 'packages') return <PackagesScreen {...props} />;
  if (activeNav === 'settings') return <SettingsScreen {...props} />;
  if (activeNav === 'help') return <HelpScreen />;
  return <DashboardScreen {...props} />;
}
