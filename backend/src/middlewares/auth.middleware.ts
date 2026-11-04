import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
  full_name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected Bearer <token>',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: {
        code: 'invalid_token',
        message: 'Invalid or expired JWT token',
      },
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: {
        code: 'forbidden',
        message: 'Admin privileges required to perform this action',
      },
    });
    return;
  }

  next();
}

