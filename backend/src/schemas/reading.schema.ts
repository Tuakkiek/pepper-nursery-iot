import { z } from 'zod';

export const SensorStatusEnum = z.enum(['ok', 'not_calibrated', 'read_error', 'out_of_range']);

export const SensorStatusSchema = z.object({
  dht22: SensorStatusEnum,
  hd38: SensorStatusEnum,
  ds18b20: SensorStatusEnum,
  tds: SensorStatusEnum,
  ph4502c: SensorStatusEnum,
});

export const IngestReadingSchema = z.object({
  schema_version: z.literal('0.1'),
  device_id: z.string().min(1, 'device_id must not be empty'),
  sample_id: z.string().min(1, 'sample_id must not be empty'),
  recorded_at: z.string().datetime().nullable(),
  air_temperature_c: z.number().nullable(),
  air_humidity_pct: z.number().nullable(),
  soil_temperature_c: z.number().nullable(),
  soil_moisture_raw: z.number().int().nullable(),
  soil_moisture_pct: z.number().nullable(),
  water_tds_adc_raw: z.number().int().nullable(),
  water_tds_ppm: z.number().nullable(),
  water_ph_adc_raw: z.number().int().nullable(),
  water_ph: z.number().nullable(),
  sensor_status: SensorStatusSchema,
});

export type IngestReadingDto = z.infer<typeof IngestReadingSchema>;
export type SensorStatus = z.infer<typeof SensorStatusSchema>;

