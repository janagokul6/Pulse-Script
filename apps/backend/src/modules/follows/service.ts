import { eq, and } from 'drizzle-orm';
import { db, users, follows } from '../../db/index.js';
import { NotFoundError, BadRequestError } from '../../lib/errors.js';

export async function followUser(currentUserId: string, targetUserId: string): Promise<void> {
  if (targetUserId === currentUserId) throw new BadRequestError('Cannot follow yourself');
  const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!user) throw new NotFoundError('User not found');
  await db
    .insert(follows)
    .values({ followerId: currentUserId, followingId: targetUserId })
    .onConflictDoNothing({ target: [follows.followerId, follows.followingId] });
}

export async function unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, targetUserId)));
}

export async function listFollowing(userId: string) {
  return db
    .select({ id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId));
}
