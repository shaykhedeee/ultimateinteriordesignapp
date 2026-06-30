import type { SceneVersionDto } from '@studio/contracts';

function sqftFromSqMm(value: number) {
  return value / 92903.04;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function generateBomPreview(sceneVersion: SceneVersionDto, projectName?: string) {
  const level = sceneVersion.scene.levels[0];
  const modules = level?.modules ?? [];

  const moduleCards = modules.map((module) => {
    const { widthMm, heightMm, depthMm } = module.geometry.size;
    const boardAreaSqMm = 2 * (widthMm * depthMm) + 2 * (heightMm * depthMm) + widthMm * heightMm;
    const shutterAreaSqMm = widthMm * heightMm;
    const edgeBandRm = ((2 * (widthMm + depthMm + heightMm)) / 1000) * 0.35;
    const hardwareUnits = Math.max(2, Number(module.params.doorCount ?? module.params.drawerCount ?? 2));
    const estimatedPanels = Math.max(3, Math.ceil(boardAreaSqMm / (2440 * 1220)));

    return {
      moduleId: module.moduleId,
      moduleName: module.name,
      moduleType: module.moduleType,
      roomRef: module.roomRef,
      wallRef: module.wallRef,
      boardSpec: String((module.productionMapping as Record<string, unknown>)?.boardDefault ?? '18mm BWP plywood'),
      edgeSpec: String((module.productionMapping as Record<string, unknown>)?.edgeDefault ?? '1mm matching edge band'),
      carcassBoardAreaSqft: round(sqftFromSqMm(boardAreaSqMm)),
      shutterAreaSqft: round(sqftFromSqMm(shutterAreaSqMm)),
      edgeBandRm: round(edgeBandRm),
      hardwareUnits,
      estimatedPanels,
      notes: Array.isArray((module.productionMapping as Record<string, unknown>)?.notes)
        ? ((module.productionMapping as Record<string, unknown>)?.notes as string[])
        : [],
    };
  });

  const summary = moduleCards.reduce(
    (acc, item) => {
      acc.totalModules += 1;
      acc.totalCarcassBoardAreaSqft += item.carcassBoardAreaSqft;
      acc.totalShutterAreaSqft += item.shutterAreaSqft;
      acc.totalEdgeBandRm += item.edgeBandRm;
      acc.totalHardwareUnits += item.hardwareUnits;
      acc.totalEstimatedPanels += item.estimatedPanels;
      return acc;
    },
    {
      totalModules: 0,
      totalCarcassBoardAreaSqft: 0,
      totalShutterAreaSqft: 0,
      totalEdgeBandRm: 0,
      totalHardwareUnits: 0,
      totalEstimatedPanels: 0,
    }
  );

  return {
    sceneVersionId: sceneVersion.id,
    projectName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalModules: summary.totalModules,
      totalCarcassBoardAreaSqft: round(summary.totalCarcassBoardAreaSqft),
      totalShutterAreaSqft: round(summary.totalShutterAreaSqft),
      totalEdgeBandRm: round(summary.totalEdgeBandRm),
      totalHardwareUnits: summary.totalHardwareUnits,
      totalEstimatedPanels: summary.totalEstimatedPanels,
    },
    moduleCards,
  };
}
