import React from 'react';
import { Cpu, Clock, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

export default function DeviceStatusHero({ data, deviceId }) {
  if (!data) return null;

  const reading = data.reading;
  const isStale = data.is_stale;
  const receivedAt = data.received_at;
  const recordedAt = reading?.recorded_at;
  const sampleId = reading?.sample_id || '—';

  // Format GMT+7
  const formatTime = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' (GMT+7)';
    } catch {
      return iso;
    }
  };

  const formattedRecorded = formatTime(recordedAt);
  const formattedReceived = formatTime(receivedAt);

  // Status Badge
  let badgeComponent = null;
  if (!reading) {
    badgeComponent = (
      <span className="badge badge-empty">
        <HelpCircle size={12} />
        <span>Chưa có bản ghi</span>
      </span>
    );
  } else if (isStale === true) {
    badgeComponent = (
      <span className="badge badge-stale">
        <AlertTriangle size={12} />
        <span>Dữ liệu cũ (&gt; 5 phút)</span>
      </span>
    );
  } else if (isStale === false) {
    badgeComponent = (
      <span className="badge badge-normal">
        <CheckCircle2 size={12} />
        <span>● Đang cập nhật</span>
      </span>
    );
  } else {
    badgeComponent = (
      <span className="badge badge-empty">
        <HelpCircle size={12} />
        <span>Chưa xác định độ mới</span>
      </span>
    );
  }

  return (
    <section className="device-hero-card" aria-label="Thông tin thiết bị và chu kỳ lấy mẫu">
      <div className="device-hero-header">
        <div className="device-hero-identity">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--brand-navy)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Trạm:</span>
            <span className="device-id-code">{data.device_id || deviceId}</span>
          </div>
          {badgeComponent}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Mã mẫu (Sample ID):</span>
          <code style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--brand-navy)',
            background: 'var(--teal-soft)',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            {sampleId}
          </code>
        </div>
      </div>

      <div className="device-timestamps-grid">
        <div className="timestamp-box">
          <span className="timestamp-label">
            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Thời điểm đo (recorded_at - ESP32):
          </span>
          <span className="timestamp-val">
            {formattedRecorded || (
              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 400 }}>
                Chưa đồng bộ giờ (null)
              </span>
            )}
          </span>
        </div>

        <div className="timestamp-box">
          <span className="timestamp-label">
            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Thời điểm server nhận (received_at - Backend):
          </span>
          <span className="timestamp-val">
            {formattedReceived || (
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                Chưa nhận bản ghi
              </span>
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

