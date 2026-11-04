/**
 * DeviceStatus Component
 * Hiển thị thông tin thiết bị, phân biệt recorded_at và received_at,
 * thể hiện rõ múi giờ GMT+7 và nhãn dữ liệu cũ theo docs/contracts/api.md.
 */

export function renderDeviceStatus(container, data) {
  if (!container) return;

  if (!data) {
    container.innerHTML = '';
    return;
  }

  const deviceId = data.device_id || 'esp32-nursery-01';
  const reading = data.reading;
  const isStale = data.is_stale;
  const receivedAt = data.received_at;

  let recordedAt = null;
  let sampleId = '—';

  if (reading) {
    recordedAt = reading.recorded_at;
    sampleId = reading.sample_id || '—';
  }

  // Định dạng thời gian kèm múi giờ GMT+7
  const formatTime = (isoString) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' (GMT+7)';
    } catch (_) {
      return isoString;
    }
  };

  const formattedRecorded = formatTime(recordedAt);
  const formattedReceived = formatTime(receivedAt);

  // Huy hiệu trạng thái dữ liệu
  let statusBadgeHtml = '';
  if (!reading) {
    statusBadgeHtml = '<span class="badge badge-empty">Chưa có bản ghi</span>';
  } else if (isStale === true) {
    statusBadgeHtml = '<span class="badge badge-warning">⚠️ Dữ liệu cũ (> 5 phút)</span>';
  } else if (isStale === false) {
    statusBadgeHtml = '<span class="badge badge-normal">● Đang cập nhật</span>';
  } else {
    statusBadgeHtml = '<span class="badge badge-info">Chưa xác định độ mới</span>';
  }

  container.innerHTML = `
    <div class="card device-status-card">
      <div class="device-status-header">
        <div class="device-info-left">
          <span class="toolbar-label">Mã thiết bị:</span>
          <span class="device-id-badge">${escapeHtml(deviceId)}</span>
          ${statusBadgeHtml}
        </div>
        <div class="toolbar-group">
          <span class="timestamp-label">Mã mẫu (Sample ID):</span>
          <code style="font-size: 14px; font-weight: 600; color: var(--color-navy); background: var(--color-teal-soft); padding: 2px 8px; border-radius: 6px;">${escapeHtml(sampleId)}</code>
        </div>
      </div>

      <div class="timestamps-grid">
        <div class="timestamp-item">
          <span class="timestamp-label">Thời điểm đo (recorded_at - ESP32):</span>
          <span class="timestamp-value">
            ${formattedRecorded ? formattedRecorded : '<span style="color: var(--color-text-secondary); font-weight: normal; font-style: italic;">Chưa đồng bộ giờ (null)</span>'}
          </span>
        </div>

        <div class="timestamp-item">
          <span class="timestamp-label">Thời điểm server nhận (received_at - Backend):</span>
          <span class="timestamp-value">
            ${formattedReceived ? formattedReceived : '<span style="color: var(--color-text-secondary); font-weight: normal;">Chưa nhận</span>'}
          </span>
        </div>
      </div>
    </div>
  `;
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

