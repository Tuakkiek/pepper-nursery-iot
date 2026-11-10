import React from 'react';
import MetricCard from './MetricCard.jsx';
import { 
  Thermometer, 
  Droplets, 
  Sprout, 
  FlaskConical, 
  TestTube, 
  Gauge, 
  RadioTower 
} from 'lucide-react';

export default function MetricGrid({ reading, isStale }) {
  if (!reading) {
    return (
      <div className="state-box" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📡</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)' }}>
          Chưa có bản ghi số đo nào
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '8px auto 0' }}>
          Trạm thiết bị này chưa gửi dữ liệu lên hệ thống. Vui lòng kiểm tra trạng thái hoạt động của ESP32 hoặc chọn trạm khác trên thanh công cụ.
        </p>
      </div>
    );
  }

  const sensorStatus = reading.sensor_status || {};

  const metrics = [
    {
      id: 'air_temp',
      name: 'Nhiệt độ không khí',
      sensorTag: 'DHT22',
      icon: <Thermometer size={20} />,
      status: sensorStatus.dht22 || 'ok',
      value: reading.air_temperature_c,
      unit: '°C',
      isCalibrated: true,
      rawFallback: null,
      notes: 'Vi khí hậu vườn ươm ớt con'
    },
    {
      id: 'air_hum',
      name: 'Độ ẩm không khí',
      sensorTag: 'DHT22',
      icon: <Droplets size={20} />,
      status: sensorStatus.dht22 || 'ok',
      value: reading.air_humidity_pct,
      unit: '%',
      isCalibrated: true,
      rawFallback: null,
      notes: 'Độ ẩm vi khí hậu vòm che'
    },
    {
      id: 'soil_temp',
      name: 'Nhiệt độ đất',
      sensorTag: 'DS18B20',
      icon: <Sprout size={20} />,
      status: sensorStatus.ds18b20 || 'ok',
      value: reading.soil_temperature_c,
      unit: '°C',
      isCalibrated: true,
      rawFallback: null,
      notes: 'Vùng rễ giá thể ớt non'
    },
    {
      id: 'soil_moisture',
      name: 'Độ ẩm đất / Giá thể',
      sensorTag: 'HD-38',
      icon: <Gauge size={20} />,
      status: sensorStatus.hd38 || 'ok',
      value: reading.soil_moisture_pct,
      unit: '%',
      isCalibrated: reading.soil_moisture_pct !== null && sensorStatus.hd38 === 'ok',
      rawFallback: reading.soil_moisture_raw,
      notes: 'Chỉ gắn % sau hiệu chuẩn'
    },
    {
      id: 'water_tds',
      name: 'TDS mẫu nước / Dung dịch',
      sensorTag: 'TDS Meter V1.0',
      icon: <TestTube size={20} />,
      status: sensorStatus.tds || 'ok',
      value: reading.water_tds_ppm,
      unit: 'ppm',
      isCalibrated: reading.water_tds_ppm !== null && sensorStatus.tds === 'ok',
      rawFallback: reading.water_tds_adc_raw,
      notes: 'Nước tưới & dinh dưỡng'
    },
    {
      id: 'water_ph',
      name: 'pH mẫu nước / Dung dịch',
      sensorTag: 'PH-4502C',
      icon: <FlaskConical size={20} />,
      status: sensorStatus.ph4502c || sensorStatus.ph || 'ok',
      value: reading.water_ph,
      unit: 'pH',
      isCalibrated: reading.water_ph !== null && (sensorStatus.ph4502c === 'ok' || sensorStatus.ph === 'ok' || (!sensorStatus.ph4502c && !sensorStatus.ph)),
      rawFallback: reading.water_ph_adc_raw,
      notes: 'GPIO35 qua mạch chia áp'
    }
  ];

  return (
    <section aria-label="Số đo cảm biến">
      <div className="section-title-wrap">
        <h2 className="section-title">
          <RadioTower size={18} color="var(--brand-teal)" />
          <span>Số đo môi trường thời gian thực</span>
        </h2>
      </div>
      <div className="metrics-grid">
        {metrics.map(m => (
          <MetricCard key={m.id} metric={m} isStale={isStale} />
        ))}
      </div>
    </section>
  );
}

