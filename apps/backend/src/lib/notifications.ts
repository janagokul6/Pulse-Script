import { eq } from 'drizzle-orm';
import { db, notifications, pushSubscriptions, createId } from '../db/index.js';
import { sendExpoPush } from './push.js';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  referenceId?: string | null;
  title?: string | null;
  body?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const id = createId();
  await db.insert(notifications).values({
    id,
    userId: input.userId,
    type: input.type,
    referenceId: input.referenceId ?? null,
    title: input.title ?? null,
    body: input.body ?? null,
  });
  const tokens = await db
    .select({ token: pushSubscriptions.token })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, input.userId));
  if (tokens.length > 0) {
    sendExpoPush(
      tokens.map((t) => t.token),
      input.title ?? input.type,
      input.body ?? '',
    ).catch((e) => console.error('Push send error', e));
  }
}
