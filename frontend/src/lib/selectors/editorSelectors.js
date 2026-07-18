// Zustand Selectors to minimize component re-renders by selecting narrow branches
const EMPTY_ENTITIES = Object.freeze([]);

export const selectActiveLevel = (state) => {
  if (!state.scene) return null;
  const levels = Array.isArray(state.scene.levels) ? state.scene.levels : EMPTY_ENTITIES;
  return levels.find(l => (l.levelId || l.id) === state.activeLevelId) || levels[0] || null;
};

export const selectRooms = (state) => {
  const level = selectActiveLevel(state);
  return level?.rooms || EMPTY_ENTITIES;
};

export const selectWalls = (state) => {
  const level = selectActiveLevel(state);
  return level?.walls || EMPTY_ENTITIES;
};

export const selectOpenings = (state) => {
  const level = selectActiveLevel(state);
  return level?.openings || EMPTY_ENTITIES;
};

export const selectModules = (state) => {
  const level = selectActiveLevel(state);
  return level?.modules || EMPTY_ENTITIES;
};

export const selectSelectedEntity = (state) => {
  const { selectedId, selectedType } = state;
  if (!selectedId || !selectedType) return null;

  const level = selectActiveLevel(state);
  if (!level) return null;

  switch (selectedType) {
    case 'room':
      return level.rooms.find(r => r.roomId === selectedId) || null;
    case 'wall':
      return level.walls.find(w => w.wallId === selectedId) || null;
    case 'module':
      return level.modules.find(m => m.moduleId === selectedId) || null;
    case 'opening':
      return level.openings.find(o => o.openingId === selectedId) || null;
    default:
      return null;
  }
};
