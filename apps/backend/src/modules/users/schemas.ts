import { z } from 'zod';

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
