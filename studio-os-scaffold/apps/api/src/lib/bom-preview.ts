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
    
    // Carcass parts: 2 sides, top, bottom, and back panel
    const carcassAreaSqMm = 2 * (heightMm * depthMm) + 2 * (widthMm * depthMm) + (widthMm * heightMm);
    const shutterAreaSqMm = widthMm * heightMm;
    const totalAreaSqMm = carcassAreaSqMm + shutterAreaSqMm;
    
    // 2mm edge band for shutters, 0.8mm for carcass internal panels
    const doorCount = Number(module.params.doorCount ?? module.params.shutterCount ?? 2);
    const drawerCount = Number(module.params.drawerCount ?? 0);

    // shutter exposed perimeter uses 2mm band
    const edgeBand2mmRm = doorCount > 0 ? ((2 * (widthMm + heightMm)) / 1000) : 0;
    // carcass interior shelves and frames use 0.8mm band
    const edgeBand08mmRm = ((2 * (widthMm + depthMm) + 2 * (heightMm + depthMm)) / 1000) * 1.15; // 15% safety factor
    
    const edgeBandRm = edgeBand2mmRm + edgeBand08mmRm;

    // Hardware items
    const hingesCount = doorCount * 2;
    const runnersCount = drawerCount * 2;
    const handlesCount = doorCount + drawerCount;
    const hardwareUnits = hingesCount + runnersCount + handlesCount;

    // Plywood sheet yield (Standard sheet size: 2440 x 1220 mm = ~32 sqft, with 10% trim wastage)
    const sheetAreaSqMm = 2440 * 1220; // 2,976,800 sq mm
    const usableSheetAreaSqMm = sheetAreaSqMm * 0.90; // 90% yield
    const estimatedPanels = Math.max(1, Math.ceil(totalAreaSqMm / usableSheetAreaSqMm));

    const boardSpec = String((module.productionMapping as any)?.boardDefault ?? '18mm BWP plywood');
    const edgeSpec = String((module.productionMapping as any)?.edgeDefault ?? '1mm matching edge band');

    return {
      moduleId: module.moduleId,
      moduleName: module.name,
      moduleType: module.moduleType,
      roomRef: module.roomRef,
      wallRef: module.wallRef,
      boardSpec,
      edgeSpec,
      carcassBoardAreaSqft: round(sqftFromSqMm(carcassAreaSqMm)),
      shutterAreaSqft: round(sqftFromSqMm(shutterAreaSqMm)),
      edgeBandRm: round(edgeBandRm),
      edgeBand2mmRm: round(edgeBand2mmRm),
      edgeBand08mmRm: round(edgeBand08mmRm),
      hardwareUnits,
      hardwareBreakdown: { hinges: hingesCount, runners: runnersCount, handles: handlesCount },
      estimatedPanels,
      notes: Array.isArray((module.productionMapping as any)?.notes)
        ? ((module.productionMapping as any)?.notes as string[])
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
