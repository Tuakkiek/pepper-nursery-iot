import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Sprout, 
  FlaskConical, 
  TestTube, 
  Gauge, 
  AlertOctagon, 
  Clock 
} from 'lucide-react';

export default function MetricCard({ metric, isStale }) {
  let displayValue = '—';
  let displayUnit = '';
  let badgeHtml = null;
  let subnote = metric.notes;
  let cardClass = 'metric-card';

  if (metric.status === 'read_error') {
    cardClass += ' state-error';
    displayValue = '—';
    badgeHtml = (
      <span className="badge badge-error">
        <AlertOctagon size={12} />
        <span>Lỗi cảm biến</span>
      </span>
    );
    subnote = 'Không đọc được tín hiệu từ cảm biến';
  } else if (metric.status === 'out_of_range') {
    cardClass += ' state-error';
    displayValue = '—';
    badgeHtml = <span className="badge badge-error">Ngoài dải đo</span>;
    subnote = 'Tín hiệu điện áp bất thường';
  } else if (metric.status === 'not_calibrated' || !metric.isCalibrated) {
    cardClass += ' state-uncalibrated';
    if (metric.rawFallback !== null && metric.rawFallback !== undefined) {
      displayValue = metric.rawFallback.toLocaleString('vi-VN');
      displayUnit = '(ADC thô)';
      subnote = `Chưa hiệu chuẩn (chưa gắn ${metric.unit})`;
    } else {
      displayValue = '—';
      subnote = 'Không có số đọc ADC';
    }
    badgeHtml = <span className="badge badge-uncalibrated">Chưa hiệu chuẩn</span>;
  } else {
    // Normal & Calibrated
    if (metric.value !== null && metric.value !== undefined) {
      const formatted = typeof metric.value === 'number'
        ? metric.value.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : metric.value;
      displayValue = formatted;
      displayUnit = metric.unit;

      if (isStale) {
        cardClass += ' state-stale';
        badgeHtml = (
          <span className="badge badge-stale">
            <Clock size={12} />
            <span>Dữ liệu cũ</span>
          </span>
        );
      } else {
        badgeHtml = <span className="badge badge-normal">● Bình thường</span>;
      }
    } else {
      displayValue = '—';
      badgeHtml = <span className="badge badge-empty">Không có số đo</span>;
      subnote = 'Dữ liệu rỗng từ máy chủ';
    }
  }

  return (
    <div className={cardClass}>
      <div className="metric-card-header">
        <div className="metric-title-group">
          <span className="metric-name">{metric.name}</span>
          <span className="metric-sensor-chip">{metric.sensorTag}</span>
        </div>
        <div className="metric-icon-circle" aria-hidden="true">
          {metric.icon}
        </div>
      </div>

      <div className="metric-value-block">
        <span className="metric-value tabular-nums">{displayValue}</span>
        {displayUnit && <span className="metric-unit">{displayUnit}</span>}
      </div>

      <div className="metric-subnote">{subnote}</div>

      <div className="metric-card-footer">
        {badgeHtml}
      </div>
    </div>
  );
}

