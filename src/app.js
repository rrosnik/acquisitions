import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions!');
  return res.status(200).send('Hello from Acquisitions!');
});

export default app;
