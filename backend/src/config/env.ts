import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  IMAGEKIT_PUBLIC_KEY: z.string(),
  IMAGEKIT_PRIVATE_KEY: z.string(),
  IMAGEKIT_URL_ENDPOINT: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const config = {
  env: _env.data.NODE_ENV,
  port: parseInt(_env.data.PORT, 10),
  db: {
    url: _env.data.DATABASE_URL,
  },
  jwt: {
    secret: _env.data.JWT_SECRET,
    expiresIn: _env.data.JWT_EXPIRES_IN,
  },
  imagekit: {
    publicKey: _env.data.IMAGEKIT_PUBLIC_KEY,
    privateKey: _env.data.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: _env.data.IMAGEKIT_URL_ENDPOINT,
  },
};
