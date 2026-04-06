import { z } from 'zod';
export const updatePostModerationSchema = z.object({
  isRemoved: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});
