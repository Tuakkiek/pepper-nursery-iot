import { Request, Response } from 'express';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(400).json({
      error: {
        code: 'invalid_credentials_format',
        message: errorDetails,
      },
    });
    return;
  }

  try {
    const result = await authService.login(parseResult.data);
    if (!result) {
      res.status(401).json({
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password',
        },
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to process login',
      },
    });
  }
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(400).json({
      error: {
        code: 'invalid_registration_data',
        message: errorDetails,
      },
    });
    return;
  }

  try {
    const result = await authService.register(parseResult.data);
    res.status(201).json({
      status: 'ok',
      message: 'User registered successfully',
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        error: {
          code: 'username_exists',
          message: 'Username is already taken',
        },
      });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to register user',
      },
    });
  }
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Not authenticated',
      },
    });
    return;
  }

  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({
      status: 'ok',
      user: user || req.user,
    });
  } catch (err) {
    res.status(200).json({
      status: 'ok',
      user: req.user,
    });
  }
}

export async function selectDeviceHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Authentication required to select device',
      },
    });
    return;
  }

  const deviceInput = req.body.device_id || req.body.id || req.body.name;
  if (!deviceInput) {
    res.status(400).json({
      error: {
        code: 'missing_device_id',
        message: 'Field device_id (or name/id) is required',
      },
    });
    return;
  }

  try {
    const updatedUser = await authService.selectUserDevice(req.user.id, String(deviceInput));
    if (!updatedUser) {
      res.status(404).json({
        error: {
          code: 'device_not_found',
          message: `Device '${deviceInput}' could not be linked`,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      message: 'Device selected successfully',
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('Select device error:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to update selected device',
      },
    });
  }
}

