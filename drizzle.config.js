import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

dotenv.config({
  path: `.env.${nodeEnv}`,
  override: true,
});

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  dialect: 'postgresql',
  schema: ['./src/models/*.js'],
  out: './drizzle',
});
