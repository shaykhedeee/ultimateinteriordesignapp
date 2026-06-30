import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Bookmark, ChevronLeft, ChevronRight, Home, MoreVertical, PanelTop, Upload, Loader2, FileText } from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { categoryTabs, classNames, materialStrip, roomOptions, showcaseImages } from '../data/studioData.js';

const roomMapping = {
  living: 'living-room',
  kitchen: 'kitchen',
  master: 'bedroom',
  kids: 'bedroom',
  pooja: 'pooja-unit',
  foyer: 'foyer',
  dining: 'dining-area'
};

export function MoodboardCanvas({ form, activeRoom, setActiveRoom, activeMoodboard, floorPlanDraft, project }) {
  const [activeView, setActiveView] = useState('Brief Board'); // 'Brief Board' | 'Reference' | 'Plan'
  const [selectedCategory, setSelectedCategory] = useState('All Elements');
  const [referenceImages, setReferenceImages] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  const selectedRoomOptions = roomOptions.filter((room) => form.selectedSpaces.includes(room.id));
  const generatedImages = activeMoodboard?.assets?.map((asset) => assetUrl(asset.url)) || [];
  const activeImages = [...generatedImages, ...(showcaseImages[activeRoom] || showcaseImages.living)].slice(0, 4);
  const activeRoomLabel = activeRoom === 'whole-home'
    ? 'Whole Home'
    : selectedRoomOptions.find((room) => room.id === activeRoom)?.label || 'Living Room';

  // Load references when view is switched to 'Reference'
  useEffect(() => {
    if (activeView === 'Reference') {
      setLoadingReferences(true);
      fetch('/api/newinfo-library')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setReferenceImages(data.images || []);
          }
        })
        .catch((err) => console.error('Error fetching reference images:', err))
        .finally(() => setLoadingReferences(false));
    }
  }, [activeView]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('referenceImage', file);
    formData.append('category', activeRoom);

    try {
      const response = await fetch('/api/reference-library/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        // Prepend the new uploaded image
        setReferenceImages((prev) => [
          {
            id: `upload-${Date.now()}`,
            url: data.url,
            title: data.title,
            category: activeRoom,
            source: 'gemini-api',
            tags: [activeRoom]
          },
          ...prev
        ]);
      }
    } catch (error) {
      console.error('Error uploading reference image:', error);
    } finally {
      setUploading(false);
    }
  };

  // Filter reference images based on room and category tabs
  const filteredReferences = React.useMemo(() => {
    const mappedRoom = roomMapping[activeRoom] || activeRoom;
    return referenceImages.filter((img) => {
      // Filter by room
      const matchesRoom =
        activeRoom === 'whole-home' ||
        img.category?.toLowerCase().includes(activeRoom.toLowerCase()) ||
        img.url?.toLowerCase().includes(mappedRoom.toLowerCase());

      if (!matchesRoom) return false;

      // Filter by category tab
      if (selectedCategory === 'All Elements') return true;

      const catLower = selectedCategory.toLowerCase();
      // Match by title keywords or tag keywords
      return (
        img.title?.toLowerCase().includes(catLower) ||
        img.category?.toLowerCase().includes(catLower) ||
        img.tags?.some((t) => t.toLowerCase().includes(catLower))
      );
    });
  }, [referenceImages, activeRoom, selectedCategory]);

  return (
    <section className="canvas-zone">
      <div className="room-header">
        <div>
          <button className="back-button" aria-label="Back"><ArrowLeft size={18} /></button>
          <h1>{activeRoomLabel}</h1>
          <span>PDF Brief Direction - Warm Contemporary Indian</span>
        </div>
        <div className="room-actions">
          <button aria-label="Panel"><PanelTop size={16} /></button>
          <button aria-label="Save"><Bookmark size={16} /></button>
          <button aria-label="More"><MoreVertical size={16} /></button>
          <div className="view-toggle">
            <button 
              className={classNames(activeView === 'Brief Board' && 'active')}
              onClick={() => setActiveView('Brief Board')}
            >
              Brief Board
            </button>
            <button 
              className={classNames(activeView === 'Reference' && 'active')}
              onClick={() => setActiveView('Reference')}
            >
              Reference
            </button>
            <button 
              className={classNames(activeView === 'Plan' && 'active')}
              onClick={() => setActiveView('Plan')}
            >
              Plan
            </button>
          </div>
        </div>
      </div>

      <nav className="room-tabs">
        <button className={classNames(activeRoom === 'whole-home' && 'active')} onClick={() => setActiveRoom('whole-home')}><Home size={16} /> Whole home</button>
        {selectedRoomOptions.map((room) => (
          <button key={room.id} className={classNames(activeRoom === room.id && 'active')} onClick={() => setActiveRoom(room.id)}>{room.label}</button>
        ))}
      </nav>

      <nav className="category-tabs">
        {categoryTabs.map((tab) => (
          <button 
            key={tab} 
            className={classNames(selectedCategory === tab && 'active')}
            onClick={() => setSelectedCategory(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* RENDER ACTIVE VIEW */}
      {activeView === 'Brief Board' && (
        <div className="moodboard-stage">
          <div className="material-column">
            {materialStrip.slice(0, 6).map((item) => <span key={item.label} style={{ background: item.color }} />)}
          </div>
          <div className="visual-composition">
            <img className="hero-render" src={activeImages[0]} alt="Primary interior render" />
            <img className="tall-render" src={activeImages[1]} alt="Pooja or feature render" />
            <img className="side-render" src={activeImages[2]} alt="Seating detail render" />
            <img className="detail-render" src={activeImages[3] || activeImages[0]} alt="Material detail render" />
          </div>
          <div className="material-strip">
            {materialStrip.map((item) => (
              <article key={item.label}>
                <span style={{ background: item.color }} />
                <strong>{item.label}</strong>
                <small>{item.sub}</small>
              </article>
            ))}
          </div>

          <div className="lower-board">
            <section>
              <div className="section-line">
                <strong>More References</strong>
                <div><button aria-label="Previous view"><ChevronLeft size={15} /></button><button aria-label="Next view"><ChevronRight size={15} /></button></div>
              </div>
              <div className="more-views">
                {(activeMoodboard?.assets || []).slice(0, 3).map((asset) => (
                  <article key={asset.id}>
                    <img src={assetUrl(asset.url)} alt={asset.title} />
                    <span>{asset.title}</span>
                  </article>
                ))}
                {!activeMoodboard && activeImages.slice(0, 3).map((image, index) => (
                  <article key={image}>
                    <img src={image} alt="Static inspiration view" />
                    <span>{['TV Wall Option 2', 'Open Plan View', 'Dining Connection'][index]}</span>
                  </article>
                ))}
              </div>
            </section>

            <aside className="designer-notes">
              <div><strong>Brief Notes</strong><button><PanelTop size={14} /></button></div>
              <ul>
                <li>Warm contemporary palette with natural textures and brass accents.</li>
                <li>TV wall in stone + fluted panel for quiet luxury feel.</li>
                <li>Pooja niche proposed near living, as per client preference.</li>
                <li>Olive green accent through sofa and decor.</li>
              </ul>
            </aside>
          </div>

          {activeMoodboard ? (
            <div className="prompt-box">
              <div><BookOpen size={16} /> Brief prompt / rationale</div>
              <p>{activeMoodboard.prompt}</p>
            </div>
          ) : null}
        </div>
      )}

      {activeView === 'Reference' && (
        <div className="reference-gallery-stage" style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--ink)', fontSize: '16px', margin: 0 }}>Reference & Mood Library Matches</h3>
            <button className="btn btn-gold btn-sm" onClick={handleUploadClick} disabled={uploading}>
              {uploading ? <Loader2 className="spin" size={15} /> : <Upload size={15} />}
              Upload Reference Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>

          {loadingReferences ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '200px' }}>
              <Loader2 className="spin" size={32} style={{ color: 'var(--gold-2)' }} />
            </div>
          ) : filteredReferences.length === 0 ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '200px', border: '1px dashed var(--line)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No reference images found for this category.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {filteredReferences.map((img) => (
                <article 
                  key={img.id} 
                  style={{ 
                    background: 'var(--paper-2)', 
                    border: '1px solid var(--line)', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s ease'
                  }}
                  className="reference-card"
                >
                  <img 
                    src={img.url} 
                    alt={img.title} 
                    style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} 
                  />
                  <div style={{ padding: '10px 12px' }}>
                    <strong style={{ display: 'block', color: 'var(--ink)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.title}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--gold-2)', textTransform: 'uppercase', fontWeight: 'bold' }}>{img.style}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'Plan' && (
        <div className="plan-stage" style={{ padding: '20px 0' }}>
          <h3 style={{ color: 'var(--ink)', fontSize: '16px', marginBottom: '20px' }}>Calibrated Grounding Floor Plan</h3>
          {floorPlanDraft?.previewUrl ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
              <div 
                className="plan-canvas-container" 
                style={{ 
                  position: 'relative', 
                  background: 'var(--paper-2)', 
                  border: '1px solid var(--line)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  display: 'grid', 
                  placeItems: 'center',
                  minHeight: '400px'
                }}
              >
                <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '450px' }}>
                  <img 
                    src={floorPlanDraft.previewUrl} 
                    alt="Grounding floor plan" 
                    style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '6px', display: 'block' }} 
                  />
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {(floorPlanDraft.annotations?.zones || []).map((zone) => (
                      <div
                        key={zone.id}
                        style={{
                          position: 'absolute',
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.w}%`,
                          height: `${zone.h}%`,
                          border: '2px dashed var(--gold-2)',
                          background: 'rgba(210, 173, 103, 0.12)',
                          color: '#fff',
                          padding: '4px',
                          fontSize: '10px',
                          fontWeight: '900',
                          textShadow: '0 1px 2px #000',
                          pointerEvents: 'none'
                        }}
                      >
                        {zone.label || zone.room}
                      </div>
                    ))}
                    {(floorPlanDraft.annotations?.markers || []).map((marker) => (
                      <div
                        key={marker.id}
                        style={{
                          position: 'absolute',
                          left: `${marker.x}%`,
                          top: `${marker.y}%`,
                          background: 'var(--gold)',
                          border: '1px solid #000',
                          color: '#000',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          pointerEvents: 'none'
                        }}
                        title={marker.type}
                      >
                        📍
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <aside 
                style={{ 
                  background: 'var(--paper-2)', 
                  border: '1px solid var(--line)', 
                  borderRadius: '12px', 
                  padding: '16px',
                  color: 'var(--ink)'
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>Detected Layout Metrics</h4>
                <div style={{ display: 'grid', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Rooms Marked</span>
                    <strong>{(floorPlanDraft.annotations?.zones?.length || 0)} Spaces</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Furniture & Components</span>
                    <strong>{(floorPlanDraft.annotations?.markers?.length || 0)} Items</strong>
                  </div>
                  {floorPlanDraft.analysis?.calibration?.knownLengthMm ? (
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Calibration Scale</span>
                      <strong>{floorPlanDraft.analysis.calibration.knownLengthMm}mm</strong>
                    </div>
                  ) : null}
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Space Checklist</span>
                    <ul style={{ paddingLeft: '16px', margin: 0, color: 'var(--muted)' }}>
                      {(floorPlanDraft.annotations?.zones || []).map(z => (
                        <li key={z.id}>{z.label || z.room}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', height: '250px', border: '1px dashed var(--line)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No floor plan uploaded or marked during onboarding.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
