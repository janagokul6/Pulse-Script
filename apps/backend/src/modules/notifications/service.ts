import { eq, and, isNull, desc } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import { db, notifications, pushSubscriptions, createId } from '../../db/index.js';
import { NotFoundError } from '../../lib/errors.js';

export async function listNotifications(params: {
  userId: string;
  page: number;
  limit: number;
  unreadOnly?: boolean;
}) {
  const { userId, page, limit, unreadOnly } = params;
  const offset = (page - 1) * limit;
  const baseWhere = eq(notifications.userId, userId);
  const where = unreadOnly ? and(baseWhere, isNull(notifications.readAt)) : baseWhere;
  const [list, totalResult] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(notifications).where(where),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  return { notifications: list, total, page, limit };
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  const [n] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .limit(1);
  if (!n) throw new NotFoundError('Not found');
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, notificationId));
}

export async function registerDevice(userId: string, token: string): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({ id: createId(), userId, token })
    .onConflictDoUpdate({ target: pushSubscriptions.token, set: { userId } });
}
