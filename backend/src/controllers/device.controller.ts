import { Request, Response } from 'express';
import { readingService } from '../services/reading.service';

export async function getLatestReadingHandler(req: Request, res: Response): Promise<void> {
  const device_id = req.params.device_id as string;

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
  const device_id = req.params.device_id as string;
  const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

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
