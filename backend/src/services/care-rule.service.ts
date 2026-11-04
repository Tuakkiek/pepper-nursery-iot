import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/connection';
import { CreateCareRuleDto, UpdateCareRuleDto } from '../schemas/rule.schema';
import { IngestReadingDto } from '../schemas/reading.schema';
import { AdviceResult } from './rule.service';

export interface CareRuleRecord {
  id: number;
  rule_code: string;
  name: string;
  description: string | null;
  parameter: string;
  operator: string;
  threshold_min: number | null;
  threshold_max: number | null;
  severity: 'info' | 'warning' | 'danger';
  action_advice: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class CareRuleService {
  async getAllRules(onlyActive = false): Promise<CareRuleRecord[]> {
    let sql = 'SELECT * FROM care_rules';
    if (onlyActive) {
      sql += ' WHERE is_active = TRUE';
    }
    sql += ' ORDER BY id ASC';

    const [rows] = await pool.query<RowDataPacket[]>(sql);
    return rows.map((r) => ({
      id: r.id,
      rule_code: r.rule_code,
      name: r.name,
      description: r.description,
      parameter: r.parameter,
      operator: r.operator,
      threshold_min: r.threshold_min !== null ? Number(r.threshold_min) : null,
      threshold_max: r.threshold_max !== null ? Number(r.threshold_max) : null,
      severity: r.severity,
      action_advice: r.action_advice,
      is_active: Boolean(r.is_active),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async getRuleById(id: number): Promise<CareRuleRecord | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM care_rules WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      rule_code: r.rule_code,
      name: r.name,
      description: r.description,
      parameter: r.parameter,
      operator: r.operator,
      threshold_min: r.threshold_min !== null ? Number(r.threshold_min) : null,
      threshold_max: r.threshold_max !== null ? Number(r.threshold_max) : null,
      severity: r.severity,
      action_advice: r.action_advice,
      is_active: Boolean(r.is_active),
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  async createRule(dto: CreateCareRuleDto): Promise<CareRuleRecord> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO care_rules (
        rule_code, name, description, parameter, operator,
        threshold_min, threshold_max, severity, action_advice, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.rule_code,
        dto.name,
        dto.description || null,
        dto.parameter,
        dto.operator,
        dto.threshold_min ?? null,
        dto.threshold_max ?? null,
        dto.severity || 'warning',
        dto.action_advice,
        dto.is_active !== undefined ? dto.is_active : true,
      ]
    );

    const created = await this.getRuleById(res.insertId);
    return created!;
  }

  async updateRule(id: number, dto: UpdateCareRuleDto): Promise<CareRuleRecord | null> {
    const existing = await this.getRuleById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (dto.rule_code !== undefined) {
      fields.push('rule_code = ?');
      values.push(dto.rule_code);
    }
    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name);
    }
    if (dto.description !== undefined) {
      fields.push('description = ?');
      values.push(dto.description);
    }
    if (dto.parameter !== undefined) {
      fields.push('parameter = ?');
      values.push(dto.parameter);
    }
    if (dto.operator !== undefined) {
      fields.push('operator = ?');
      values.push(dto.operator);
    }
    if (dto.threshold_min !== undefined) {
      fields.push('threshold_min = ?');
      values.push(dto.threshold_min);
    }
    if (dto.threshold_max !== undefined) {
      fields.push('threshold_max = ?');
      values.push(dto.threshold_max);
    }
    if (dto.severity !== undefined) {
      fields.push('severity = ?');
      values.push(dto.severity);
    }
    if (dto.action_advice !== undefined) {
      fields.push('action_advice = ?');
      values.push(dto.action_advice);
    }
    if (dto.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(dto.is_active);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE care_rules SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.getRuleById(id);
  }

  async deleteRule(id: number): Promise<boolean> {
    const [res] = await pool.query<ResultSetHeader>('DELETE FROM care_rules WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  isConditionMet(val: number, operator: string, min: number | null, max: number | null): boolean {
    switch (operator) {
      case '>':
        return max !== null ? val > max : (min !== null ? val > min : false);
      case '>=':
        return min !== null ? val >= min : (max !== null ? val >= max : false);
      case '<':
        return min !== null ? val < min : (max !== null ? val < max : false);
      case '<=':
        return max !== null ? val <= max : (min !== null ? val <= min : false);
      case 'between':
        return min !== null && max !== null && val >= min && val <= max;
      case 'outside':
        return min !== null && max !== null && (val < min || val > max);
      default:
        return false;
    }
  }

  async evaluateActiveRules(reading: IngestReadingDto | null, isStale: boolean | null): Promise<AdviceResult | null> {
    if (!reading || isStale === true) {
      return null;
    }

    const rules = await this.getAllRules(true);
    if (rules.length === 0) {
      return null;
    }

    const triggeredDangers: string[] = [];
    const triggeredWarnings: string[] = [];
    const triggeredInfos: string[] = [];
    let evaluatedCount = 0;

    for (const rule of rules) {
      let sensorVal: number | null = null;
      let isSensorOk = false;

      switch (rule.parameter) {
        case 'air_temperature_c':
          isSensorOk = reading.sensor_status.dht22 === 'ok' && reading.air_temperature_c !== null;
          sensorVal = reading.air_temperature_c;
          break;
        case 'air_humidity_pct':
          isSensorOk = reading.sensor_status.dht22 === 'ok' && reading.air_humidity_pct !== null;
          sensorVal = reading.air_humidity_pct;
          break;
        case 'soil_temperature_c':
          isSensorOk = reading.sensor_status.ds18b20 === 'ok' && reading.soil_temperature_c !== null;
          sensorVal = reading.soil_temperature_c;
          break;
        case 'soil_moisture_pct':
          // Only evaluate calibrated percentage!
          isSensorOk = reading.sensor_status.hd38 === 'ok' && reading.soil_moisture_pct !== null;
          sensorVal = reading.soil_moisture_pct;
          break;
        case 'water_ph':
          // Only evaluate calibrated pH!
          isSensorOk = reading.sensor_status.ph4502c === 'ok' && reading.water_ph !== null;
          sensorVal = reading.water_ph;
          break;
        case 'water_tds_ppm':
          // Only evaluate calibrated TDS!
          isSensorOk = reading.sensor_status.tds === 'ok' && reading.water_tds_ppm !== null;
          sensorVal = reading.water_tds_ppm;
          break;
      }

      if (isSensorOk && sensorVal !== null) {
        evaluatedCount++;
        const matches = this.isConditionMet(sensorVal, rule.operator, rule.threshold_min, rule.threshold_max);
        if (matches) {
          if (rule.severity === 'danger') {
            triggeredDangers.push(rule.action_advice);
          } else if (rule.severity === 'warning') {
            triggeredWarnings.push(rule.action_advice);
          } else {
            triggeredInfos.push(rule.action_advice);
          }
        }
      }
    }

    if (evaluatedCount === 0) {
      return {
        version: 'dynamic-v1',
        status: 'warning',
        message: 'Chưa đủ dữ liệu cảm biến hợp lệ hoặc cảm biến chưa hiệu chuẩn để đưa ra lời khuyên chăm sóc.',
      };
    }

    if (triggeredDangers.length > 0) {
      return {
        version: 'dynamic-v1',
        status: 'danger',
        message: triggeredDangers.concat(triggeredWarnings).join(' '),
      };
    }

    if (triggeredWarnings.length > 0) {
      return {
        version: 'dynamic-v1',
        status: 'warning',
        message: triggeredWarnings.concat(triggeredInfos).join(' '),
      };
    }

    if (triggeredInfos.length > 0) {
      return {
        version: 'dynamic-v1',
        status: 'ok',
        message: triggeredInfos.join(' '),
      };
    }

    return {
      version: 'dynamic-v1',
      status: 'ok',
      message: 'Các chỉ số môi trường vườn ươm ớt con đang ở mức tối ưu.',
    };
  }
}

export const careRuleService = new CareRuleService();
