import fs from 'fs';
import path from 'path';
import { IngestReadingDto } from '../schemas/reading.schema';

export interface AdviceResult {
  version: string;
  status: 'optimal' | 'warning' | 'danger' | 'insufficient_data';
  priority?: number;
  code?: string;
  message: string;
  suggested_action?: string;
}

interface ThresholdConfig {
  min_critical?: number;
  min_optimal?: number;
  max_optimal?: number;
  max_critical?: number;
  unit: string;
  messages: Record<string, string>;
  actions?: Record<string, string>;
}

interface RulesConfig {
  version: string;
  enabled: boolean;
  description: string;
  thresholds: {
    air_temperature_c?: ThresholdConfig;
    air_humidity_pct?: ThresholdConfig;
    soil_moisture_pct?: ThresholdConfig;
    soil_temperature_c?: ThresholdConfig;
    water_ph?: ThresholdConfig;
    water_tds_ppm?: ThresholdConfig;
  };
  default_messages: {
    optimal: string;
    optimal_action?: string;
    insufficient_data: string;
    insufficient_data_action?: string;
  };
}

export class RuleService {
  private config: RulesConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public loadConfig(): RulesConfig {
    const candidatePaths = [
      path.resolve(__dirname, '../config/rules.config.json'),
      path.resolve(process.cwd(), 'src/config/rules.config.json'),
      path.resolve(process.cwd(), 'dist/config/rules.config.json'),
    ];

    for (const configPath of candidatePaths) {
      try {
        if (fs.existsSync(configPath)) {
          const raw = fs.readFileSync(configPath, 'utf-8');
          return JSON.parse(raw);
        }
      } catch (err) {
        console.warn(`Could not load rules config from ${configPath}:`, err);
      }
    }

    return {
      version: '0.1',
      enabled: true,
      description: 'Default fallback',
      thresholds: {},
      default_messages: {
        optimal: 'Tuyệt vời: Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng nhất!',
        optimal_action: 'Duy trì chế độ thông gió và lịch tưới ổn định hiện tại (1-2 lần/ngày).',
        insufficient_data: 'Dữ liệu cảm biến không đủ hoặc đã cũ, không thể đánh giá tình trạng vườn ươm.',
        insufficient_data_action: 'Kiểm tra lại kết nối phần cứng, nguồn điện trạm ESP32 hoặc hoàn tất hiệu chuẩn cảm biến.',
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
    // Contract G0: If rules are not enabled or reading is null or stale, return advice accordingly
    if (!this.isEnabled()) {
      return null;
    }

    if (!reading || isStale === true) {
      return {
        version: this.config.version || '0.1',
        status: 'insufficient_data',
        priority: 1,
        code: 'ERR_INSUFFICIENT_DATA',
        message: this.config.default_messages.insufficient_data,
        suggested_action: this.config.default_messages.insufficient_data_action || 'Kiểm tra trạm đo và kết nối.',
      };
    }

    const dangers: { msg: string; action: string; code: string }[] = [];
    const warnings: { msg: string; action: string; code: string }[] = [];
    let evaluatedCount = 0;

    const t = this.config.thresholds;

    // 1. Air Temperature
    if (reading.sensor_status.dht22 === 'ok' && reading.air_temperature_c !== null && t.air_temperature_c) {
      evaluatedCount++;
      const val = reading.air_temperature_c;
      const tc = t.air_temperature_c;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push({
          msg: (tc.messages.too_cold_critical || tc.messages.too_cold || '').replace('{val}', String(tc.min_critical)),
          action: tc.actions?.too_cold_critical || 'Che chắn gió lùa, phủ nylon giữ ấm.',
          code: 'ERR_TEMP_CRITICAL_LOW',
        });
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push({
          msg: (tc.messages.too_cold_warning || tc.messages.too_cold || '').replace('{val}', String(tc.min_optimal)),
          action: tc.actions?.too_cold_warning || 'Khép bớt cửa gió, tránh tưới nước lạnh.',
          code: 'WARN_TEMP_LOW',
        });
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push({
          msg: (tc.messages.too_hot_critical || tc.messages.too_hot || '').replace('{val}', String(tc.max_critical)),
          action: tc.actions?.too_hot_critical || 'Kéo lưới che nắng, bật phun sương làm mát.',
          code: 'ERR_TEMP_CRITICAL_HIGH',
        });
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push({
          msg: (tc.messages.too_hot_warning || tc.messages.too_hot || '').replace('{val}', String(tc.max_optimal)),
          action: tc.actions?.too_hot_warning || 'Mở thông gió, kéo lưới che nắng.',
          code: 'WARN_TEMP_HIGH',
        });
      }
    }

    // 2. Air Humidity
    if (reading.sensor_status.dht22 === 'ok' && reading.air_humidity_pct !== null && t.air_humidity_pct) {
      evaluatedCount++;
      const val = reading.air_humidity_pct;
      const tc = t.air_humidity_pct;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push({
          msg: (tc.messages.too_dry_critical || tc.messages.too_dry || '').replace('{val}', String(tc.min_critical)),
          action: tc.actions?.too_dry_critical || 'Bật phun sương làm ẩm không gian.',
          code: 'ERR_HUM_CRITICAL_LOW',
        });
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push({
          msg: (tc.messages.too_dry_warning || tc.messages.too_dry || '').replace('{val}', String(tc.min_optimal)),
          action: tc.actions?.too_dry_warning || 'Phun sương nhẹ giữ ẩm không khí.',
          code: 'WARN_HUM_LOW',
        });
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push({
          msg: (tc.messages.too_humid_critical || tc.messages.too_humid || '').replace('{val}', String(tc.max_critical)),
          action: tc.actions?.too_humid_critical || 'Mở tối đa cửa gió, quạt đối lưu.',
          code: 'ERR_HUM_CRITICAL_HIGH',
        });
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push({
          msg: (tc.messages.too_humid_warning || tc.messages.too_humid || '').replace('{val}', String(tc.max_optimal)),
          action: tc.actions?.too_humid_warning || 'Tăng thông gió, tránh tưới chiều tối.',
          code: 'WARN_HUM_HIGH',
        });
      }
    }

    // 3. Soil Moisture (%) - Only evaluated if calibrated
    if (reading.sensor_status.hd38 === 'ok' && reading.soil_moisture_pct !== null && t.soil_moisture_pct) {
      evaluatedCount++;
      const val = reading.soil_moisture_pct;
      const tc = t.soil_moisture_pct;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push({
          msg: (tc.messages.too_dry_critical || tc.messages.too_dry || '').replace('{val}', String(tc.min_critical)),
          action: tc.actions?.too_dry_critical || 'Tưới bù ẩm khẩn cấp bằng phun sương mịn.',
          code: 'ERR_SOIL_CRITICAL_DRY',
        });
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push({
          msg: (tc.messages.too_dry_warning || tc.messages.too_dry || '').replace('{val}', String(tc.min_optimal)),
          action: tc.actions?.too_dry_warning || 'Chuẩn bị tưới bổ sung nước sạch.',
          code: 'WARN_SOIL_DRY',
        });
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push({
          msg: (tc.messages.too_wet_critical || tc.messages.too_wet || '').replace('{val}', String(tc.max_critical)),
          action: tc.actions?.too_wet_critical || 'Ngừng tưới ngay, kê khay xốp cao, thông gió đáy.',
          code: 'ERR_SOIL_CRITICAL_WET',
        });
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push({
          msg: (tc.messages.too_wet_warning || tc.messages.too_wet || '').replace('{val}', String(tc.max_optimal)),
          action: tc.actions?.too_wet_warning || 'Tạm dừng cữ tưới tiếp theo, chờ se mặt giá thể.',
          code: 'WARN_SOIL_WET',
        });
      }
    }

    // 4. Soil Temperature (°C)
    if (reading.sensor_status.ds18b20 === 'ok' && reading.soil_temperature_c !== null && t.soil_temperature_c) {
      evaluatedCount++;
      const val = reading.soil_temperature_c;
      const tc = t.soil_temperature_c;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push({
          msg: (tc.messages.too_cold_critical || '').replace('{val}', String(tc.min_critical)),
          action: tc.actions?.too_cold_critical || 'Kê khay cách đất 20cm, rơm rạ cách nhiệt đáy luống.',
          code: 'ERR_SOIL_TEMP_CRITICAL_LOW',
        });
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push({
          msg: (tc.messages.too_cold_warning || '').replace('{val}', String(tc.min_optimal)),
          action: tc.actions?.too_cold_warning || 'Tưới nước lúc ấm (khoảng 10h sáng).',
          code: 'WARN_SOIL_TEMP_LOW',
        });
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push({
          msg: (tc.messages.too_hot_critical || '').replace('{val}', String(tc.max_critical)),
          action: tc.actions?.too_hot_critical || 'Tưới làm mát bằng nước mát nhẹ, che nắng xiên.',
          code: 'ERR_SOIL_TEMP_CRITICAL_HIGH',
        });
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push({
          msg: (tc.messages.too_hot_warning || '').replace('{val}', String(tc.max_optimal)),
          action: tc.actions?.too_hot_warning || 'Tránh nắng rọi trực tiếp vào thành khay xốp.',
          code: 'WARN_SOIL_TEMP_HIGH',
        });
      }
    }

    // 5. Water pH - Only evaluated if calibrated
    if (reading.sensor_status.ph4502c === 'ok' && reading.water_ph !== null && t.water_ph) {
      evaluatedCount++;
      const val = reading.water_ph;
      const tc = t.water_ph;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push({
          msg: (tc.messages.too_acid_critical || tc.messages.too_acidic || '').replace('{val}', String(tc.min_critical)),
          action: tc.actions?.too_acid_critical || 'Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5.',
          code: 'ERR_PH_CRITICAL_ACID',
        });
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push({
          msg: (tc.messages.too_acid_warning || tc.messages.too_acidic || '').replace('{val}', String(tc.min_optimal)),
          action: tc.actions?.too_acid_warning || 'Châm thêm nước giếng sạch hoặc sục khí bể chứa.',
          code: 'WARN_PH_ACID',
        });
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push({
          msg: (tc.messages.too_alkaline_critical || tc.messages.too_alkaline || '').replace('{val}', String(tc.max_critical)),
          action: tc.actions?.too_alkaline_critical || 'Tuyệt đối không tưới! Dùng axit citric hữu cơ hạ pH về 6.0-6.5.',
          code: 'ERR_PH_CRITICAL_ALKALINE',
        });
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push({
          msg: (tc.messages.too_alkaline_warning || tc.messages.too_alkaline || '').replace('{val}', String(tc.max_optimal)),
          action: tc.actions?.too_alkaline_warning || 'Theo dõi gân lá non, chuẩn bị điều chỉnh nhẹ pH.',
          code: 'WARN_PH_ALKALINE',
        });
      }
    }

    // 6. Water TDS - Only evaluated if calibrated
    if (reading.sensor_status.tds === 'ok' && reading.water_tds_ppm !== null && t.water_tds_ppm) {
      evaluatedCount++;
      const val = reading.water_tds_ppm;
      const tc = t.water_tds_ppm;
      if (tc.min_critical !== undefined && val < tc.min_critical) {
        dangers.push({
          msg: (tc.messages.too_low_critical || tc.messages.too_low || '').replace('{val}', String(tc.min_critical)),
          action: tc.actions?.too_low_critical || 'Nước nghèo khoáng; sau 15 ngày châm nhẹ hữu cơ vi sinh.',
          code: 'ERR_TDS_CRITICAL_LOW',
        });
      } else if (tc.min_optimal !== undefined && val < tc.min_optimal) {
        warnings.push({
          msg: (tc.messages.too_low_warning || tc.messages.too_low || '').replace('{val}', String(tc.min_optimal)),
          action: tc.actions?.too_low_warning || 'Nước sạch an toàn cho cây con dưới 10 ngày tuổi.',
          code: 'WARN_TDS_LOW',
        });
      } else if (tc.max_critical !== undefined && val > tc.max_critical) {
        dangers.push({
          msg: (tc.messages.too_high_critical || tc.messages.too_high || '').replace('{val}', String(tc.max_critical)),
          action: tc.actions?.too_high_critical || 'Nguy hiểm khẩn cấp! Ngừng tưới, xả nước sạch rửa trôi muối.',
          code: 'ERR_TDS_CRITICAL_HIGH',
        });
      } else if (tc.max_optimal !== undefined && val > tc.max_optimal) {
        warnings.push({
          msg: (tc.messages.too_high_warning || tc.messages.too_high || '').replace('{val}', String(tc.max_optimal)),
          action: tc.actions?.too_high_warning || 'Pha loãng thêm 30-50% nước sạch trước khi tưới.',
          code: 'WARN_TDS_HIGH',
        });
      }
    }

    if (evaluatedCount === 0) {
      return {
        version: this.config.version || '0.1',
        status: 'insufficient_data',
        priority: 1,
        code: 'ERR_INSUFFICIENT_DATA',
        message: this.config.default_messages.insufficient_data,
        suggested_action: this.config.default_messages.insufficient_data_action || 'Kiểm tra trạm đo và kết nối.',
      };
    }

    if (dangers.length > 0) {
      return {
        version: this.config.version || '0.1',
        status: 'danger',
        priority: 2,
        code: dangers[0].code,
        message: dangers.map((d) => d.msg).join(' '),
        suggested_action: dangers.map((d) => d.action).join('; '),
      };
    }

    if (warnings.length > 0) {
      return {
        version: this.config.version || '0.1',
        status: 'warning',
        priority: 3,
        code: warnings[0].code,
        message: warnings.map((w) => w.msg).join(' '),
        suggested_action: warnings.map((w) => w.action).join('; '),
      };
    }

    return {
      version: this.config.version || '0.1',
      status: 'optimal',
      priority: 5,
      code: 'ENV_OPTIMAL',
      message: this.config.default_messages.optimal,
      suggested_action: this.config.default_messages.optimal_action || 'Duy trì chế độ thông gió và lịch tưới ổn định.',
    };
  }
}

export const ruleService = new RuleService();
