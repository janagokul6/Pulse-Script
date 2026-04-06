import { z } from 'zod';

export const createConversationSchema = z.object({
  recipientId: z.string().min(1),
});

export const sendMessageSchema = z.object({
  body: z.string(),
  type: z.enum(['text', 'image', 'file']).optional().default('text'),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
