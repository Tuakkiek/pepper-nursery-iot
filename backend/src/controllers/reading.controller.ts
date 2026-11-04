import { Request, Response } from 'express';
import { IngestReadingSchema } from '../schemas/reading.schema';
import { readingService } from '../services/reading.service';

export async function ingestReadingHandler(req: Request, res: Response): Promise<void> {
  // Validate request body with Zod
  const parseResult = IngestReadingSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(400).json({
      error: {
        code: 'invalid_reading',
        message: errorDetails,
      },
    });
    return;
  }

  const dto = parseResult.data;

  try {
    const result = await readingService.ingestReading(dto);

    if (result.status === 'created') {
      res.status(201).json({
        device_id: dto.device_id,
        sample_id: dto.sample_id,
        received_at: result.received_at,
        duplicate: false,
      });
      return;
    }

    if (result.status === 'duplicate') {
      res.status(200).json({
        device_id: dto.device_id,
        sample_id: dto.sample_id,
        received_at: result.received_at,
        duplicate: true,
      });
      return;
    }

    if (result.status === 'conflict') {
      res.status(409).json({
        error: {
          code: 'sample_conflict',
          message: 'Same sample_id already exists with different payload content',
        },
      });
      return;
    }
  } catch (err) {
    console.error('Error during reading ingest:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Temporary server error',
      },
    });
  }
}
