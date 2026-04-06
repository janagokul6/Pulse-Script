import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { ValidationError } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

export function validate<T extends z.ZodType>(schema: T, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = req[source];
    const result = schema.safeParse(raw);
    if (!result.success) {
      next(new ValidationError('Validation failed', result.error.flatten().fieldErrors));
      return;
    }
    (req as Request & { validated: z.infer<T> }).validated = result.data;
    next();
  };
}
