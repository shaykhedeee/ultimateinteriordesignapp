/**
 * Cutlist Pro India - Storage & Database Sync API Service
 * 
 * DESIGN RATIONALE:
 * All storage operations are structured as asynchronous (returning Promises).
 * In this Phase 2, they read and write to LocalStorage. However, because they are async, 
 * you can seamlessly swap this local implementation for a cloud API client 
 * (such as Supabase SDK, Firebase, or a custom Express/REST server) in the future 
 * without modifying a single line of React frontend code.
 */

const PROJECTS_KEY = "cutlist_pro_projects";
const BRANDING_KEY = "cutlist_pro_branding_profile";

// Helper to simulate network latency if needed, mimicking a real database
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * -------------------------------------------------------------
 * 1. MULTI-PROJECT MANAGEMENT METHODS
 * -------------------------------------------------------------
 */

/**
 * Loads all saved projects.
 */
export async function getAllProjects() {
  await delay(100); // Simulate light network/disk latency
  try {
    const rawData = localStorage.getItem(PROJECTS_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error("Failed to load projects from storage:", error);
    return [];
  }
}

/**
 * Saves or updates a project.
 * If project.id doesn't exist in saved projects, it will append it. Otherwise, it updates it.
 */
export async function saveProject(project) {
  await delay(150);
  try {
    const projects = await getAllProjects();
    const now = new Date().toISOString();
    
    let updatedProject = { ...project };
    const existingIdx = projects.findIndex(p => p.id === project.id);
    
    if (existingIdx >= 0) {
      // Update existing project
      updatedProject.dateModified = now;
      projects[existingIdx] = updatedProject;
    } else {
      // Create new project
      updatedProject.dateCreated = now;
      updatedProject.dateModified = now;
      projects.push(updatedProject);
    }
    
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return updatedProject;
  } catch (error) {
    console.error("Failed to save project to storage:", error);
    throw new Error("Storage operation failed: Unable to save project.");
  }
}

/**
 * Deletes a project by ID.
 */
export async function deleteProject(projectId) {
  await delay(100);
  try {
    const projects = await getAllProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw new Error("Storage operation failed: Unable to remove project.");
  }
}

/**
 * -------------------------------------------------------------
 * 2. TENANT BRAND PROFILE WHITE-LABEL METHODS
 * -------------------------------------------------------------
 */

/**
 * Loads the saved custom branding profile.
 * If empty, returns null so the app falls back to bundled default presets.
 */
export async function getBrandingProfile() {
  try {
    const rawData = localStorage.getItem(BRANDING_KEY);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    console.error("Failed to read branding profile:", error);
    return null;
  }
}

/**
 * Saves/updates the custom branding profile (including company name, address, base64 logo, and colors).
 */
export async function saveBrandingProfile(profile) {
  await delay(50);
  try {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error("Failed to persist branding profile:", error);
    throw new Error("Storage operation failed: Unable to save branding settings.");
  }
}

/**
 * Clears custom branding, resetting the app back to factory defaults.
 */
export async function resetBrandingProfile() {
  try {
    localStorage.removeItem(BRANDING_KEY);
    return true;
  } catch (error) {
    console.error("Failed to reset branding profile:", error);
    return false;
  }
}
