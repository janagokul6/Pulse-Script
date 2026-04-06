import { eq, and } from 'drizzle-orm';
import { db, users, follows } from '../../db/index.js';
import type { User } from '../../db/schema.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import type { UpdateMeInput } from './schemas.js';

const publicCols = {
  id: users.id,
  name: users.name,
  specialization: users.specialization,
  experienceYears: users.experienceYears,
  bio: users.bio,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
};

const meCols = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  specialization: users.specialization,
  experienceYears: users.experienceYears,
  bio: users.bio,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
};

export function getCurrentUser(userId: string): Promise<User | null> {
  return db.select(meCols).from(users).where(eq(users.id, userId)).limit(1).then((r) => (r[0] as User) ?? null);
}

export async function updateCurrentUser(userId: string, data: UpdateMeInput): Promise<User> {
  const [updated] = await db.update(users).set(data).where(eq(users.id, userId)).returning(meCols);
  if (!updated) throw new NotFoundError('User not found');
  return updated as User;
}

export async function listCurrentUserFollowing(userId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      specialization: users.specialization,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId));
}

export async function getPublicProfile(viewerId: string | undefined, userId: string) {
  const [user] = await db.select(publicCols).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User not found');
  const out: Record<string, unknown> = { ...user };
  if (viewerId && viewerId !== userId) {
    const [f] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, userId)))
      .limit(1);
    (out as { isFollowing: boolean }).isFollowing = !!f;
  }
  return out;
}
