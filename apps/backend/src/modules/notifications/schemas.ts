import { z } from 'zod';
export const registerDeviceSchema = z.object({ token: z.string().min(1) });
