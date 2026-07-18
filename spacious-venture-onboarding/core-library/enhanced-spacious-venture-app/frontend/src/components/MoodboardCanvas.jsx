import React from 'react';
import { ArrowLeft, BookOpen, Bookmark, ChevronLeft, ChevronRight, Home, MoreVertical, PanelTop } from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { categoryTabs, classNames, materialStrip, roomOptions, showcaseImages } from '../data/studioData.js';

export function MoodboardCanvas({ form, activeRoom, setActiveRoom, activeMoodboard }) {
  const selectedRoomOptions = roomOptions.filter((room) => form.selectedSpaces.includes(room.id));
  const generatedImages = activeMoodboard?.assets?.map((asset) => assetUrl(asset.url)) || [];
  const activeImages = [...generatedImages, ...(showcaseImages[activeRoom] || showcaseImages.living)].slice(0, 4);
  const activeRoomLabel = activeRoom === 'whole-home'
    ? 'Whole Home'
    : selectedRoomOptions.find((room) => room.id === activeRoom)?.label || 'Living Room';

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
            <button className="active">Brief Board</button>
            <button>Reference</button>
            <button>Plan</button>
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
        {categoryTabs.map((tab, index) => <button key={tab} className={index === 0 ? 'active' : ''}>{tab}</button>)}
      </nav>

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
    </section>
  );
}
