// ============================================================
// PRIORITY 5: Per-Project File History
// src/components/file-history/ProjectFileHistory.jsx
// Shows all generated files for a project with timeline
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import './ProjectFileHistory.css';

export default function ProjectFileHistory({ projectId, projectName, onRefresh }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (projectId) loadFiles(projectId);
  }, [projectId]);

  const loadFiles = async (pid) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/documents?projectId=${pid}`);
      const data = await res.json();
      setFiles(data.documents || []);
      
      // Also load renders
      const rendersRes = await fetch(`/api/renders/studio/${pid}`);
      const rendersData = await rendersRes.json();
      
      // Merge render history
      if (rendersData.renders) {
        const renderEntries = rendersData.renders.flatMap(r => 
          (r.variants || []).map(v => ({
            id: v.id,
            type: 'render',
            name: `Render: ${r.roomName} - ${v.name || v.variantKey}`,
            status: v.status === 'approved' ? 'Approved' : v.status === 'rejected' ? 'Rejected' : 'Pending Review',
            date: v.created_at || new Date().toISOString(),
            thumbnail: null,
            actions: [
              { label: 'View', url: `/storage/renders/${v.id}.png` },
              { label: 'Download', url: `/storage/renders/${v.id}.png`, download: true }
            ]
          }))
        );
        setFiles(prev => [...renderEntries, ...prev]);
      }
    } catch (err) {
      console.error('Failed to load file history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    if (filter === 'all') return files;
    return files.filter(f => f.type === filter);
  }, [files, filter]);

  const groupedByDate = useMemo(() => {
    const groups = {};
    for (const file of filteredFiles) {
      const dateKey = file.date?.split('T')[0] || 'unknown';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(file);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredFiles]);

  const iconForType = (type) => ({
    'render': '🎨',
    'pdf-brief': '📄',
    'cutlist-pdf': '✂️',
    'cutlist-csv': '📊',
    'floor-plan': '📐',
    'backup': '💾',
    'label': '🏷️',
    'signoff': '✅'
  }[type] || '📁');

  return (
    <div className="file-history-panel">
      <div className="history-header">
        <h3>Project Files</h3>
        <span className="history-count">{filteredFiles.length} files</span>
      </div>

      <div className="history-filters">
        {[['all', 'All Files'], ['render', 'Renders'], ['pdf-brief', 'PDF Briefs'],
          ['cutlist-pdf', 'Cutlists'], ['floor-plan', 'Floor Plans'], ['backup', 'Backups']]
          .map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))
        }
      </div>

      <div className="history-list">
        {loading ? (
          <div className="history-loading">Loading file history...</div>
        ) : groupedByDate.length === 0 ? (
          <div className="history-empty">
            <div className="empty-icon">📁</div>
            <p>No files generated yet</p>
            <p className="empty-hint">Generate renders or export PDFs to see them here</p>
          </div>
        ) : (
          groupedByDate.map(([dateKey, dateFiles]) => (
            <div key={dateKey} className="date-group">
              <div className="date-header">
                <span className="date-label">
                  {dateKey === 'unknown' ? 'Unknown Date' : new Date(dateKey).toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
                <span className="date-count">{dateFiles.length} file(s)</span>
              </div>

              {dateFiles.map((file, i) => (
                <div key={`${dateKey}-${i}`} className={`file-item type-${file.type || 'unknown'}`}>
                  <div className="file-icon">{iconForType(file.type)}</div>
                  
                  <div className="file-info">
                    <div className="file-name-row">
                      <span className="file-name">{file.name || file.title || 'Untitled'}</span>
                      <span className={`file-status ${(file.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {file.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="file-meta">
                      <span className="file-type-badge">{file.type?.replace('-', ' ') || 'document'}</span>
                      {file.file_size && (
                        <span className="file-size">
                          {(file.file_size / 1024).toFixed(1)} KB
                        </span>
                      )}
                      {file.updated_date && (
                        <span className="file-time">
                          {new Date(file.updated_date).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="file-actions">
                    {file.url && (
                      <a href={file.url} target="_blank" className="btn btn-sm btn-ghost" title="Open">
                        👁️
                      </a>
                    )}
                    {file.url && file.type !== 'render' && (
                      <a href={file.url} download className="btn btn-sm btn-ghost" title="Download">
                        ⬇️
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="history-footer">
        <button className="btn btn-sm btn-ghost" onClick={() => loadFiles(projectId)}>
          ⟳ Refresh
        </button>
      </div>
    </div>
  );
}