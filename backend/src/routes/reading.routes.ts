import { Router } from 'express';
import { ingestReadingHandler } from '../controllers/reading.controller';

export const readingRouter = Router();

// POST /api/v1/readings
readingRouter.post('/', ingestReadingHandler);

