import { useState } from 'react';
import Sidebar, { Screen } from './components/Sidebar';
import Topbar from './components/Topbar';
import CommandCenter from './screens/CommandCenter';
import LeadsCRM from './screens/LeadsCRM';
import FloorPlanAI from './screens/FloorPlanAI';
import DesignStudio from './screens/DesignStudio';
import RenderStudio from './screens/RenderStudio';
import MaterialsBudget from './screens/MaterialsBudget';
import Production from './screens/Production';
import Proposal from './screens/Proposal';
import Approval from './screens/Approval';
import GenericScreen from './screens/GenericScreen';

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('command');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'command': return <CommandCenter />;
      case 'leads': return <LeadsCRM />;
      case 'floor-plan': return <FloorPlanAI />;
      case 'design-studio': return <DesignStudio />;
      case 'render-studio': return <RenderStudio />;
      case 'materials': return <MaterialsBudget />;
      case 'production': return <Production />;
      case 'proposal': return <Proposal />;
      case 'approval': return <Approval />;
      case 'onboarding':
      case 'site-capture':
      case 'drawings':
      case 'deliverables':
      case 'settings':
        return <GenericScreen screen={activeScreen} />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0B]">
      {/* Sidebar */}
      <Sidebar active={activeScreen} onNavigate={setActiveScreen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar screen={activeScreen} onNewProject={() => setActiveScreen('leads')} />
        <main className="flex-1 overflow-hidden">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

export default App;
