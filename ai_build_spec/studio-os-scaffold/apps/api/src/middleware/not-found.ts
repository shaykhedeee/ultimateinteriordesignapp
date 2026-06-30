import { Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    data: null,
    meta: {},
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}
