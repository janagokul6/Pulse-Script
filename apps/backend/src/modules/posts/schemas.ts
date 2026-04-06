import { z } from 'zod';

export const createPostSchema = z.object({
  caseSummary: z.string().min(1),
  clinicalDecisions: z.string(),
  outcome: z.string(),
  keyLessons: z.string(),
  specialty: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export const updatePostSchema = createPostSchema.partial();
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const aiStructureSchema = z.object({
  rawText: z.string().min(1),
});
export type AiStructureInput = z.infer<typeof aiStructureSchema>;
