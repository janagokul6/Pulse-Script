const { verifyToken, createClerkClient } = require('@clerk/backend');
const { eq } = require('drizzle-orm');
const { db, users, createId } = require('../db');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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

async function getOrCreateAppUser(clerkUserId) {
  const rows = await db.select(userColumns).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  let user = rows[0] ?? null;
  if (user) return user;
  const clerkUser = await clerkClient.users.getUser(clerkUserId).catch(() => null);
  if (!clerkUser) return null;
  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  const firstName = clerkUser.firstName ?? '';
  const lastName = clerkUser.lastName ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || clerkUser.username || 'User';
  const avatarUrl = clerkUser.imageUrl ?? null;
  const [inserted] = await db.insert(users).values({
    id: createId(),
    clerkUserId,
    email,
    name,
    avatarUrl,
  }).returning();
  return inserted ?? null;
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: authorizedPartiesFromEnv(),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) return res.status(401).json({ error: 'Invalid session' });
    const user = await getOrCreateAppUser(clerkUserId);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: authorizedPartiesFromEnv(),
    });
    const clerkUserId = payload.sub;
    if (clerkUserId) {
      const user = await getOrCreateAppUser(clerkUserId);
      if (user) req.user = user;
    }
  } catch (_) {}
  next();
}

function authorizedPartiesFromEnv() {
  const parties = process.env.CLERK_AUTHORIZED_PARTIES;
  if (parties) return parties.split(',').map((p) => p.trim()).filter(Boolean);
  return undefined;
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, optionalAuth, requireAdmin };
