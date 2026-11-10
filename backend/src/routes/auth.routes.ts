import { Router } from 'express';
import {
  loginHandler,
  registerHandler,
  meHandler,
  selectDeviceHandler,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.post('/register', registerHandler);
authRouter.get('/me', authenticate, meHandler);
authRouter.put('/me/device', authenticate, selectDeviceHandler);
authRouter.patch('/me/device', authenticate, selectDeviceHandler);

