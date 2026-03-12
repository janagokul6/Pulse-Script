const { eq } = require('drizzle-orm');
const { db, notifications, pushSubscriptions, createId } = require('../db');

async function createNotification({ userId, type, referenceId, title, body }) {
  const id = createId();
  await db.insert(notifications).values({
    id,
    userId,
    type,
    referenceId: referenceId || null,
    title: title || null,
    body: body || null,
  });
  const tokens = await db.select({ token: pushSubscriptions.token }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (tokens.length > 0) {
    sendExpoPush(tokens.map((t) => t.token), title || type, body || '');
  }
  return { id, userId, type, referenceId, title, body };
}

async function sendExpoPush(expoPushTokens, title, body) {
  if (expoPushTokens.length === 0) return;
  try {
    const messages = expoPushTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
    }));
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('Expo push error:', err);
  }
}

module.exports = { createNotification };
