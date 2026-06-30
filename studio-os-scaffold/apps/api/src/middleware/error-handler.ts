import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.flatten(),
      },
    });
  }

  const message = error instanceof Error ? error.message : 'Unknown server error';

  if (message === 'SCENE_LOCKED') {
    return res.status(409).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: 'SCENE_LOCKED',
        message: 'This scene version is locked and cannot be edited directly.',
      },
    });
  }

  if (message === 'OUTPUT_SET_STALE') {
    return res.status(409).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: 'OUTPUT_SET_STALE',
        message: 'The approval package cannot be created because one or more dependent outputs are stale.',
      },
    });
  }

  if (message === 'SCENE_NOT_CURRENT') {
    return res.status(409).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: 'SCENE_NOT_CURRENT',
        message: 'Approval must reference the current active scene version.',
      },
    });
  }

  if (message === 'PROJECT_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found.',
      },
    });
  }

  if (message.startsWith('INVALID_STAGE_TRANSITION')) {
    return res.status(400).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: 'INVALID_STAGE_TRANSITION',
        message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    data: null,
    meta: {},
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
}
