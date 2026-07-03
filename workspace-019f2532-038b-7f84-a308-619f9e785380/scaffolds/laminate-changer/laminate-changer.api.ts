import { LaminateChangeRequestSchema } from './schemas';
import { LaminateChangerService } from './laminate-changer.service';

/**
 * Example API/controller wiring.
 * Adapt this to Fastify, Express, NestJS, or your current API framework.
 */
export function createLaminateChangerRoutes(service: LaminateChangerService) {
  return {
    async createJob(req: any, res: any) {
      try {
        const payload = LaminateChangeRequestSchema.parse(req.body);
        const result = await service.createLaminateChangeJob(payload);
        return res.status(202).send(result);
      } catch (error: any) {
        return res.status(400).send({
          error: 'INVALID_LAMINATE_CHANGE_REQUEST',
          message: error?.message ?? 'Invalid request',
          details: error?.issues ?? null,
        });
      }
    },

    async previewPlan(req: any, res: any) {
      try {
        const payload = LaminateChangeRequestSchema.parse(req.body);
        const result = await service.previewPlan(payload);
        return res.status(200).send(result);
      } catch (error: any) {
        return res.status(400).send({
          error: 'INVALID_LAMINATE_PREVIEW_REQUEST',
          message: error?.message ?? 'Invalid request',
          details: error?.issues ?? null,
        });
      }
    },
  };
}
