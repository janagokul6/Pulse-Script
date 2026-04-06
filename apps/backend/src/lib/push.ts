export async function sendExpoPush(
  expoPushTokens: string[],
  title: string,
  body: string,
): Promise<void> {
  if (expoPushTokens.length === 0) return;
  try {
    const messages = expoPushTokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
    }));
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.error('Expo push non-OK response:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Expo push error:', err);
  }
}
