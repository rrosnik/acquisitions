import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

dotenv.config({
  path: `.env.${nodeEnv}`,
  override: true,
});
