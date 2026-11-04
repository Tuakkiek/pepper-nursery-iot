/**
 * MetricCard Component
 * Hiển thị thẻ số đo tuân thủ Design_System_Web_Mobile.md & 05_DKhoa_Web_Dashboard.md
 * Quy tắc:
 * - 0 != null (Số đo 0 hợp lệ hiển thị bình thường)
 * - Chưa hiệu chuẩn: hiển thị raw ADC, TUYỆT ĐỐI không gắn đơn vị %, ppm, pH
 * - Lỗi: hiển thị "—" kèm lý do
 */

export function renderMetricCards(container, reading, isStale) {
  if (!container) return;
  container.innerHTML = '';

  if (!reading) {
    // Trường hợp chưa có bản ghi
    container.innerHTML = `
      <div class="state-box" style="grid-column: 1 / -1;">
        <div class="state-box-icon">📡</div>
        <div class="state-box-title">Chưa có bản ghi số đo nào</div>
        <p class="state-box-desc">Thiết bị chưa gửi dữ liệu lên hệ thống. Vui lòng kiểm tra trạng thái hoạt động của ESP32 hoặc chọn kịch bản mẫu khác.</p>
      </div>
    `;
    return;
  }

  const sensorStatus = reading.sensor_status || {};

  // Định nghĩa 6 thẻ số đo theo hợp đồng 5 cảm biến G0 v0.1
  const metrics = [
    {
      id: 'air_temp',
      name: 'Nhiệt độ không khí',
      sensorTag: 'DHT22',
      icon: '🌡️',
      status: sensorStatus.dht22 || 'ok',
      value: reading.air_temperature_c,
      unit: '°C',
      isCalibrated: true,
      rawFallback: null,
      notes: 'Vi khí hậu vườn ươm'
    },
    {
      id: 'air_hum',
      name: 'Độ ẩm không khí',
      sensorTag: 'DHT22',
      icon: '💧',
      status: sensorStatus.dht22 || 'ok',
      value: reading.air_humidity_pct,
      unit: '%',
      isCalibrated: true,
      rawFallback: null,
      notes: 'Độ ẩm môi trường'
    },
    {
      id: 'soil_temp',
      name: 'Nhiệt độ đất',
      sensorTag: 'DS18B20',
      icon: '🌱',
      status: sensorStatus.ds18b20 || 'ok',
      value: reading.soil_temperature_c,
      unit: '°C',
      isCalibrated: true,
      rawFallback: null,
      notes: 'Vùng rễ ớt con'
    },
    {
      id: 'soil_moisture',
      name: 'Độ ẩm đất',
      sensorTag: 'HD-38',
      icon: '🪴',
      status: sensorStatus.hd38 || 'ok',
      value: reading.soil_moisture_pct,
      unit: '%',
      isCalibrated: reading.soil_moisture_pct !== null && sensorStatus.hd38 === 'ok',
      rawFallback: reading.soil_moisture_raw,
      notes: 'Chỉ gắn % sau hiệu chuẩn'
    },
    {
      id: 'water_tds',
      name: 'TDS mẫu nước/dung dịch',
      sensorTag: 'TDS Meter V1.0',
      icon: '🧪',
      status: sensorStatus.tds || 'ok',
      value: reading.water_tds_ppm,
      unit: 'ppm',
      isCalibrated: reading.water_tds_ppm !== null && sensorStatus.tds === 'ok',
      rawFallback: reading.water_tds_adc_raw,
      notes: 'Nước tưới / dinh dưỡng'
    },
    {
      id: 'water_ph',
      name: 'pH mẫu nước/dung dịch',
      sensorTag: 'PH-4502C',
      icon: '⚗️',
      status: sensorStatus.ph4502c || 'ok',
      value: reading.water_ph,
      unit: 'pH',
      isCalibrated: reading.water_ph !== null && sensorStatus.ph4502c === 'ok',
      rawFallback: reading.water_ph_adc_raw,
      notes: 'GPIO35 qua chia áp'
    }
  ];

  metrics.forEach(m => {
    const cardEl = createMetricCardElement(m, isStale);
    container.appendChild(cardEl);
  });
}

function createMetricCardElement(metric, isStale) {
  const card = document.createElement('div');
  card.className = 'card metric-card';

  let displayValue = '—';
  let displayUnit = '';
  let badgeHtml = '';
  let subnoteHtml = '';

  // Xử lý các trạng thái kỹ thuật
  if (metric.status === 'read_error') {
    card.classList.add('state-error');
    displayValue = '—';
    displayUnit = '';
    badgeHtml = '<span class="badge badge-error">Lỗi cảm biến</span>';
    subnoteHtml = '<span class="metric-raw-note">Không đọc được tín hiệu</span>';
  } else if (metric.status === 'out_of_range') {
    card.classList.add('state-error');
    displayValue = '—';
    badgeHtml = '<span class="badge badge-error">Ngoài dải đo</span>';
    subnoteHtml = '<span class="metric-raw-note">Tín hiệu bất thường</span>';
  } else if (metric.status === 'not_calibrated' || !metric.isCalibrated) {
    // Chưa hiệu chuẩn: hiển thị raw ADC, KHÔNG gắn đơn vị %, ppm, pH
    card.classList.add('state-uncalibrated');
    if (metric.rawFallback !== null && metric.rawFallback !== undefined) {
      displayValue = metric.rawFallback.toLocaleString('vi-VN');
      displayUnit = '<span style="font-size: 13px; font-weight: normal; color: var(--color-text-secondary);">(ADC thô)</span>';
      subnoteHtml = '<span class="metric-raw-note">Chưa hiệu chuẩn (chưa gắn ' + metric.unit + ')</span>';
    } else {
      displayValue = '—';
      subnoteHtml = '<span class="metric-raw-note">Không có số đọc</span>';
    }
    badgeHtml = '<span class="badge badge-uncalibrated">Chưa hiệu chuẩn</span>';
  } else {
    // Trạng thái ok và đã hiệu chuẩn (hoặc cảm biến chuẩn nhà máy như DHT22/DS18B20)
    if (metric.value !== null && metric.value !== undefined) {
      // 0 là giá trị hợp lệ!
      const formattedNum = typeof metric.value === 'number' 
        ? metric.value.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : metric.value;
      displayValue = formattedNum;
      displayUnit = metric.unit;

      if (isStale) {
        card.classList.add('state-stale');
        badgeHtml = '<span class="badge badge-stale">Dữ liệu cũ</span>';
      } else {
        badgeHtml = '<span class="badge badge-normal">Bình thường</span>';
      }
      subnoteHtml = `<span class="metric-raw-note">${metric.notes}</span>`;
    } else {
      displayValue = '—';
      badgeHtml = '<span class="badge badge-empty">Không có số đo</span>';
      subnoteHtml = '<span class="metric-raw-note">Dữ liệu rỗng</span>';
    }
  }

  card.innerHTML = `
    <div class="metric-card-top">
      <div class="metric-name-wrap">
        <span class="metric-name">${escapeHtml(metric.name)}</span>
        <span class="metric-sensor-tag">${escapeHtml(metric.sensorTag)}</span>
      </div>
      <span class="metric-icon" aria-hidden="true">${metric.icon}</span>
    </div>

    <div class="metric-value-wrap">
      <div class="metric-value tabular-nums">${displayValue}</div>
      ${displayUnit ? `<div class="metric-unit">${displayUnit}</div>` : ''}
    </div>

    ${subnoteHtml}

    <div class="metric-card-footer">
      ${badgeHtml}
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

