import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Sprout, Wrench } from 'lucide-react';

export default function CareAdviceBanner({ advice, reading, isStale }) {
  // 1. Chưa có số đo
  if (!reading) {
    return (
      <div className="advice-banner info">
        <div className="advice-icon-wrap">
          <Info size={28} color="var(--text-secondary)" />
        </div>
        <div className="advice-body">
          <div className="advice-title">Trạng thái chăm sóc</div>
          <div className="advice-text">
            Chưa có dữ liệu số đo từ vườn ươm để đưa ra nhận định sinh học.
          </div>
          <div className="advice-meta">Quy tắc G0 v0.1 — Nguồn: Agronomy MThuy</div>
        </div>
      </div>
    );
  }

  // 2. Dữ liệu cũ (> 5 phút) theo Mục 5.2
  if (isStale === true) {
    return (
      <div className="advice-banner warning">
        <div className="advice-icon-wrap">
          <AlertTriangle size={28} color="var(--amber-strong)" />
        </div>
        <div className="advice-body">
          <div className="advice-title">Tạm dừng nhận định (Dữ liệu cũ)</div>
          <div className="advice-text">
            Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc trạm mất liên lạc. Hệ thống tạm dừng đưa ra lời khuyên chăm sóc.
          </div>
          <div className="advice-meta">Quy tắc an toàn: Không tính toán lời khuyên trên dữ liệu cũ</div>
        </div>
      </div>
    );
  }

  // 3. Môi trường tối ưu hoặc chưa có cảnh báo (advice === null hoặc status === 'optimal' theo Mục 5.2)
  if (!advice || advice.status === 'optimal') {
    return (
      <div className="advice-banner normal">
        <div className="advice-icon-wrap">
          <Sprout size={28} color="var(--brand-teal)" />
        </div>
        <div className="advice-body">
          <div className="advice-title">Tình trạng sinh trưởng tối ưu</div>
          <div className="advice-text">
            Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng.
          </div>
        </div>
      </div>
    );
  }

  // 4. Có lời khuyên chăm sóc do Backend trả về (danger hoặc warning theo Mục 5.2)
  const isDanger = advice.status === 'danger';
  const isWarning = advice.status === 'warning';
  const bannerType = isDanger ? 'danger' : 'warning';

  const IconComp = isDanger ? AlertCircle : AlertTriangle;
  const iconColor = isDanger ? 'var(--coral-strong)' : 'var(--amber-strong)';

  return (
    <div className={`advice-banner ${bannerType}`}>
      <div className="advice-icon-wrap">
        <IconComp size={28} color={iconColor} />
      </div>
      <div className="advice-body" style={{ width: '100%' }}>
        <div className="advice-title">
          {isDanger ? 'Cảnh báo nguy hiểm cho ớt con' : 'Khuyến nghị chăm sóc vườn ươm'}
        </div>
        <div className="advice-text">{advice.message}</div>
        
        {/* Hiển thị hành động gợi ý nếu có (Section 5.2) */}
        {advice.suggested_action && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: isDanger ? 'rgba(235, 87, 87, 0.08)' : 'rgba(242, 153, 74, 0.08)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: `3px solid ${iconColor}`,
            fontSize: '13px',
            color: 'var(--brand-navy)',
            lineHeight: 1.4
          }}>
            <strong style={{ color: iconColor }}>🛠️ Hành động đề xuất:</strong> {advice.suggested_action}
          </div>
        )}

        <div className="advice-meta" style={{ marginTop: '4px' }}>
          Mã quy tắc: <code>{advice.code || 'RULE_EVAL'}</code> · Phiên bản: {advice.version || '0.1'} · Xử lý bởi: Động cơ Nông học Backend (Duyệt: Agronomy MThuy)
        </div>
      </div>
    </div>
  );
}

