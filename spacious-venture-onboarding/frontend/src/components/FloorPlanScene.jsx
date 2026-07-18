import React, { useMemo, useRef, useState } from 'react';
import { Crosshair, ImagePlus, MapPin, Move, Square, Trash2 } from 'lucide-react';
import { classNames, floorPlanComponentTypes, roomOptions } from '../data/studioData.js';
import { Button } from './ui/index.js';

const emptyAnnotations = { zones: [], markers: [] };
const emptyFloorPlanDraft = {
  file: null,
  fileName: '',
  fileType: '',
  previewUrl: '',
  annotations: emptyAnnotations,
  analysis: { zoneCount: 0, markerCount: 0, rooms: [], components: [], furnitureRequirements: [] }
};

export function FloorPlanScene({
  form,
  floorPlanDraft = emptyFloorPlanDraft,
  onFloorPlanChange = () => {},
  onUpdateForm = () => {}
}) {
  const planRef = useRef(null);
  const [tool, setTool] = useState('zone');
  const [selectedId, setSelectedId] = useState('');
  const [drawStart, setDrawStart] = useState(null);
  const [drawRect, setDrawRect] = useState(null);
  const [dragState, setDragState] = useState({
    itemId: null,
    type: null, // 'move_pin', 'move_box', 'resize'
    corner: null,
    startMouse: null,
    startCoords: null
  });

  const selectedRooms = useMemo(
    () => roomOptions.filter((room) => form.selectedSpaces.includes(room.id)),
    [form.selectedSpaces]
  );
  const roomChoices = selectedRooms.length ? selectedRooms : roomOptions;
  const annotations = {
    zones: floorPlanDraft?.annotations?.zones || [],
    markers: floorPlanDraft?.annotations?.markers || []
  };
  const selectedItem =
    annotations.zones.find((zone) => zone.id === selectedId) ||
    annotations.markers.find((marker) => marker.id === selectedId);

  function updateDraft(next) {
    onFloorPlanChange({
      ...emptyFloorPlanDraft,
      ...floorPlanDraft,
      annotations: {
        zones: next.zones || [],
        markers: next.markers || []
      },
      analysis: buildFloorPlanAnalysis(next, floorPlanDraft.analysis)
    });
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onFloorPlanChange({
      ...emptyFloorPlanDraft,
      ...floorPlanDraft,
      file,
      fileName: file.name,
      fileType: file.type || '',
      previewUrl,
      annotations,
      analysis: buildFloorPlanAnalysis(annotations, floorPlanDraft.analysis)
    });
  }

  function pointFromEvent(event) {
    const rect = planRef.current.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100)
    };
  }

  function handlePointerDown(event) {
    if (!planRef.current) return;
    const point = pointFromEvent(event);
    const rect = planRef.current.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    // 1. Check if clicked near/on selected item's resize handles (if it's a zone)
    if (selectedItem && selectedItem.kind === 'zone') {
      const zX = (selectedItem.x / 100) * rect.width;
      const zY = (selectedItem.y / 100) * rect.height;
      const zW = (selectedItem.w / 100) * rect.width;
      const zH = (selectedItem.h / 100) * rect.height;
      const handleSize = 16; // hit target radius
      
      const corners = [
        { name: 'tl', x: zX, y: zY },
        { name: 'tr', x: zX + zW, y: zY },
        { name: 'bl', x: zX, y: zY + zH },
        { name: 'br', x: zX + zW, y: zY + zH }
      ];
      
      for (const corner of corners) {
        const dist = Math.hypot(clientX - corner.x, clientY - corner.y);
        if (dist <= handleSize) {
          event.stopPropagation();
          setDragState({
            itemId: selectedItem.id,
            type: 'resize',
            corner: corner.name,
            startMouse: { x: event.clientX, y: event.clientY },
            startCoords: { x: selectedItem.x, y: selectedItem.y, w: selectedItem.w, h: selectedItem.h }
          });
          return;
        }
      }
      
      // 2. Check if clicked inside selected zone to move it
      if (clientX >= zX && clientX <= zX + zW && clientY >= zY && clientY <= zY + zH) {
        event.stopPropagation();
        setDragState({
          itemId: selectedItem.id,
          type: 'move_box',
          startMouse: { x: event.clientX, y: event.clientY },
          startCoords: { x: selectedItem.x, y: selectedItem.y, w: selectedItem.w, h: selectedItem.h }
        });
        return;
      }
    }
    
    // 3. Check if clicked near any marker pin (to drag/move it)
    for (const marker of annotations.markers) {
      const mX = (marker.x / 100) * rect.width;
      const mY = (marker.y / 100) * rect.height;
      const dist = Math.hypot(clientX - mX, clientY - mY);
      
      if (dist <= 25) {
        event.stopPropagation();
        setSelectedId(marker.id);
        setDragState({
          itemId: marker.id,
          type: 'move_pin',
          startMouse: { x: event.clientX, y: event.clientY },
          startCoords: { x: marker.x, y: marker.y }
        });
        return;
      }
    }
    
    // 4. Clicked inside another zone to select it and start dragging
    for (const zone of annotations.zones) {
      const zX = (zone.x / 100) * rect.width;
      const zY = (zone.y / 100) * rect.height;
      const zW = (zone.w / 100) * rect.width;
      const zH = (zone.h / 100) * rect.height;
      
      if (clientX >= zX && clientX <= zX + zW && clientY >= zY && clientY <= zY + zH) {
        event.stopPropagation();
        setSelectedId(zone.id);
        setDragState({
          itemId: zone.id,
          type: 'move_box',
          startMouse: { x: event.clientX, y: event.clientY },
          startCoords: { x: zone.x, y: zone.y, w: zone.w, h: zone.h }
        });
        return;
      }
    }

    // Default to drawing a zone or placing a marker
    if (tool === 'zone') {
      setDrawStart(point);
      setDrawRect({ x: point.x, y: point.y, w: 0, h: 0 });
      return;
    }
    if (tool === 'marker') {
      const marker = createMarker(point, roomChoices[0]?.id || 'living');
      updateDraft({ ...annotations, markers: [...annotations.markers, marker] });
      setSelectedId(marker.id);
    }
  }

  function handlePointerMove(event) {
    if (dragState.itemId) {
      event.preventDefault();
      const rect = planRef.current.getBoundingClientRect();
      const dx = ((event.clientX - dragState.startMouse.x) / rect.width) * 100;
      const dy = ((event.clientY - dragState.startMouse.y) / rect.height) * 100;
      
      if (dragState.type === 'move_pin') {
        const zones = annotations.zones;
        const markers = annotations.markers.map((marker) => {
          if (marker.id === dragState.itemId) {
            return {
              ...marker,
              x: Math.max(0, Math.min(100, dragState.startCoords.x + dx)),
              y: Math.max(0, Math.min(100, dragState.startCoords.y + dy))
            };
          }
          return marker;
        });
        updateDraft({ zones, markers });
      } else if (dragState.type === 'move_box') {
        const markers = annotations.markers;
        const zones = annotations.zones.map((zone) => {
          if (zone.id === dragState.itemId) {
            return {
              ...zone,
              x: Math.max(0, Math.min(100 - zone.w, dragState.startCoords.x + dx)),
              y: Math.max(0, Math.min(100 - zone.h, dragState.startCoords.y + dy))
            };
          }
          return zone;
        });
        updateDraft({ zones, markers });
      } else if (dragState.type === 'resize') {
        const markers = annotations.markers;
        const zones = annotations.zones.map((zone) => {
          if (zone.id === dragState.itemId) {
            const minSize = 3;
            if (dragState.corner === 'tl') {
              const newX = Math.max(0, dragState.startCoords.x + dx);
              const newW = dragState.startCoords.w - dx;
              const newY = Math.max(0, dragState.startCoords.y + dy);
              const newH = dragState.startCoords.h - dy;
              return {
                ...zone,
                x: newW >= minSize ? newX : zone.x,
                w: newW >= minSize ? newW : zone.w,
                y: newH >= minSize ? newY : zone.y,
                h: newH >= minSize ? newH : zone.h
              };
            } else if (dragState.corner === 'tr') {
              const newW = dragState.startCoords.w + dx;
              const newY = Math.max(0, dragState.startCoords.y + dy);
              const newH = dragState.startCoords.h - dy;
              return {
                ...zone,
                w: newW >= minSize ? Math.min(100 - zone.x, newW) : zone.w,
                y: newH >= minSize ? newY : zone.y,
                h: newH >= minSize ? newH : zone.h
              };
            } else if (dragState.corner === 'bl') {
              const newX = Math.max(0, dragState.startCoords.x + dx);
              const newW = dragState.startCoords.w - dx;
              const newH = dragState.startCoords.h + dy;
              return {
                ...zone,
                x: newW >= minSize ? newX : zone.x,
                w: newW >= minSize ? newW : zone.w,
                h: newH >= minSize ? Math.min(100 - zone.y, newH) : zone.h
              };
            } else if (dragState.corner === 'br') {
              const newW = dragState.startCoords.w + dx;
              const newH = dragState.startCoords.h + dy;
              return {
                ...zone,
                w: newW >= minSize ? Math.min(100 - zone.x, newW) : zone.w,
                h: newH >= minSize ? Math.min(100 - zone.y, newH) : zone.h
              };
            }
          }
          return zone;
        });
        updateDraft({ zones, markers });
      }
      return;
    }
    
    if (!drawStart || tool !== 'zone') return;
    const point = pointFromEvent(event);
    setDrawRect(normalizeRect(drawStart, point));
  }

  function handlePointerUp(event) {
    if (dragState.itemId) {
      setDragState({
        itemId: null,
        type: null,
        corner: null,
        startMouse: null,
        startCoords: null
      });
      return;
    }
    if (!drawStart || tool !== 'zone') return;
    const point = pointFromEvent(event);
    const rect = normalizeRect(drawStart, point);
    setDrawStart(null);
    setDrawRect(null);
    if (rect.w < 3 || rect.h < 3) return;
    const zone = createZone(rect, roomChoices[0]?.id || 'living');
    updateDraft({ ...annotations, zones: [...annotations.zones, zone] });
    setSelectedId(zone.id);
  }

  function addDefaultZone() {
    const zone = createZone({ x: 12, y: 12, w: 34, h: 26 }, roomChoices[0]?.id || 'living');
    updateDraft({ ...annotations, zones: [...annotations.zones, zone] });
    setSelectedId(zone.id);
  }

  function addDefaultMarker(type = 'TV Unit') {
    const marker = createMarker({ x: 50, y: 50 }, roomChoices[0]?.id || 'living', type);
    updateDraft({ ...annotations, markers: [...annotations.markers, marker] });
    setSelectedId(marker.id);
  }

  function quickAddZone(roomId) {
    const zone = createZone(
      { x: 10 + (annotations.zones.length * 3) % 22, y: 10 + (annotations.zones.length * 4) % 18, w: 30, h: 22 },
      roomId || roomChoices[0]?.id || 'living'
    );
    updateDraft({ ...annotations, zones: [...annotations.zones, zone] });
    setSelectedId(zone.id);
  }

  function quickAddMarker(type, roomId) {
    const marker = createMarker(
      {
        x: 48 + (annotations.markers.length * 5) % 12,
        y: 48 + (annotations.markers.length * 3) % 12
      },
      roomId || roomChoices[0]?.id || 'living',
      type
    );
    updateDraft({ ...annotations, markers: [...annotations.markers, marker] });
    setSelectedId(marker.id);
  }

  function updateSelected(field, value) {
    if (!selectedItem) return;
    const zones = annotations.zones.map((zone) => zone.id === selectedItem.id ? { ...zone, [field]: value } : zone);
    const markers = annotations.markers.map((marker) => marker.id === selectedItem.id ? { ...marker, [field]: value } : marker);
    updateDraft({ zones, markers });
  }

  function updateCalibration(field, value) {
    updateCalibrationPatch({ [field]: value });
  }

  function updateCalibrationPatch(patch) {
    onFloorPlanChange({
      ...emptyFloorPlanDraft,
      ...floorPlanDraft,
      analysis: {
        ...(floorPlanDraft.analysis || {}),
        calibration: {
          ...(floorPlanDraft.analysis?.calibration || {}),
          ...patch
        }
      }
    });
  }

  function calibrateFromSelectedZone() {
    if (!selectedItem || selectedItem.kind !== 'zone') return;
    const knownLengthMm = floorPlanDraft.analysis?.calibration?.knownLengthMm;
    if (!knownLengthMm) return;
    updateCalibrationPatch({
      referencePercent: Number(selectedItem.w || 0).toFixed(2),
      note: `${roomLabel(selectedItem.room, roomChoices)} width calibrated from selected room zone`
    });
  }

  function deleteSelected() {
    if (!selectedItem) return;
    updateDraft({
      zones: annotations.zones.filter((zone) => zone.id !== selectedItem.id),
      markers: annotations.markers.filter((marker) => marker.id !== selectedItem.id)
    });
    setSelectedId('');
  }

  return (
    <section className="canvas-zone floor-plan-scene">
      <div className="floor-plan-header">
        <div>
          <span>Floor Plan & Layout</span>
          <h1>Mark spaces before generation</h1>
          <p>Upload a plan, draw room zones, place component markers, and type exact furniture requirements for AI prompts.</p>
        </div>
        <label className="btn btn-gold btn-md floor-upload-button">
          <ImagePlus size={17} /> Upload Plan
          <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleUpload} />
        </label>
      </div>

      <div className="floor-plan-workbench">
        <div className="floor-plan-tools">
          <Button variant={tool === 'zone' ? 'gold' : 'ghost'} size="sm" onClick={() => setTool('zone')}><Square size={15} /> Draw room zone</Button>
          <Button variant={tool === 'marker' ? 'gold' : 'ghost'} size="sm" onClick={() => setTool('marker')}><MapPin size={15} /> Place component</Button>
          <Button variant="ghost" size="sm" onClick={addDefaultZone}><Crosshair size={15} /> Add zone</Button>
          <Button variant="ghost" size="sm" onClick={addDefaultMarker}><Move size={15} /> Add marker</Button>
        </div>

        <div className="floor-plan-quick-actions">
          {roomChoices.slice(0, 4).map((room) => (
            <button key={room.id} type="button" className="quick-action-chip" onClick={() => quickAddZone(room.id)}>
              + {room.label}
            </button>
          ))}
          {['TV Unit', 'Sofa', 'Wardrobe', 'Mandir'].map((type) => (
            <button key={type} type="button" className="quick-action-chip alt" onClick={() => quickAddMarker(type)}>
              + {type}
            </button>
          ))}
        </div>

        <div
          className={classNames('plan-canvas', floorPlanDraft?.previewUrl && 'has-plan')}
          ref={planRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {floorPlanDraft?.previewUrl ? (
            floorPlanDraft.fileType?.includes('pdf') ? (
              <iframe src={`${floorPlanDraft.previewUrl}#page=1&toolbar=0`} title="Floor plan PDF preview" />
            ) : (
              <img src={floorPlanDraft.previewUrl} alt="Uploaded floor plan" />
            )
          ) : (
            <div className="plan-placeholder">
              <ImagePlus size={28} />
              <strong>Upload a floor plan image or PDF</strong>
              <span>Then draw zones and place markers over the plan.</span>
            </div>
          )}
          <div className="plan-overlay" aria-hidden="true">
            {annotations.zones.map((zone) => (
              <button
                key={zone.id}
                className={classNames('zone-box', selectedId === zone.id && 'selected')}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  '--zone-color': roomColor(zone.room)
                }}
                onClick={(event) => { event.stopPropagation(); setSelectedId(zone.id); }}
              >
                {roomLabel(zone.room, roomChoices)}
                {selectedId === zone.id && (
                  <>
                    <span className="resize-handle tl" />
                    <span className="resize-handle tr" />
                    <span className="resize-handle bl" />
                    <span className="resize-handle br" />
                  </>
                )}
              </button>
            ))}
            {annotations.markers.map((marker) => (
              <button
                key={marker.id}
                className={classNames('component-marker', selectedId === marker.id && 'selected')}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                onClick={(event) => { event.stopPropagation(); setSelectedId(marker.id); }}
              >
                {marker.type}
              </button>
            ))}
            {drawRect && (
              <span
                className="zone-box draft"
                style={{ left: `${drawRect.x}%`, top: `${drawRect.y}%`, width: `${drawRect.w}%`, height: `${drawRect.h}%` }}
              />
            )}
          </div>
        </div>

        <aside className="floor-plan-editor">
          <div className="floor-plan-stats">
            <strong>{floorPlanDraft.fileName || 'Plan not uploaded'}</strong>
            <span>{annotations.zones.length} zones - {annotations.markers.length} markers</span>
          </div>
          <label>Layout notes<textarea rows="4" value={form.floorPlanNotes} onChange={(event) => onUpdateForm('floorPlanNotes', event.target.value)} /></label>
          <div className="selected-layout-card calibration-card">
            <strong>Known wall length</strong>
            <p className="floor-plan-help">Draw a room zone, select it, then enter one real wall/room width from the plan or site measurement.</p>
            <label>Real selected-zone width<input type="number" value={floorPlanDraft.analysis?.calibration?.knownLengthMm || ''} onChange={(event) => updateCalibration('knownLengthMm', event.target.value)} placeholder="Example: 3600 mm" /></label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!selectedItem || selectedItem.kind !== 'zone' || !floorPlanDraft.analysis?.calibration?.knownLengthMm}
              onClick={calibrateFromSelectedZone}
            >
              Use selected zone width
            </button>
            <small>{floorPlanDraft.analysis?.calibration?.referencePercent ? `Scale set from ${floorPlanDraft.analysis.calibration.referencePercent}% of the plan width.` : 'No percent math needed. Select a zone and click the button.'}</small>
            <p className="floor-plan-help">These are estimated dimensions for briefing and render prompts. Final cutlists still need verified site measurements.</p>
          </div>
          {selectedItem ? (
            <div className="selected-layout-card">
              <strong>{selectedItem.kind === 'zone' ? 'Room zone' : 'Component marker'}</strong>
              <label>Room<select value={selectedItem.room} onChange={(event) => updateSelected('room', event.target.value)}>
                {roomChoices.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
              </select></label>
              {selectedItem.kind === 'zone' ? (
                <label>Zone label<input value={selectedItem.label} onChange={(event) => updateSelected('label', event.target.value)} /></label>
              ) : (
                <>
                  <label>Component<select value={selectedItem.type} onChange={(event) => updateSelected('type', event.target.value)}>
                    {floorPlanComponentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select></label>
                  <label>Placement note<input value={selectedItem.placementNote} onChange={(event) => updateSelected('placementNote', event.target.value)} placeholder="Example: on east wall facing sofa" /></label>
                  <label>Size note<input value={selectedItem.sizeNote} onChange={(event) => updateSelected('sizeNote', event.target.value)} placeholder="Example: 8 ft floating unit" /></label>
                  <ComponentStyleShortcuts item={selectedItem} onApply={(text) => updateSelected('furnitureRequirement', appendRequirement(selectedItem.furnitureRequirement, text))} />
                  <label>Furniture requirement<textarea rows="3" value={selectedItem.furnitureRequirement} onChange={(event) => updateSelected('furnitureRequirement', event.target.value)} placeholder="Example: floating walnut TV unit with fluted backing" /></label>
                </>
              )}
              <Button variant="danger" size="sm" fullWidth onClick={deleteSelected}><Trash2 size={15} /> Delete selected</Button>
            </div>
          ) : (
            <p className="floor-plan-help">Select a zone or marker to edit room, placement, size, and furniture requirements.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function createZone(rect, room) {
  return {
    id: `zone-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    kind: 'zone',
    room,
    label: roomLabel(room, roomOptions),
    ...rect
  };
}

function createMarker(point, room, type = 'TV Unit') {
  return {
    id: `marker-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    kind: 'marker',
    room,
    type,
    x: point.x,
    y: point.y,
    placementNote: '',
    sizeNote: '',
    furnitureRequirement: ''
  };
}

function normalizeRect(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y)
  };
}

function buildFloorPlanAnalysis(annotations, previousAnalysis = {}) {
  const zones = annotations.zones || [];
  const markers = annotations.markers || [];
  return {
    ...(previousAnalysis || {}),
    zoneCount: zones.length,
    markerCount: markers.length,
    rooms: [...new Set([...zones.map((zone) => zone.room), ...markers.map((marker) => marker.room)])],
    components: [...new Set(markers.map((marker) => marker.type))],
    furnitureRequirements: markers.map((marker) => marker.furnitureRequirement).filter(Boolean),
    calibration: previousAnalysis?.calibration || {}
  };
}

function ComponentStyleShortcuts({ item, onApply }) {
  const options = componentStyleOptions(item?.type);
  if (!options.length) return null;
  return (
    <div className="component-style-shortcuts">
      <span>Style shortcuts</span>
      <div>
        {options.map((option) => (
          <button key={option} type="button" className="quick-action-chip alt" onClick={() => onApply(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function componentStyleOptions(type = '') {
  const key = type.toLowerCase();
  if (key.includes('tv')) return [
    'floating TV unit with fluted back panel',
    'full-height marble-look TV wall with brass trims',
    'low console with concealed storage',
    'hidden-door rafter panel and warm cove lighting'
  ];
  if (key.includes('sofa')) return [
    'L-shaped sectional facing TV wall',
    'three-seater sofa with two accent chairs',
    'low-profile warm beige sofa',
    'olive green sofa with rust cushions'
  ];
  if (key.includes('kitchen')) return [
    'parallel modular kitchen with anti-fingerprint matte shutters',
    'L-shaped kitchen with tall unit and appliance garage',
    'island counter with pendant lighting',
    'easy-clean dado and high storage lofts'
  ];
  if (key.includes('wardrobe')) return [
    'sliding wardrobe with loft storage',
    'hinged wardrobe with dresser niche',
    'fluted glass and laminate shutter mix',
    'handleless wardrobe with warm woodgrain finish'
  ];
  if (key.includes('mandir') || key.includes('pooja')) return [
    'compact mandir niche with jali side panels',
    'backlit brass and marble mandir wall',
    'drawer storage below pooja counter',
    'traditional bells with warm concealed lighting'
  ];
  if (key.includes('bed')) return [
    'queen bed with upholstered headboard',
    'bed back wall with vertical laminate panelling',
    'side tables with pendant lights',
    'storage bed with soft warm palette'
  ];
  return ['custom built-in storage', 'warm laminate and cove lighting', 'minimal handleless module'];
}

function appendRequirement(current = '', addition = '') {
  if (!addition) return current;
  if (!current) return addition;
  if (current.includes(addition)) return current;
  return `${current}; ${addition}`;
}

function roomLabel(roomId, rooms) {
  return rooms.find((room) => room.id === roomId)?.label || roomId;
}

const roomColors = {
  living: 'rgba(189, 147, 74, 0.15)',
  kitchen: 'rgba(135, 145, 113, 0.2)',
  master: 'rgba(122, 77, 45, 0.15)',
  kids: 'rgba(210, 173, 103, 0.15)',
  pooja: 'rgba(212, 175, 55, 0.12)',
  foyer: 'rgba(100, 100, 100, 0.12)',
  dining: 'rgba(160, 120, 80, 0.15)',
  guest: 'rgba(80, 140, 160, 0.12)',
  study: 'rgba(80, 100, 140, 0.12)',
  balcony: 'rgba(100, 160, 120, 0.12)',
  utility: 'rgba(140, 130, 110, 0.12)'
};

function roomColor(roomId) {
  return roomColors[roomId] || 'rgba(189, 147, 74, 0.08)';
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}
