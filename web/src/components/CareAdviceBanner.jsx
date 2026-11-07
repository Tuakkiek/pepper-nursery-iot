import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Sprout } from 'lucide-react';

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

  // 2. Dữ liệu cũ (> 5 phút)
  if (isStale === true) {
    return (
      <div className="advice-banner warning">
        <div className="advice-icon-wrap">
          <AlertTriangle size={28} color="var(--amber-strong)" />
        </div>
        <div className="advice-body">
          <div className="advice-title">Tạm dừng nhận định (Dữ liệu cũ)</div>
          <div className="advice-text">
            Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc trạm mất liên lạc. Hệ thống tạm dừng đưa ra lời khuyên chăm sóc để tránh nhận định sai lệch theo cam kết an toàn G0 v0.1.
          </div>
          <div className="advice-meta">Quy tắc an toàn: Không tính toán lời khuyên trên dữ liệu cũ</div>
        </div>
      </div>
    );
  }

  // 3. Backend chưa có cảnh báo hoặc advice === null
  if (!advice) {
    return (
      <div className="advice-banner normal">
        <div className="advice-icon-wrap">
          <Sprout size={28} color="var(--brand-teal)" />
        </div>
        <div className="advice-body">
          <div className="advice-title">Hệ thống chăm sóc vườn ươm ớt con</div>
          <div className="advice-text">
            Các chỉ số môi trường vườn ươm hiện tại đang ở mức ổn định. Chưa có cảnh báo bất thường nào từ máy chủ.
          </div>
          <div className="advice-meta">Chỉ hiển thị kết quả quy tắc do backend tính sau khi MThuy duyệt (advice: null)</div>
        </div>
      </div>
    );
  }

  // 4. Có lời khuyên chăm sóc do Backend trả về
  const isDanger = advice.status === 'danger';
  const isWarning = advice.status === 'warning';
  const bannerType = isDanger ? 'danger' : isWarning ? 'warning' : 'normal';

  const IconComp = isDanger ? AlertCircle : isWarning ? AlertTriangle : CheckCircle;
  const iconColor = isDanger ? 'var(--coral-strong)' : isWarning ? 'var(--amber-strong)' : 'var(--brand-teal)';

  return (
    <div className={`advice-banner ${bannerType}`}>
      <div className="advice-icon-wrap">
        <IconComp size={28} color={iconColor} />
      </div>
      <div className="advice-body">
        <div className="advice-title">
          {isDanger ? 'Cảnh báo nguy hiểm cho ớt con' : isWarning ? 'Khuyến nghị chăm sóc vườn ươm' : 'Tình trạng tối ưu'}
        </div>
        <div className="advice-text">{advice.message}</div>
        <div className="advice-meta">
          Phiên bản quy tắc: {advice.version || '0.1'} · Xử lý bởi: Backend (Duyệt: Agronomy MThuy)
        </div>
      </div>
    </div>
  );
}

