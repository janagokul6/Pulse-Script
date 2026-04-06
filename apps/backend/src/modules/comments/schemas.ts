import { z } from 'zod';
export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});
export const updateCommentSchema = z.object({ body: z.string().min(1).max(2000) });
