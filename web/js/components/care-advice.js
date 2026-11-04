/**
 * CareAdvice Component
 * Hiển thị khuyến nghị chăm sóc vườn ươm ớt con tuân thủ nghiêm ngặt G0 v0.1:
 * - Frontend TUYỆT ĐỐI không tự tính quy tắc hoặc hardcode ngưỡng
 * - Chỉ hiển thị lời khuyên do Backend tính toán và trả về trong trường `advice`
 * - Khi dữ liệu rỗng, thiếu, lỗi hoặc cũ (>5 phút), hiển thị "Không đủ dữ liệu để đưa ra nhận định"
 */

export function renderCareAdvice(container, advice, reading, isStale) {
  if (!container) return;

  // Trường hợp dữ liệu không hợp lệ hoặc cũ
  if (!reading) {
    container.innerHTML = `
      <div class="advice-card info">
        <div class="advice-icon" aria-hidden="true">ℹ️</div>
        <div class="advice-content">
          <div class="advice-title">Trạng thái chăm sóc</div>
          <div class="advice-text">Chưa có dữ liệu số đo từ vườn ươm để đưa ra nhận định.</div>
          <div class="advice-meta">Quy tắc G0 v0.1 — Nguồn: Agronomy MThuy</div>
        </div>
      </div>
    `;
    return;
  }

  if (isStale === true) {
    container.innerHTML = `
      <div class="advice-card warning">
        <div class="advice-icon" aria-hidden="true">⚠️</div>
        <div class="advice-content">
          <div class="advice-title">Không đủ dữ liệu để đưa ra nhận định</div>
          <div class="advice-text">Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc mất liên lạc. Hệ thống tạm dừng đưa ra lời khuyên chăm sóc để tránh nhận định sai lệch.</div>
          <div class="advice-meta">Theo cam kết an toàn hồ sơ G0 v0.1</div>
        </div>
      </div>
    `;
    return;
  }

  // Trường hợp Backend chưa bật quy tắc (advice === null)
  if (!advice) {
    container.innerHTML = `
      <div class="advice-card info">
        <div class="advice-icon" aria-hidden="true">🌱</div>
        <div class="advice-content">
          <div class="advice-title">Hệ thống chăm sóc vườn ươm ớt con</div>
          <div class="advice-text">Số đo môi trường hiện tại đang được ghi nhận bình thường. Chưa có cảnh báo bất thường nào từ máy chủ.</div>
          <div class="advice-meta">Chỉ hiển thị kết quả quy tắc do backend tính sau khi MThuy duyệt (advice: null)</div>
        </div>
      </div>
    `;
    return;
  }

  // Trường hợp Backend trả về object advice { version, status, message }
  const isWarning = advice.status === 'warning' || advice.status === 'danger';
  const cardClass = isWarning ? 'warning' : 'normal';
  const icon = isWarning ? '🚨' : '✅';
  const title = isWarning ? 'Cảnh báo chăm sóc ớt con' : 'Khuyến nghị chăm sóc vườn ươm';

  container.innerHTML = `
    <div class="advice-card ${cardClass}">
      <div class="advice-icon" aria-hidden="true">${icon}</div>
      <div class="advice-content">
        <div class="advice-title">${title}</div>
        <div class="advice-text">${escapeHtml(advice.message)}</div>
        <div class="advice-meta">Phiên bản quy tắc: ${escapeHtml(advice.version || '0.1')} · Nơi xử lý: Backend theo phê duyệt MThuy</div>
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

