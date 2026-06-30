import type { CreateProjectRequestDto, ProjectStage, UpdateProjectRequestDto, UUID } from '@studio/contracts';
import { mockStore, type ProjectRecord } from '../../lib/mock-store';
import { logTimelineEvent } from '../../lib/timeline';
import { calculateReadiness } from '../../lib/workflow';

export class MockProjectsRepository {
  list() {
    return mockStore.projects;
  }

  findById(id: UUID) {
    return mockStore.projects.find((project) => project.id === id) ?? null;
  }

  create(input: CreateProjectRequestDto) {
    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      clientId: crypto.randomUUID(),
      projectCode: `PRJ-${Date.now()}`,
      name: input.name ?? input.client.primaryName,
      stage: 'draft',
      status: 'active',
      budgetBand: input.budgetBand,
      readiness: {
        stage: 'draft',
        score: 10,
        checks: {
          intakeComplete: false,
          siteCaptureComplete: false,
          planReviewed: false,
          sceneReady: false,
          hasEstimate: false,
          hasDrawings: false,
          hasRenders: false,
        },
        nextRequiredAction: 'start_intake',
      },
      counts: { renders: 0, drawings: 0, estimates: 0 },
      staleFlags: { renders: false, drawings: false, pricing: false },
      createdAt: new Date().toISOString(),
    };
    project.readiness = calculateReadiness(project);
    mockStore.projects.unshift(project);
    logTimelineEvent(project.id, 'project.created', 'Project created', `${project.name} created from project form`);
    return project;
  }

  update(id: UUID, input: UpdateProjectRequestDto) {
    const project = this.findById(id);
    if (!project) return null;
    Object.assign(project, input);
    project.readiness = calculateReadiness(project);
    logTimelineEvent(project.id, 'project.updated', 'Project updated', 'Project metadata updated');
    return project;
  }

  transition(id: UUID, nextStage: ProjectStage) {
    const project = this.findById(id);
    if (!project) return null;
    const fromStage = project.stage;
    project.stage = nextStage;
    project.readiness = calculateReadiness(project);
    logTimelineEvent(project.id, 'project.stage_transition', `Stage changed to ${nextStage}`, `From ${fromStage} to ${nextStage}`);
    return project;
  }

  incrementCount(id: UUID, key: keyof NonNullable<ProjectRecord['counts']>) {
    const project = this.findById(id);
    if (!project) return null;
    project.counts = project.counts ?? { renders: 0, drawings: 0, estimates: 0 };
    project.counts[key] = (project.counts[key] ?? 0) + 1;
    project.readiness = calculateReadiness(project);
    return project;
  }
}

export const mockProjectsRepository = new MockProjectsRepository();
