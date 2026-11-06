import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/online_chess?schema=public'),
  JWT_SECRET: z.string().min(16).default('super-secret-jwt-key-for-development-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_SECRET: z.string().optional().default('super-secret-refresh-key-for-development-change-in-production'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().optional().default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_EMAIL: z.string().email().default('admin@onlinechess.local'),
  ADMIN_PASSWORD: z.string().min(8).default('AdminSecurePass123!'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('Online Chess <no-reply@onlinechess.local>'),
  CLIENT_APP_URL: z.string().optional().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
