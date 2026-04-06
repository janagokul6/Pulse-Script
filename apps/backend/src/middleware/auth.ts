import { verifyToken, createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { db, users, createId } from '../db/index.js';
import type { User } from '../db/schema.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

export interface AuthenticatedRequest extends Request {
  user: User;
}

const clerkClient = createClerkClient({ secretKey: config.CLERK_SECRET_KEY });

const userColumns = {
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

async function getOrCreateAppUser(clerkUserId: string): Promise<User | null> {
  const rows = await db.select(userColumns).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  const user = (rows[0] as User | undefined) ?? null;
  if (user) return user;
  const clerkUser = await clerkClient.users.getUser(clerkUserId).catch(() => null);
  if (!clerkUser) return null;
  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  const firstName = clerkUser.firstName ?? '';
  const lastName = clerkUser.lastName ?? '';
  const nameRaw = [firstName, lastName].filter(Boolean).join(' ') || (clerkUser.username ?? '');
  const name = nameRaw.trim() || 'User';
  const avatarUrl = clerkUser.imageUrl ?? null;
  const [inserted] = await db
    .insert(users)
    .values({
      id: createId(),
      clerkUserId,
      email,
      name,
      avatarUrl,
    })
    .returning();
  return (inserted as User | undefined) ?? null;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid authorization header'));
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: config.CLERK_SECRET_KEY,
      authorizedParties: config.authorizedParties,
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      next(new UnauthorizedError('Invalid session'));
      return;
    }
    const user = await getOrCreateAppUser(clerkUserId);
    if (!user) {
      next(new UnauthorizedError('Account not found'));
      return;
    }
    (req as AuthenticatedRequest).user = user as User;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired session'));
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: config.CLERK_SECRET_KEY,
      authorizedParties: config.authorizedParties,
    });
    const clerkUserId = payload.sub;
    if (clerkUserId) {
      const user = await getOrCreateAppUser(clerkUserId);
      if (user) (req as AuthenticatedRequest).user = user as User;
    }
  } catch {
    // ignore
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
}
