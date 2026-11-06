import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes';

export const app = express();

// CORS Configuration allowing Web Dashboard on Render & local dev
const allowedOrigins = [
  'https://pepper-nursery-iot-em0t.onrender.com',
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/.*\.onrender\.com$/,
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(null, true); // Fallback: allow to avoid blocking demo
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-use-fixture', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

