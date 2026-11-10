import { Request, Response } from 'express';
import { readingService } from '../services/reading.service';

function resolveRequestedDeviceId(req: Request): string {
  const param = req.params.device_id as string;
  if (param === 'me') {
    return req.user?.selected_device_id || '1';
  }
  return param;
}

export async function listDevicesHandler(req: Request, res: Response): Promise<void> {
  const search = req.query.search as string | undefined;
  try {
    const devices = await readingService.listDevices(search);
    res.status(200).json({
      status: 'ok',
      total: devices.length,
      devices,
    });
  } catch (err: any) {
    console.error('Error listing devices:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to list devices',
      },
    });
  }
}

export async function getDeviceDetailHandler(req: Request, res: Response): Promise<void> {
  const device_id = resolveRequestedDeviceId(req);
  try {
    const dev = await readingService.resolveDevice(device_id);
    if (!dev) {
      res.status(404).json({
        error: {
          code: 'device_not_found',
          message: `Device '${device_id}' does not exist`,
        },
      });
      return;
    }

    const latest = await readingService.getLatestReading(dev.device_id);
    res.status(200).json({
      status: 'ok',
      device: dev,
      is_online: latest && latest.is_stale === false && latest.reading !== null,
      latest_reading: latest,
    });
  } catch (err: any) {
    console.error('Error getting device detail:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to get device detail',
      },
    });
  }
}

export async function createDeviceHandler(req: Request, res: Response): Promise<void> {
  const device_id = req.body.device_id || req.body.id;
  const name = req.body.name;
  const description = req.body.description;

  if (!device_id || !name) {
    res.status(400).json({
      error: {
        code: 'missing_parameters',
        message: 'Both device_id (or id) and name are required',
      },
    });
    return;
  }

  try {
    const dev = await readingService.createDevice({
      device_id: String(device_id).trim(),
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
    });

    res.status(201).json({
      status: 'ok',
      message: 'Device created successfully',
      device: dev,
    });
  } catch (err: any) {
    console.error('Error creating device:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to create device',
      },
    });
  }
}

export async function getLatestReadingHandler(req: Request, res: Response): Promise<void> {
  const device_id = resolveRequestedDeviceId(req);

  try {
    const result = await readingService.getLatestReading(device_id);
    if (!result) {
      res.status(404).json({
        error: {
          code: 'device_not_found',
          message: `Device '${device_id}' does not exist`,
        },
      });
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching latest reading:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Temporary server error',
      },
    });
  }
}

export async function getHistoryReadingsHandler(req: Request, res: Response): Promise<void> {
  const device_id = resolveRequestedDeviceId(req);
  const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

  // If start_date and end_date query params are provided, delegate to range handler
  if (req.query.start_date && req.query.end_date) {
    return getRangeReadingsHandler(req, res);
  }

  try {
    const result = await readingService.getHistoryReadings(device_id, limitQuery);
    if (!result) {
      res.status(404).json({
        error: {
          code: 'device_not_found',
          message: `Device '${device_id}' does not exist`,
        },
      });
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching history readings:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Temporary server error',
      },
    });
  }
}

export async function getRangeReadingsHandler(req: Request, res: Response): Promise<void> {
  const device_id = resolveRequestedDeviceId(req);
  const { start_date, end_date, start_time, end_time, tz, order, page, page_size, limit } = req.query;

  if (!start_date || !end_date) {
    res.status(422).json({
      error: {
        code: 'missing_parameters',
        message: 'Both start_date and end_date query parameters (format YYYY-MM-DD) are required',
      },
    });
    return;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date as string) || !dateRegex.test(end_date as string)) {
    res.status(422).json({
      error: {
        code: 'invalid_date_format',
        message: 'start_date and end_date must be in YYYY-MM-DD format (e.g. 2026-11-08)',
      },
    });
    return;
  }

  try {
    const result = await readingService.getRangeReadings(device_id, {
      start_date: start_date as string,
      end_date: end_date as string,
      start_time: start_time as string | undefined,
      end_time: end_time as string | undefined,
      tz: tz as string | undefined,
      order: order === 'asc' ? 'asc' : 'desc',
      page: page ? parseInt(page as string, 10) : undefined,
      page_size: page_size ? parseInt(page_size as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'device_not_found',
          message: `Device '${device_id}' does not exist`,
        },
      });
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching range readings:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Temporary server error',
      },
    });
  }
}
