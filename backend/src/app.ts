import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes';

export const app = express();

app.use(cors());
app.use(express.json());

// API v1 prefix according to docs/contracts/api.md
app.use('/api/v1', apiRouter);

// Root greeting / status
app.get('/', (req, res) => {
  res.json({
    name: 'Pepper Nursery IoT Backend',
    version: '0.1.0',
    contract_version: '0.1',
    status: 'running',
    endpoints: {
      health: '/api/v1/health',
      ingest: 'POST /api/v1/readings',
      latest: 'GET /api/v1/devices/:device_id/readings/latest',
      history: 'GET /api/v1/devices/:device_id/readings?limit=20',
    },
  });
});

// 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'route_not_found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: {
      code: 'server_error',
      message: 'Temporary server error',
    },
  });
});

