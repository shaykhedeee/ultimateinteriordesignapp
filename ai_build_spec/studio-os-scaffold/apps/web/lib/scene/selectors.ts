import type { SceneDocument, SceneModule, SceneRoom, SceneVersionDto } from '@studio/contracts';

export function getSceneDocument(sceneVersion: SceneVersionDto | null | undefined): SceneDocument | null {
  return sceneVersion?.scene ?? null;
}

export function getFirstLevel(sceneVersion: SceneVersionDto | null | undefined) {
  const scene = getSceneDocument(sceneVersion);
  return scene?.levels?.[0] ?? null;
}

export function getRooms(sceneVersion: SceneVersionDto | null | undefined): SceneRoom[] {
  return getFirstLevel(sceneVersion)?.rooms ?? [];
}

export function getWalls(sceneVersion: SceneVersionDto | null | undefined) {
  return getFirstLevel(sceneVersion)?.walls ?? [];
}

export function getModules(sceneVersion: SceneVersionDto | null | undefined): SceneModule[] {
  return getFirstLevel(sceneVersion)?.modules ?? [];
}

export function findModule(sceneVersion: SceneVersionDto | null | undefined, moduleId?: string | null) {
  if (!moduleId) return null;
  return getModules(sceneVersion).find((item) => item.moduleId === moduleId) ?? null;
}

export function findRoom(sceneVersion: SceneVersionDto | null | undefined, roomId?: string | null) {
  if (!roomId) return null;
  return getRooms(sceneVersion).find((item) => item.roomId === roomId) ?? null;
}

export function getSceneBounds(sceneVersion: SceneVersionDto | null | undefined) {
  const rooms = getRooms(sceneVersion);
  const points = rooms.flatMap((room) => room.polygon2d);
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 5000, maxY: 4000, width: 5000, height: 4000 };
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
