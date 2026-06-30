// Zustand Selectors to minimize component re-renders by selecting narrow branches

export const selectActiveLevel = (state) => {
  if (!state.scene) return null;
  return state.scene.levels.find(l => l.levelId === state.activeLevelId) || null;
};

export const selectRooms = (state) => {
  const level = selectActiveLevel(state);
  return level ? level.rooms : [];
};

export const selectWalls = (state) => {
  const level = selectActiveLevel(state);
  return level ? level.walls : [];
};

export const selectOpenings = (state) => {
  const level = selectActiveLevel(state);
  return level ? level.openings : [];
};

export const selectModules = (state) => {
  const level = selectActiveLevel(state);
  return level ? level.modules : [];
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
