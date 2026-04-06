import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_AUTHORIZED_PARTIES: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PORT: z.coerce.number().int().min(1).default(3000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  authorizedParties: parsed.data.CLERK_AUTHORIZED_PARTIES
    ? parsed.data.CLERK_AUTHORIZED_PARTIES.split(',').map((p) => p.trim()).filter(Boolean)
    : undefined as string[] | undefined,
};

export type Config = typeof config;
