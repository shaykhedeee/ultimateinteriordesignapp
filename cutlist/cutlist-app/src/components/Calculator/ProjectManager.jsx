import React, { useState, useEffect } from "react";
import { getAllProjects, saveProject, deleteProject } from "../../services/storageService";

export default function ProjectManager({
  currentCabinets,
  currentProjectMetadata,
  onLoadProject,
  onNewProject,
  onSaveMetadata
}) {
  const [projectsList, setProjectsList] = useState([]);
  const [showSavedList, setShowSavedList] = useState(false);
  
  // Metadata inputs for saving
  const [meta, setMeta] = useState({
    projectName: currentProjectMetadata.projectName || "Standard 2BHK Modular",
    clientName: currentProjectMetadata.clientName || "Mr. Mehta",
    siteReference: currentProjectMetadata.siteReference || "Flat 405, Orchid Heights, Bengaluru",
    supervisorName: currentProjectMetadata.supervisorName || "Gopal Carpenter"
  });

  // Re-sync metadata inputs if parent metadata updates
  useEffect(() => {
    setMeta({
      projectName: currentProjectMetadata.projectName || "Standard 2BHK Modular",
      clientName: currentProjectMetadata.clientName || "Mr. Mehta",
      siteReference: currentProjectMetadata.siteReference || "Flat 405, Orchid Heights, Bengaluru",
      supervisorName: currentProjectMetadata.supervisorName || "Gopal Carpenter"
    });
  }, [currentProjectMetadata]);

  // Load projects from LocalStorage API
  const refreshProjectsList = async () => {
    try {
      const data = await getAllProjects();
      setProjectsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshProjectsList();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedMeta = { ...meta, [name]: value };
    setMeta(updatedMeta);
    onSaveMetadata(updatedMeta);
  };

  const handleSaveCurrent = async (e) => {
    e.preventDefault();
    if (!meta.projectName.trim()) {
      alert("Please provide a valid Project Name.");
      return;
    }

    const payload = {
      id: currentProjectMetadata.id || `proj-${Date.now()}`,
      name: meta.projectName,
      clientName: meta.clientName,
      siteReference: meta.siteReference,
      supervisorName: meta.supervisorName,
      cabinets: currentCabinets
    };

    try {
      const saved = await saveProject(payload);
      onLoadProject(saved); // Sync active project state
      await refreshProjectsList();
      alert(`Project "${saved.name}" saved successfully to Local Database!`);
    } catch (err) {
      alert("Failed to save project: " + err.message);
    }
  };

  const handleLoadProjectClick = async (proj) => {
    onLoadProject(proj);
    setShowSavedList(false);
    alert(`Loaded Project: "${proj.name}"`);
  };

  const handleDeleteProjectClick = async (e, id, name) => {
    e.stopPropagation(); // Stop selection trigger
    if (window.confirm(`Are you sure you want to permanently delete project "${name}"?`)) {
      try {
        await deleteProject(id);
        await refreshProjectsList();
        
        // If the deleted project was the currently active one, start fresh
        if (currentProjectMetadata.id === id) {
          onNewProject();
        }
      } catch (err) {
        alert("Failed to delete project: " + err.message);
      }
    }
  };

  const handleCreateNewClick = () => {
    if (window.confirm("Create a new modular project? This will clear your current cabinet workspace. Make sure you have saved!")) {
      onNewProject();
      setMeta({
        projectName: "New Kitchen Project",
        clientName: "",
        siteReference: "",
        supervisorName: ""
      });
    }
  };

  return (
    <div className="card project-manager-card">
      <div className="card-header-premium flex-header-proj">
        <div>
          <h2>📁 Client Project Manager</h2>
          <p>Organize, save, and retrieve multiple client modular cutting plans</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary text-small-btn"
          onClick={() => {
            refreshProjectsList();
            setShowSavedList(!showSavedList);
          }}
        >
          {showSavedList ? "📋 Hide Projects" : "📂 Load Projects"}
        </button>
      </div>

      {showSavedList ? (
        /* Saved Projects Directory */
        <div className="saved-projects-list">
          <h3>Saved Projects List ({projectsList.length})</h3>
          {projectsList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📁</span>
              <p>No saved projects in the database. Save your current workspace to start.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projectsList.map((proj) => (
                <div
                  key={proj.id}
                  className={`project-list-item ${currentProjectMetadata.id === proj.id ? "active-proj" : ""}`}
                  onClick={() => handleLoadProjectClick(proj)}
                >
                  <div className="proj-item-details">
                    <h4 className="proj-item-name">{proj.name}</h4>
                    <span className="proj-item-client">Client: {proj.clientName || "N/A"}</span>
                    <span className="proj-item-meta">
                      🔧 {proj.cabinets?.length || 0} Cabinets | Modified: {new Date(proj.dateModified).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="proj-delete-btn"
                    onClick={(e) => handleDeleteProjectClick(e, proj.id, proj.name)}
                    title="Delete Project"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Save / Edit Active Project Metadata */
        <form onSubmit={handleSaveCurrent} className="premium-form">
          <div className="form-group">
            <label>Project / Site Name</label>
            <input
              type="text"
              name="projectName"
              value={meta.projectName}
              onChange={handleInputChange}
              placeholder="e.g. Sharma Kitchen 3BHK"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Client Name</label>
              <input
                type="text"
                name="clientName"
                value={meta.clientName}
                onChange={handleInputChange}
                placeholder="e.g. Mr. Sharma"
              />
            </div>
            <div className="form-group">
              <label>Carpenter / Supervisor</label>
              <input
                type="text"
                name="supervisorName"
                value={meta.supervisorName}
                onChange={handleInputChange}
                placeholder="e.g. Ramesh Mistri"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Site Reference Location</label>
            <input
              type="text"
              name="siteReference"
              value={meta.siteReference}
              onChange={handleInputChange}
              placeholder="e.g. Flat 301, Orchid Residency, HSR Layout"
            />
          </div>

          <div className="form-grid-2 project-action-row">
            <button type="submit" className="btn btn-primary">
              💾 Save Project
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCreateNewClick}>
              🆕 New Project
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
