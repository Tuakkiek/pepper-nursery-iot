/**
 * G0 v0.1 Mock Fixtures
 * Matches files in docs/contracts/fixtures/ and contracts in api.md & sensor-reading.md
 */

export const G0_FIXTURES = {
  // 1. Mẫu hợp lệ, mới (latest-normal.json)
  normal: {
    device_id: "esp32-nursery-01",
    reading: {
      schema_version: "0.1",
      device_id: "esp32-nursery-01",
      sample_id: "sample-0001",
      recorded_at: "2026-11-04T08:00:00Z",
      air_temperature_c: 28.2,
      air_humidity_pct: 72.0,
      soil_temperature_c: 27.1,
      soil_moisture_raw: 1800,
      soil_moisture_pct: 46.0,
      water_tds_adc_raw: 1560,
      water_tds_ppm: 620.0,
      water_ph_adc_raw: 1930,
      water_ph: 6.4,
      sensor_status: {
        dht22: "ok",
        hd38: "ok",
        ds18b20: "ok",
        tds: "ok",
        ph4502c: "ok"
      }
    },
    received_at: "2026-11-04T08:00:02Z",
    is_stale: false,
    advice: null
  },

  // 2. Cảm biến chưa hiệu chuẩn (latest-uncalibrated.json)
  uncalibrated: {
    device_id: "esp32-nursery-01",
    reading: {
      schema_version: "0.1",
      device_id: "esp32-nursery-01",
      sample_id: "sample-0002",
      recorded_at: null,
      air_temperature_c: 28.2,
      air_humidity_pct: 72.0,
      soil_temperature_c: 27.1,
      soil_moisture_raw: 1800,
      soil_moisture_pct: null,
      water_tds_adc_raw: 1560,
      water_tds_ppm: null,
      water_ph_adc_raw: 1930,
      water_ph: null,
      sensor_status: {
        dht22: "ok",
        hd38: "not_calibrated",
        ds18b20: "ok",
        tds: "not_calibrated",
        ph4502c: "not_calibrated"
      }
    },
    received_at: "2026-11-04T08:01:02Z",
    is_stale: null,
    advice: null
  },

  // 3. Lỗi một phần cảm biến (latest-partial-error.json)
  partial_error: {
    device_id: "esp32-nursery-01",
    reading: {
      schema_version: "0.1",
      device_id: "esp32-nursery-01",
      sample_id: "sample-0003",
      recorded_at: "2026-11-04T08:02:00Z",
      air_temperature_c: null,
      air_humidity_pct: null,
      soil_temperature_c: 27.0,
      soil_moisture_raw: 1805,
      soil_moisture_pct: null,
      water_tds_adc_raw: null,
      water_tds_ppm: null,
      water_ph_adc_raw: 1932,
      water_ph: null,
      sensor_status: {
        dht22: "read_error",
        hd38: "not_calibrated",
        ds18b20: "ok",
        tds: "read_error",
        ph4502c: "not_calibrated"
      }
    },
    received_at: "2026-11-04T08:02:02Z",
    is_stale: false,
    advice: null
  },

  // 4. Dữ liệu cũ / Thiết bị mất liên lạc (latest-stale.json)
  stale: {
    device_id: "esp32-nursery-01",
    reading: {
      schema_version: "0.1",
      device_id: "esp32-nursery-01",
      sample_id: "sample-0001",
      recorded_at: "2026-11-04T08:00:00Z",
      air_temperature_c: 28.2,
      air_humidity_pct: 72.0,
      soil_temperature_c: 27.1,
      soil_moisture_raw: 1800,
      soil_moisture_pct: 46.0,
      water_tds_adc_raw: 1560,
      water_tds_ppm: 620.0,
      water_ph_adc_raw: 1930,
      water_ph: 6.4,
      sensor_status: {
        dht22: "ok",
        hd38: "ok",
        ds18b20: "ok",
        tds: "ok",
        ph4502c: "ok"
      }
    },
    received_at: "2026-11-04T08:00:02Z",
    is_stale: true,
    advice: null
  },

  // 5. Chưa có dữ liệu (latest-empty.json)
  empty: {
    device_id: "esp32-nursery-01",
    reading: null,
    received_at: null,
    is_stale: null,
    advice: null
  },

  // 6. Số đo hợp lệ bằng 0 (Kiểm thử 0 != null)
  zero_valid: {
    device_id: "esp32-nursery-01",
    reading: {
      schema_version: "0.1",
      device_id: "esp32-nursery-01",
      sample_id: "sample-0004",
      recorded_at: "2026-11-04T08:05:00Z",
      air_temperature_c: 0.0,
      air_humidity_pct: 50.0,
      soil_temperature_c: 25.0,
      soil_moisture_raw: 2100,
      soil_moisture_pct: 0.0,
      water_tds_adc_raw: 1500,
      water_tds_ppm: 0.0,
      water_ph_adc_raw: 1900,
      water_ph: 7.0,
      sensor_status: {
        dht22: "ok",
        hd38: "ok",
        ds18b20: "ok",
        tds: "ok",
        ph4502c: "ok"
      }
    },
    received_at: "2026-11-04T08:05:02Z",
    is_stale: false,
    advice: null
  },

  // 7. Có lời khuyên chăm sóc từ Backend (hợp đồng MThuy/TDat khi được bật)
  with_advice: {
    device_id: "esp32-nursery-01",
    reading: {
      schema_version: "0.1",
      device_id: "esp32-nursery-01",
      sample_id: "sample-0005",
      recorded_at: "2026-11-04T08:15:00Z",
      air_temperature_c: 34.5,
      air_humidity_pct: 42.0,
      soil_temperature_c: 31.0,
      soil_moisture_raw: 1650,
      soil_moisture_pct: 35.0,
      water_tds_adc_raw: 1560,
      water_tds_ppm: 620.0,
      water_ph_adc_raw: 1930,
      water_ph: 6.4,
      sensor_status: {
        dht22: "ok",
        hd38: "ok",
        ds18b20: "ok",
        tds: "ok",
        ph4502c: "ok"
      }
    },
    received_at: "2026-11-04T08:15:02Z",
    is_stale: false,
    advice: {
      version: "1.0",
      status: "warning",
      message: "Nhiệt độ không khí cao (34,5 °C) và độ ẩm thấp (42 %). Cần bật phun sương làm mát cho vườn ươm ớt con."
    }
  },

  // 8. Lỗi server (server-error.json)
  server_error: {
    error: {
      code: "server_error",
      message: "Lỗi kết nối máy chủ dịch vụ backend (500 Internal Server Error)"
    }
  }
};

// Fixture lịch sử (history.json mở rộng cho biểu đồ trực quan)
export const G0_HISTORY_FIXTURE = {
  device_id: "esp32-nursery-01",
  limit: 20,
  readings: [
    {
      reading: {
        schema_version: "0.1",
        device_id: "esp32-nursery-01",
        sample_id: "sample-0010",
        recorded_at: "2026-11-04T08:10:00Z",
        air_temperature_c: 28.5,
        air_humidity_pct: 71.0,
        soil_temperature_c: 27.2,
        soil_moisture_raw: 1810,
        soil_moisture_pct: 46.5,
        water_tds_adc_raw: 1565,
        water_tds_ppm: 625.0,
        water_ph_adc_raw: 1930,
        water_ph: 6.4,
        sensor_status: { dht22: "ok", hd38: "ok", ds18b20: "ok", tds: "ok", ph4502c: "ok" }
      },
      received_at: "2026-11-04T08:10:02Z"
    },
    {
      reading: {
        schema_version: "0.1",
        device_id: "esp32-nursery-01",
        sample_id: "sample-0009",
        recorded_at: "2026-11-04T08:08:00Z",
        air_temperature_c: 28.4,
        air_humidity_pct: 71.5,
        soil_temperature_c: 27.1,
        soil_moisture_raw: 1805,
        soil_moisture_pct: 46.2,
        water_tds_adc_raw: 1562,
        water_tds_ppm: 622.0,
        water_ph_adc_raw: 1930,
        water_ph: 6.4,
        sensor_status: { dht22: "ok", hd38: "ok", ds18b20: "ok", tds: "ok", ph4502c: "ok" }
      },
      received_at: "2026-11-04T08:08:02Z"
    },
    {
      reading: {
        schema_version: "0.1",
        device_id: "esp32-nursery-01",
        sample_id: "sample-0008",
        recorded_at: "2026-11-04T08:06:00Z",
        air_temperature_c: 28.3,
        air_humidity_pct: 71.8,
        soil_temperature_c: 27.1,
        soil_moisture_raw: 1800,
        soil_moisture_pct: 46.0,
        water_tds_adc_raw: 1560,
        water_tds_ppm: 620.0,
        water_ph_adc_raw: 1930,
        water_ph: 6.4,
        sensor_status: { dht22: "ok", hd38: "ok", ds18b20: "ok", tds: "ok", ph4502c: "ok" }
      },
      received_at: "2026-11-04T08:06:02Z"
    },
    {
      // Điểm đọc lỗi để kiểm tra chart: KHÔNG nối đường qua điểm null
      reading: {
        schema_version: "0.1",
        device_id: "esp32-nursery-01",
        sample_id: "sample-0007",
        recorded_at: "2026-11-04T08:04:00Z",
        air_temperature_c: null,
        air_humidity_pct: null,
        soil_temperature_c: 27.0,
        soil_moisture_raw: 1800,
        soil_moisture_pct: null,
        water_tds_adc_raw: null,
        water_tds_ppm: null,
        water_ph_adc_raw: 1930,
        water_ph: null,
        sensor_status: { dht22: "read_error", hd38: "not_calibrated", ds18b20: "ok", tds: "read_error", ph4502c: "not_calibrated" }
      },
      received_at: "2026-11-04T08:04:02Z"
    },
    {
      reading: {
        schema_version: "0.1",
        device_id: "esp32-nursery-01",
        sample_id: "sample-0006",
        recorded_at: "2026-11-04T08:02:00Z",
        air_temperature_c: 28.2,
        air_humidity_pct: 72.0,
        soil_temperature_c: 27.1,
        soil_moisture_raw: 1800,
        soil_moisture_pct: 46.0,
        water_tds_adc_raw: 1560,
        water_tds_ppm: 620.0,
        water_ph_adc_raw: 1930,
        water_ph: 6.4,
        sensor_status: { dht22: "ok", hd38: "ok", ds18b20: "ok", tds: "ok", ph4502c: "ok" }
      },
      received_at: "2026-11-04T08:02:02Z"
    },
    {
      reading: {
        schema_version: "0.1",
        device_id: "esp32-nursery-01",
        sample_id: "sample-0001",
        recorded_at: "2026-11-04T08:00:00Z",
        air_temperature_c: 28.1,
        air_humidity_pct: 72.2,
        soil_temperature_c: 27.0,
        soil_moisture_raw: 1795,
        soil_moisture_pct: 45.8,
        water_tds_adc_raw: 1555,
        water_tds_ppm: 618.0,
        water_ph_adc_raw: 1928,
        water_ph: 6.4,
        sensor_status: { dht22: "ok", hd38: "ok", ds18b20: "ok", tds: "ok", ph4502c: "ok" }
      },
      received_at: "2026-11-04T08:00:02Z"
    }
  ]
};

