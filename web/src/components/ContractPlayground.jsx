import React from 'react';
import { Layers, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { G0_FIXTURES } from '../fixtures/g0-fixtures.js';

export default function ContractPlayground({ onSelectScenario, currentScenario }) {
  const testRules = [
    {
      id: 'normal',
      title: '1. Mẫu bình thường (latest-normal.json)',
      desc: 'Năm cảm biến hợp lệ, thời gian mới, is_stale: false, advice: null.',
      check: 'Hiển thị đủ 5 cảm biến, đơn vị °C, %, ppm, pH đầy đủ.'
    },
    {
      id: 'uncalibrated',
      title: '2. Chưa hiệu chuẩn (latest-uncalibrated.json)',
      desc: 'HD-38, TDS, pH có raw ADC nhưng giá trị quy đổi là null.',
      check: 'Hiển thị số ADC thô, TUYỆT ĐỐI không gắn đơn vị %, ppm, pH!'
    },
    {
      id: 'partial_error',
      title: '3. Lỗi một cảm biến (latest-partial-error.json)',
      desc: 'DHT22 và TDS bị lỗi (read_error), DS18B20 và pH vẫn hoạt động.',
      check: 'Cảm biến lỗi hiển thị "—" và badge Lỗi, không làm mất số đo cảm biến khác.'
    },
    {
      id: 'stale',
      title: '4. Dữ liệu cũ > 5 phút (latest-stale.json)',
      desc: 'Thời điểm đo quá 5 phút so với hiện tại, cờ is_stale: true.',
      check: 'Gắn nhãn ⚠️ Dữ liệu cũ, tạm dừng đưa ra lời khuyên chăm sóc.'
    },
    {
      id: 'empty',
      title: '5. Chưa có bản ghi (latest-empty.json)',
      desc: 'Trạm mới lắp đặt chưa gửi số đo nào, reading: null.',
      check: 'Hiển thị hộp trạng thái rỗng, không tự ý vẽ số 0 giả.'
    },
    {
      id: 'zero_valid',
      title: '6. Số đo hợp lệ bằng 0 (0 != null)',
      desc: 'Nhiệt độ 0.0 °C, Độ ẩm 0.0 % là các số đo hợp lệ.',
      check: 'Hiển thị số 0.0 bình thường, phân biệt hoàn toàn với null hoặc lỗi.'
    },
    {
      id: 'with_advice',
      title: '7. Có lời khuyên chăm sóc từ Backend',
      desc: 'Backend trả về cấu trúc advice { version, status, message }.',
      check: 'Hiển thị banner cảnh báo/khuyến nghị đúng câu chữ từ MThuy.'
    },
    {
      id: 'server_error',
      title: '8. Lỗi máy chủ (server-error.json)',
      desc: 'Mô phỏng máy chủ Backend bị sập hoặc trả mã lỗi HTTP 500.',
      check: 'Hiển thị alert cảnh báo lỗi kết nối kèm nút Thử lại.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="card" style={{ padding: 'var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Layers size={22} color="var(--brand-teal)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)' }}>
            Phòng Thử Nghiệm Đối Soát Hợp Đồng G0 v0.1 (Contract Sandbox)
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
          Phòng thử nghiệm cho phép nhóm phát triển và người dùng đối soát trực quan 8 kịch bản biên trong hợp đồng dữ liệu giữa Phần cứng ESP32, Backend và Web Dashboard mà không cần phụ thuộc vào môi trường thật.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {testRules.map((rule) => {
          const isCurrent = currentScenario === rule.id;
          return (
            <div 
              key={rule.id}
              className="card"
              style={{
                padding: 'var(--space-4)',
                background: 'var(--surface)',
                border: `2px solid ${isCurrent ? 'var(--brand-navy)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                boxShadow: isCurrent ? 'var(--shadow-md)' : 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {rule.title}
                  </h3>
                  {isCurrent && (
                    <span className="badge badge-normal" style={{ fontSize: '10px' }}>
                      ĐANG XEM
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {rule.desc}
                </p>
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: 'var(--teal-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--brand-navy)',
                  fontWeight: 500
                }}>
                  <strong>Quy tắc hợp đồng:</strong> {rule.check}
                </div>
              </div>

              <button 
                type="button"
                className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', marginTop: '6px' }}
                onClick={() => onSelectScenario(rule.id)}
              >
                <Play size={12} />
                <span>{isCurrent ? 'Đang kích hoạt trên Dashboard' : 'Kích hoạt thử kịch bản này'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

