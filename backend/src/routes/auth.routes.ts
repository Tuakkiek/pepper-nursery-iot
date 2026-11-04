import { Router } from 'express';
import { loginHandler, registerHandler, meHandler } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.post('/register', registerHandler);
authRouter.get('/me', authenticate, meHandler);

