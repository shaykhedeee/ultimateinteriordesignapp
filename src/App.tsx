import { useState, useCallback } from 'react';
import { ViewMode, Project, ChatMessage, FurnitureAsset, PBRMaterial, DesignOption } from './types/aura';
import { INITIAL_PROJECT, INITIAL_CHAT_MESSAGES, MOCK_ASSETS } from './data/mockData';
import { ToastProvider, useToast } from './components/ToastProvider';
import { Header } from './components/Header';
import { AuraBrainChat } from './components/AuraBrainChat';
import { AssetCatalog } from './components/AssetCatalog';
import { Viewport3D } from './components/viewport/Viewport3D';
import { FloorPlan2D } from './components/viewport/FloorPlan2D';
import { AiDesignEngine } from './components/modules/AiDesignEngine';
import { ParametricStudio } from './components/modules/ParametricStudio';
import { RenderStudio } from './components/modules/RenderStudio';
import { CommerceBOQ } from './components/modules/CommerceBOQ';
import { BrainArchitecture } from './components/modules/BrainArchitecture';
import { MoodBoard } from './components/modules/MoodBoard';
import { ProjectTimeline } from './components/modules/ProjectTimeline';
import { VRHeadsetModal } from './components/modals/VRHeadsetModal';
import { QuickActions } from './components/QuickActions';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function AppInner() {
  const { addToast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('viewport-3d');
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [activeRoomId, setActiveRoomId] = useState<string>('room-living');
  const [isVRModalOpen, setIsVRModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // ── Undo / Redo ──
  const handleUndo = useCallback(() => {
    if (project.historyIndex <= 0) return;
    setProject(prev => ({ ...prev, historyIndex: prev.historyIndex - 1 }));
    addToast('info', 'Undo', 'Reverted last placement change.');
  }, [project.historyIndex, addToast]);

  const handleRedo = useCallback(() => {
    if (project.historyIndex >= 10) return;
    setProject(prev => ({ ...prev, historyIndex: prev.historyIndex + 1 }));
    addToast('info', 'Redo', 'Re-applied previous change.');
  }, [project.historyIndex, addToast]);

  const handleSave = useCallback(() => {
    addToast('success', 'Project Synced to Cloud', 'CRDT state saved across all collaborators. Yjs snapshot committed to S3 + Redis.');
  }, [addToast]);

  // ── Item modifications ──
  const handleUpdateItemPosition = useCallback((itemId: string, newPos: { x: number; z: number }) => {
    setProject(prev => {
      const updatedItems = prev.placedItems.map(item => {
        if (item.id === itemId) return { ...item, position: { ...item.position, x: newPos.x, z: newPos.z } };
        return item;
      });
      return { ...prev, placedItems: updatedItems, historyIndex: prev.historyIndex + 1 };
    });
  }, []);

  const handleRotateItem = useCallback((itemId: string, degDelta: number) => {
    setProject(prev => {
      const updatedItems = prev.placedItems.map(item => {
        if (item.id === itemId) return { ...item, rotation: { ...item.rotation, y: (item.rotation.y + degDelta) % 360 } };
        return item;
      });
      return { ...prev, placedItems: updatedItems };
    });
    addToast('ai', 'Item Rotated', `Rotated by ${degDelta}° — collision boundaries re-validated.`);
  }, [addToast]);

  const handleDeleteItem = useCallback((itemId: string) => {
    const item = project.placedItems.find(i => i.id === itemId);
    const asset = item ? MOCK_ASSETS.find(a => a.id === item.assetId) : null;
    setProject(prev => ({
      ...prev,
      placedItems: prev.placedItems.filter(i => i.id !== itemId),
      budget: { ...prev.budget, spent: Math.max(0, prev.budget.spent - (asset?.price || 0)) }
    }));
    addToast('warning', 'Item Removed', asset ? `${asset.name} removed. Budget adjusted -$${asset.price}.` : 'Item deleted.');
  }, [project.placedItems, addToast]);

  const handleAddItemToRoom = useCallback((asset: FurnitureAsset) => {
    const newItemId = `item-${Date.now()}`;
    const newItem = {
      id: newItemId,
      assetId: asset.id,
      roomId: activeRoomId,
      position: { x: parseFloat(((Math.random() - 0.5) * 3).toFixed(2)), y: 0, z: parseFloat(((Math.random() - 0.5) * 3).toFixed(2)) },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    setProject(prev => ({
      ...prev,
      placedItems: [...prev.placedItems, newItem],
      budget: { ...prev.budget, spent: prev.budget.spent + asset.price }
    }));
    addToast('success', 'Asset Placed', `${asset.name} (${asset.brand}) inserted into ${project.rooms.find(r => r.id === activeRoomId)?.name || 'room'}.`);
  }, [activeRoomId, project.rooms, addToast]);

  const handleApplyMaterial = useCallback((material: PBRMaterial) => {
    setProject(prev => {
      const updatedRooms = prev.rooms.map(r => {
        if (r.id === activeRoomId) {
          if (material.category === 'Tile' || material.category === 'Wood') {
            return { ...r, floorMaterialId: material.id };
          }
          return { ...r, wallMaterialId: material.id };
        }
        return r;
      });
      return { ...prev, rooms: updatedRooms };
    });
    addToast('success', 'Material Applied', `${material.name} (${material.vendor}) painted onto ${material.category === 'Tile' || material.category === 'Wood' ? 'floor' : 'wall'} surfaces.`);
  }, [activeRoomId, addToast]);

  // ── AI Chat Orchestration ──
  const handleSendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };
    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let auraMsg: ChatMessage;

      if (lower.includes('color') || lower.includes('palette') || lower.includes('blue') || lower.includes('green') || lower.includes('paint')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I analyzed 2.3M Japandi palettes from the Pinecone Vector DB. The 60-30-10 rule suggests: 60% Warm Alabaster walls, 30% European Oak floors, 10% Brushed Brass accents.',
          actionPreview: {
            title: 'AI Cohesive Color Palette Applied',
            changes: ['60% Warm Alabaster + 30% European Oak + 10% Brass', 'Color harmony score: 97/100', 'PBR texture roughness calibrated for evening light'],
            costImpact: 0,
            visualQualityImpact: 4.9,
            executableActionType: 'restyle'
          },
          actions: [{ label: 'Apply Palette Globally', actionId: 'act-palette-apply', variant: 'primary' }]
        };
      } else if (lower.includes('mood') || lower.includes('inspiration')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I curated a mood board with 12 inspirational images and 5 cohesive colors from the Japandi aesthetic. You can find it in the Mood Board module.',
          actionPreview: {
            title: 'Japandi Mood Board Generated',
            changes: ['12 high-resolution inspiration images', '5-color AI-extracted palette (#eae6df base)', 'Style cohesion score: 94/100'],
            costImpact: 0,
            visualQualityImpact: 5,
            executableActionType: 'restyle'
          },
          actions: [
            { label: 'Open Mood Board', actionId: 'act-open-mood', variant: 'primary' },
            { label: 'Export as Client PDF', actionId: 'act-export-mood', variant: 'secondary' }
          ]
        };
      } else if (lower.includes('budget') || lower.includes('cost') || lower.includes('cheap') || lower.includes('price')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I ran the Cost Optimization Engine across our multi-vendor catalog. By swapping the Carrara stone for Quartz and choosing IKEA modular oak pieces, we save $4,450 instantly without reducing visual quality.',
          actionPreview: {
            title: 'Automated $4,450 Budget Reduction',
            changes: ['Marble → Calacatta Gold Quartz (-$2,400)', 'Designer Table → IKEA Kanto Solid Oak (-$1,100)', 'Laminate Core Wardrobes (-$950)'],
            costImpact: -4450,
            visualQualityImpact: 4.8,
            executableActionType: 'budget-cut'
          },
          actions: [{ label: 'Apply Optimization', actionId: 'act-budget-cut', variant: 'primary' }]
        };
      } else if (lower.includes('layout') || lower.includes('arrange') || lower.includes('furniture')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Generated 3 alternative furniture arrangements scored by Spatial Planning GNN for traffic flow and conversation distance. Option A scored 94/100.',
          actionPreview: {
            title: 'Japandi Zen Layout (Score 94)',
            changes: ['Sofa rotated 45° towards morning sun', 'Travertine table centered on focal axis', '38" unobstructed walkways validated'],
            costImpact: 0,
            visualQualityImpact: 5,
            executableActionType: 'restyle'
          },
          actions: [{ label: 'Inject Layout to Viewport', actionId: 'act-restyle', variant: 'primary' }]
        };
      } else if (lower.includes('light') || lower.includes('warm') || lower.includes('evening')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Adjusting color temperature of cove lighting from 4000K → 2700K, applying warm herringbone European oak flooring, and swapping the cool gray sofa for rich camel leather.',
          actionPreview: {
            title: 'Warm Evening Gathering Ambiance',
            changes: ['Lighting set to 2700K Warm White (CRI 98)', 'Flooring → Chevron Herringbone Oak', 'Sofa → Hamilton Camel Leather'],
            costImpact: -650,
            visualQualityImpact: 5,
            executableActionType: 'lighting-warm'
          },
          actions: [
            { label: 'Apply Changes', actionId: 'act-warm-apply', variant: 'primary' },
            { label: 'Show Alternatives', actionId: 'act-warm-alt', variant: 'secondary' }
          ]
        };
      } else if (lower.includes('3d') || lower.includes('viewport') || lower.includes('walkthrough')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Switching to the 3D WebGPU Viewport with real-time PBR rendering at 60fps. You can drag furniture, paint materials, and adjust the circadian sun position.',
          actions: [{ label: 'Open 3D Viewport', actionId: 'act-open-3d', variant: 'primary' }]
        };
      } else {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Understood: "${text}". I'm orchestrating the Design Agent, Spatial Planning GNN, and Commerce Engine to refine the active Japandi design.`,
          actionPreview: {
            title: 'AI Spatial & Mood Refinement',
            changes: ['Indirect lighting calibrated to 2700K', 'PBR textures re-baked with DDGI global illumination', 'Furniture collision boundaries verified'],
            costImpact: 350,
            visualQualityImpact: 4.9,
            executableActionType: 'lighting-warm'
          },
          actions: [{ label: 'Apply to Design', actionId: 'act-general-apply', variant: 'primary' }]
        };
      }
      setChatMessages(prev => [...prev, auraMsg]);
      addToast('ai', 'AURA Brain Responded', `Orchestrated ${auraMsg.actionPreview ? 'action preview' : 'response'} in 42ms via LLaMA 3.1 70B.`);
    }, 1200);
  }, [addToast]);

  const handleExecuteAction = useCallback((actionId: string, preview?: ChatMessage['actionPreview']) => {
    if (preview?.costImpact) {
      setProject(prev => ({
        ...prev,
        budget: { ...prev.budget, spent: Math.max(0, prev.budget.spent + preview.costImpact) }
      }));
    }
    if (actionId.includes('nook')) {
      const nookAsset = MOCK_ASSETS.find(a => a.id === 'ast-bench-nook') || MOCK_ASSETS[3];
      handleAddItemToRoom(nookAsset);
    }
    if (actionId.includes('open-mood')) setCurrentView('mood-board');
    if (actionId.includes('open-3d')) setCurrentView('viewport-3d');

    addToast('success', 'Action Executed', `"${preview?.title || actionId}" applied. WebGPU viewport & CRDT state synced.`);
  }, [addToast, handleAddItemToRoom]);

  // ── Quick Action handler ──
  const handleQuickAction = useCallback((action: string) => {
    if (action === 'optimize-budget') {
      handleSendMessage('Optimize the budget by 20% without losing the Japandi style.');
    }
  }, [handleSendMessage]);

  // ── Design Option Selection ──
  const handleSelectOption = useCallback((option: DesignOption) => {
    setProject(prev => ({
      ...prev,
      activeOptionId: option.id,
      placedItems: option.rooms[0]?.items || prev.placedItems,
      budget: { ...prev.budget, spent: option.totalCost }
    }));
    setCurrentView('viewport-3d');
    addToast('success', 'Design Option Activated', `${option.styleName} (Score: ${option.score}/100, $${option.totalCost.toLocaleString()}) loaded into 3D Viewport.`);
  }, [addToast]);

  // ── Keyboard Shortcuts ──
  useKeyboardShortcuts({
    'cmd+z': handleUndo,
    'cmd+shift+z': handleRedo,
    'cmd+s': handleSave,
    'cmd+1': () => setCurrentView('viewport-3d'),
    'cmd+2': () => setCurrentView('floorplan-2d'),
    'cmd+g': () => setCurrentView('ai-generator'),
    'cmd+r': () => setCurrentView('render-studio'),
    'cmd+m': () => setCurrentView('mood-board'),
    'cmd+t': () => setCurrentView('project-timeline'),
    'cmd+b': () => setCurrentView('commerce-boq'),
    'cmd+k': () => setCurrentView('brain-arch'),
    'cmd+p': () => setIsCommandPaletteOpen(prev => !prev),
    'delete': () => {
      const lastPlaced = project.placedItems[project.placedItems.length - 1];
      if (lastPlaced) handleDeleteItem(lastPlaced.id);
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        project={project}
        onProjectSwitch={(name) => setProject(prev => ({ ...prev, name }))}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onTriggerRender={() => setCurrentView('render-studio')}
        onOpenVRModal={() => setIsVRModalOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Quick Actions Sidebar (desktop only) */}
        <QuickActions
          currentView={currentView}
          onNavigate={setCurrentView}
          onQuickAction={handleQuickAction}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentView === 'viewport-3d' && (
            <Viewport3D
              rooms={project.rooms}
              placedItems={project.placedItems}
              onUpdateItemPosition={handleUpdateItemPosition}
              onRotateItem={handleRotateItem}
              onDeleteItem={handleDeleteItem}
              onSelectRoom={setActiveRoomId}
              activeRoomId={activeRoomId}
              onTriggerRender={() => setCurrentView('render-studio')}
            />
          )}
          {currentView === 'floorplan-2d' && (
            <FloorPlan2D
              rooms={project.rooms}
              placedItems={project.placedItems}
              onSelectRoom={setActiveRoomId}
              activeRoomId={activeRoomId}
            />
          )}
          {currentView === 'ai-generator' && (
            <AiDesignEngine onSelectOption={handleSelectOption} activeOptionId={project.activeOptionId} />
          )}
          {currentView === 'parametric' && <ParametricStudio />}
          {currentView === 'render-studio' && <RenderStudio onTriggerVR={() => setIsVRModalOpen(true)} />}
          {currentView === 'commerce-boq' && <CommerceBOQ project={project} />}
          {currentView === 'brain-arch' && <BrainArchitecture />}
          {currentView === 'mood-board' && <MoodBoard />}
          {currentView === 'project-timeline' && <ProjectTimeline />}

          {(currentView === 'viewport-3d' || currentView === 'floorplan-2d') && (
            <AssetCatalog
              onAddItemToRoom={handleAddItemToRoom}
              onApplyMaterial={handleApplyMaterial}
              project={project}
            />
          )}
        </main>

        <AuraBrainChat
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onExecuteAction={handleExecuteAction}
          project={project}
        />
      </div>

      <VRHeadsetModal isOpen={isVRModalOpen} onClose={() => setIsVRModalOpen(false)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
        onAction={handleQuickAction}
        onOpenVR={() => { setIsCommandPaletteOpen(false); setIsVRModalOpen(true); }}
        onTriggerRender={() => { setIsCommandPaletteOpen(false); setCurrentView('render-studio'); }}
      />
      <StatusBar project={project} currentView={currentView} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
