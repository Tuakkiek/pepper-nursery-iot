import { Router } from 'express';
import { readingRouter } from './reading.routes';
import { deviceRouter } from './device.routes';

export const apiRouter = Router();

apiRouter.use('/readings', readingRouter);
apiRouter.use('/devices', deviceRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

