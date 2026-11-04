import { z } from 'zod';

export const CareRuleParamEnum = z.enum([
  'air_temperature_c',
  'air_humidity_pct',
  'soil_temperature_c',
  'soil_moisture_pct',
  'water_ph',
  'water_tds_ppm',
]);

export const CareRuleOperatorEnum = z.enum(['>', '<', '>=', '<=', 'between', 'outside']);
export const CareRuleSeverityEnum = z.enum(['info', 'warning', 'danger']);

export const CreateCareRuleSchema = z.object({
  rule_code: z.string().min(2, 'rule_code must be at least 2 chars'),
  name: z.string().min(2, 'name is required'),
  description: z.string().optional().nullable(),
  parameter: CareRuleParamEnum,
  operator: CareRuleOperatorEnum,
  threshold_min: z.number().optional().nullable(),
  threshold_max: z.number().optional().nullable(),
  severity: CareRuleSeverityEnum.default('warning'),
  action_advice: z.string().min(5, 'action_advice must provide clear actionable instructions'),
  is_active: z.boolean().optional().default(true),
});

export const UpdateCareRuleSchema = CreateCareRuleSchema.partial();

export type CreateCareRuleDto = z.infer<typeof CreateCareRuleSchema>;
export type UpdateCareRuleDto = z.infer<typeof UpdateCareRuleSchema>;

