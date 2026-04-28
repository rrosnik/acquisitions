import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from '#routes/auth.routes.js';
import usersRoutes from '#routes/users.routes.js';
import { securityMiddleware } from '#middlewares/security.middleware.js';

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : false,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions!');
  return res.status(200).send('Hello from Acquisitions!');
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  return res.status(200).json({ message: 'Acquisions API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
