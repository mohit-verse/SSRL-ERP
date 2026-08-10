import express from 'express';
import { config } from './config/env';
import { globalErrorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();
const port = config.port;

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SSRL ERP Backend is running' });
});

// API Routes
import routes from './routes';
app.use('/api/v1', routes);

// Global Error Handler
app.use(globalErrorHandler);

app.listen(port, () => {
  logger.info(`Backend server is listening on port ${port}`);
});
