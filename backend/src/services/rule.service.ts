import fs from 'fs';
import path from 'path';
import { IngestReadingDto } from '../schemas/reading.schema';

export interface AdviceResult {
  version: string;
  status: 'ok' | 'warning' | 'danger';
  message: string;
}

interface ThresholdConfig {
  min_critical?: number;
  min_optimal?: number;
  max_optimal?: number;
  max_critical?: number;
  unit: string;
  messages: Record<string, string>;
}

interface RulesConfig {
  version: string;
  enabled: boolean;
  description: string;
  thresholds: {
    air_temperature_c?: ThresholdConfig;
    air_humidity_pct?: ThresholdConfig;
    soil_moisture_pct?: ThresholdConfig;
    water_ph?: ThresholdConfig;
    water_tds_ppm?: ThresholdConfig;
  };
  default_messages: {
    optimal: string;
    insufficient_data: string;
  };
}

export class RuleService {
  private config: RulesConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public loadConfig(): RulesConfig {
    const configPath = path.resolve(__dirname, '../config/rules.config.json');
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not load rules.config.json, using fallback default.', err);
    }

    return {
      version: '0.1-draft',
      enabled: false,
      description: 'Default fallback',
      thresholds: {},
      default_messages: {
        optimal: 'Các chỉ số môi trường vườn ươm ớt con đang ở mức tối ưu.',
        insufficient_data: 'Chưa đủ dữ liệu cảm biến hợp lệ.',
      },
    };
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  public isEnabled(): boolean {
    return process.env.ENABLE_ADVICE === 'true' || this.config.enabled === true;
  }

  public evaluate(reading: IngestReadingDto | null, isStale: boolean | null): AdviceResult | null {
    // Contract G0: If rules are not enabled/approved or reading is null or stale, advice MUST be null
    if (!this.isEnabled() || !reading || isStale === true) {
      return null;
    }

    const warnings: string[] = [];
    const dangers: string[] = [];
    let evaluatedCount = 0;

    const t = this.config.thresholds;

    // 1. Air Temperature
    if (reading.sensor_status.dht22 === 'ok' && reading.air_temperature_c !== null && t.air_temperature_c) {
      evaluatedCount++;
      const val = reading.air_temperature_c;
      const tc = t.air_temperature_c;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push(tc.messages.too_cold.replace('{val}', String(tc.min_critical)));
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push(tc.messages.too_cold.replace('{val}', String(tc.min_optimal)));
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push(tc.messages.too_hot.replace('{val}', String(tc.max_critical)));
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push(tc.messages.too_hot.replace('{val}', String(tc.max_optimal)));
      }
    }

    // 2. Air Humidity
    if (reading.sensor_status.dht22 === 'ok' && reading.air_humidity_pct !== null && t.air_humidity_pct) {
      evaluatedCount++;
      const val = reading.air_humidity_pct;
      const tc = t.air_humidity_pct;
      if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push(tc.messages.too_dry.replace('{val}', String(tc.min_optimal)));
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push(tc.messages.too_humid.replace('{val}', String(tc.max_optimal)));
      }
    }

    // 3. Soil Moisture (%) - Only evaluated if calibrated
    if (reading.sensor_status.hd38 === 'ok' && reading.soil_moisture_pct !== null && t.soil_moisture_pct) {
      evaluatedCount++;
      const val = reading.soil_moisture_pct;
      const tc = t.soil_moisture_pct;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push(tc.messages.too_dry.replace('{val}', String(tc.min_critical)));
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push(tc.messages.too_dry.replace('{val}', String(tc.min_optimal)));
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push(tc.messages.too_wet.replace('{val}', String(tc.max_critical)));
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push(tc.messages.too_wet.replace('{val}', String(tc.max_optimal)));
      }
    }

    // 4. Water pH - Only evaluated if calibrated
    if (reading.sensor_status.ph4502c === 'ok' && reading.water_ph !== null && t.water_ph) {
      evaluatedCount++;
      const val = reading.water_ph;
      const tc = t.water_ph;
      if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push(tc.messages.too_acidic.replace('{val}', String(tc.min_optimal)));
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push(tc.messages.too_alkaline.replace('{val}', String(tc.max_optimal)));
      }
    }

    // 5. Water TDS - Only evaluated if calibrated
    if (reading.sensor_status.tds === 'ok' && reading.water_tds_ppm !== null && t.water_tds_ppm) {
      evaluatedCount++;
      const val = reading.water_tds_ppm;
      const tc = t.water_tds_ppm;
      if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push(tc.messages.too_low.replace('{val}', String(tc.min_optimal)));
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push(tc.messages.too_high.replace('{val}', String(tc.max_optimal)));
      }
    }

    if (evaluatedCount === 0) {
      return {
        version: this.config.version,
        status: 'warning',
        message: this.config.default_messages.insufficient_data,
      };
    }

    if (dangers.length > 0) {
      return {
        version: this.config.version,
        status: 'danger',
        message: dangers.concat(warnings).join(' '),
      };
    }

    if (warnings.length > 0) {
      return {
        version: this.config.version,
        status: 'warning',
        message: warnings.join(' '),
      };
    }

    return {
      version: this.config.version,
      status: 'ok',
      message: this.config.default_messages.optimal,
    };
  }
}

export const ruleService = new RuleService();
