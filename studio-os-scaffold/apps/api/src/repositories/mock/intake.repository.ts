import type { UUID } from '@studio/contracts';
import { mockStore, type IntakePackageRecord } from '../../lib/mock-store';
import { logTimelineEvent } from '../../lib/timeline';

export class MockIntakeRepository {
  current(projectId: UUID) {
    return mockStore.intakePackages.find((pkg) => pkg.projectId === projectId && pkg.isCurrent) ?? null;
  }

  list(projectId: UUID) {
    return mockStore.intakePackages.filter((pkg) => pkg.projectId === projectId);
  }

  save(projectId: UUID, payload: Record<string, unknown>) {
    mockStore.intakePackages.forEach((pkg) => {
      if (pkg.projectId === projectId && pkg.isCurrent) pkg.isCurrent = false;
    });

    const versionNumber = this.list(projectId).reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;
    const record: IntakePackageRecord = {
      id: crypto.randomUUID(),
      projectId,
      versionNumber,
      isCurrent: true,
      payload,
      completionPercent: 50,
    };

    mockStore.intakePackages.unshift(record);
    logTimelineEvent(projectId, 'intake.saved', 'Intake version saved', `Intake version ${versionNumber} created`);
    return record;
  }
}

export const mockIntakeRepository = new MockIntakeRepository();
