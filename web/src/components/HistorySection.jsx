import React, { useState } from 'react';
import { LineChart, Table, CloudSun, Sprout } from 'lucide-react';

export default function HistorySection({ historyData }) {
  const [activeTab, setActiveTab] = useState('climate'); // 'climate' | 'soil' | 'table'
  const readings = historyData?.readings || [];

  if (readings.length === 0) {
    return (
      <div className="history-card">
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>
          <LineChart size={32} style={{ margin: '0 auto 8px' }} />
          <p>Chưa có chuỗi số đo lịch sử cho trạm này.</p>
        </div>
      </div>
    );
  }

  // Reverse so chronological order from left to right on X axis
  const sorted = [...readings].reverse();

  return (
    <section className="history-card" aria-label="Lịch sử và xu hướng">
      <div className="history-tabs-header">
        <div className="history-tab-buttons">
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'climate' ? 'active' : ''}`}
            onClick={() => setActiveTab('climate')}
          >
            <CloudSun size={15} />
            <span>Vi khí hậu (Không khí)</span>
          </button>
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'soil' ? 'active' : ''}`}
            onClick={() => setActiveTab('soil')}
          >
            <Sprout size={15} />
            <span>Đất & Dung dịch nước</span>
          </button>
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <Table size={15} />
            <span>Bảng số đo chi tiết</span>
          </button>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Hiển thị <strong>{readings.length}</strong> lần lấy mẫu gần nhất
        </div>
      </div>

      <div className="history-content-area">
        {activeTab === 'climate' && (
          <DualPanelSvgChart 
            samples={sorted}
            panel1={{
              title: 'Nhiệt độ không khí (°C - DHT22)',
              field: 'air_temperature_c',
              unit: '°C',
              color: '#002C3E' // Navy
            }}
            panel2={{
              title: 'Độ ẩm không khí (% - DHT22)',
              field: 'air_humidity_pct',
              unit: '%',
              color: '#78BCC4' // Teal
            }}
          />
        )}

        {activeTab === 'soil' && (
          <DualPanelSvgChart 
            samples={sorted}
            panel1={{
              title: 'Nhiệt độ đất (°C - DS18B20 vùng rễ)',
              field: 'soil_temperature_c',
              unit: '°C',
              color: '#002C3E'
            }}
            panel2={{
              title: 'Độ ẩm đất (% - HD-38 sau hiệu chuẩn)',
              field: 'soil_moisture_pct',
              unit: '%',
              color: '#78BCC4'
            }}
          />
        )}

        {activeTab === 'table' && (
          <HistoryTable samples={readings} />
        )}
      </div>
    </section>
  );
}

/**
 * Biểu đồ SVG 2 Panels xếp chồng để tách biệt hoàn toàn trục °C và %
 * Không nối đường qua điểm null
 */
function DualPanelSvgChart({ samples, panel1, panel2 }) {
  const width = 1000;
  const panelHeight = 160;
  const totalHeight = 360;
  const margin = { top: 30, right: 30, bottom: 35, left: 60 };

  const usableWidth = width - margin.left - margin.right;
  const usableHeight = panelHeight - 20;

  // Format Time Helper
  const formatTimeLabel = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  // Helper tính Y min/max cho từng panel
  const getMinMax = (field) => {
    const valid = samples
      .map(s => s.reading ? s.reading[field] : null)
      .filter(v => v !== null && v !== undefined && typeof v === 'number');

    if (valid.length === 0) return { min: 0, max: 100 };
    let min = Math.min(...valid);
    let max = Math.max(...valid);
    if (min === max) {
      min -= 2;
      max += 2;
    }
    const pad = (max - min) * 0.15;
    return { min: Math.floor(min - pad), max: Math.ceil(max + pad) };
  };

  const range1 = getMinMax(panel1.field);
  const range2 = getMinMax(panel2.field);

  // Helper chuyển đổi tọa độ
  const getX = (idx) => {
    if (samples.length <= 1) return margin.left + usableWidth / 2;
    return margin.left + (idx / (samples.length - 1)) * usableWidth;
  };

  const getY = (val, range, topOffset) => {
    if (val === null || val === undefined) return null;
    const ratio = (val - range.min) / (range.max - range.min);
    return topOffset + panelHeight - 20 - ratio * usableHeight;
  };

  // Tạo Path segments (ngắt quãng khi gặp null)
  const generatePaths = (field, range, topOffset) => {
    const segments = [];
    let currentSeg = [];

    samples.forEach((s, idx) => {
      const val = s.reading ? s.reading[field] : null;
      if (val !== null && val !== undefined) {
        currentSeg.push({ x: getX(idx), y: getY(val, range, topOffset), val, time: s.reading?.recorded_at || s.received_at });
      } else {
        if (currentSeg.length > 0) {
          segments.push(currentSeg);
          currentSeg = [];
        }
      }
    });
    if (currentSeg.length > 0) segments.push(currentSeg);

    return segments;
  };

  const segs1 = generatePaths(panel1.field, range1, margin.top);
  const segs2 = generatePaths(panel2.field, range2, margin.top + panelHeight + 20);

  return (
    <div className="chart-container-svg">
      <svg viewBox={`0 0 ${width} ${totalHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Background */}
        <rect width={width} height={totalHeight} fill="#FFFFFF" rx="8" />

        {/* Panel 1: Nhiệt độ */}
        <g>
          {/* Panel 1 Title & Legend */}
          <text x={margin.left} y={margin.top - 10} fill="var(--brand-navy)" fontSize="13" fontWeight="700">
            {panel1.title}
          </text>
          <line x1={margin.left} y1={margin.top + panelHeight - 15} x2={width - margin.right} y2={margin.top + panelHeight - 15} stroke="#E5EEED" strokeWidth="1" />
          <line x1={margin.left} y1={margin.top + 5} x2={width - margin.right} y2={margin.top + 5} stroke="#F1F4EE" strokeDasharray="3 3" />

          {/* Y Axis Labels */}
          <text x={margin.left - 10} y={margin.top + 10} fill="var(--text-secondary)" fontSize="11" textAnchor="end" fontFamily="monospace">
            {range1.max} {panel1.unit}
          </text>
          <text x={margin.left - 10} y={margin.top + panelHeight - 15} fill="var(--text-secondary)" fontSize="11" textAnchor="end" fontFamily="monospace">
            {range1.min} {panel1.unit}
          </text>

          {/* Lines & Points */}
          {segs1.map((seg, sIdx) => {
            const d = seg.map((p, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            return (
              <g key={`p1-seg-${sIdx}`}>
                <path d={d} fill="none" stroke={panel1.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {seg.map((p, pIdx) => (
                  <circle key={`p1-dot-${pIdx}`} cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke={panel1.color} strokeWidth="2">
                    <title>{`${p.val} ${panel1.unit} (${formatTimeLabel(p.time)})`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </g>

        {/* Panel 2: Độ ẩm */}
        <g>
          {/* Panel 2 Title & Legend */}
          <text x={margin.left} y={margin.top + panelHeight + 10} fill="var(--brand-navy)" fontSize="13" fontWeight="700">
            {panel2.title}
          </text>
          <line x1={margin.left} y1={margin.top + panelHeight * 2 + 5} x2={width - margin.right} y2={margin.top + panelHeight * 2 + 5} stroke="#E5EEED" strokeWidth="1" />
          <line x1={margin.left} y1={margin.top + panelHeight + 25} x2={width - margin.right} y2={margin.top + panelHeight + 25} stroke="#F1F4EE" strokeDasharray="3 3" />

          {/* Y Axis Labels */}
          <text x={margin.left - 10} y={margin.top + panelHeight + 30} fill="var(--text-secondary)" fontSize="11" textAnchor="end" fontFamily="monospace">
            {range2.max} {panel2.unit}
          </text>
          <text x={margin.left - 10} y={margin.top + panelHeight * 2 + 5} fill="var(--text-secondary)" fontSize="11" textAnchor="end" fontFamily="monospace">
            {range2.min} {panel2.unit}
          </text>

          {/* Lines & Points */}
          {segs2.map((seg, sIdx) => {
            const d = seg.map((p, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            return (
              <g key={`p2-seg-${sIdx}`}>
                <path d={d} fill="none" stroke={panel2.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {seg.map((p, pIdx) => (
                  <circle key={`p2-dot-${pIdx}`} cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke={panel2.color} strokeWidth="2">
                    <title>{`${p.val} ${panel2.unit} (${formatTimeLabel(p.time)})`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </g>

        {/* X Axis Time Labels */}
        {samples.map((s, idx) => {
          if (idx % Math.ceil(samples.length / 6) !== 0 && idx !== samples.length - 1) return null;
          const x = getX(idx);
          const time = s.reading?.recorded_at || s.received_at;
          return (
            <text key={`x-lbl-${idx}`} x={x} y={totalHeight - 8} fill="var(--text-secondary)" fontSize="11" textAnchor="middle" fontFamily="monospace">
              {formatTimeLabel(time)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function HistoryTable({ samples }) {
  const formatTime = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  const renderVal = (val, unit) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
    return <span>{val} {unit}</span>;
  };

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Mã mẫu</th>
            <th>Nhiệt KK (°C)</th>
            <th>Độ ẩm KK (%)</th>
            <th>Nhiệt Đất (°C)</th>
            <th>Độ ẩm Đất (%)</th>
            <th>TDS Nước (ppm)</th>
            <th>pH Nước</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((s, idx) => {
            const r = s.reading;
            if (!r) return null;
            return (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace' }}>{formatTime(r.recorded_at || s.received_at)}</td>
                <td><code>{r.sample_id}</code></td>
                <td>{renderVal(r.air_temperature_c, '°C')}</td>
                <td>{renderVal(r.air_humidity_pct, '%')}</td>
                <td>{renderVal(r.soil_temperature_c, '°C')}</td>
                <td>
                  {r.soil_moisture_pct !== null 
                    ? renderVal(r.soil_moisture_pct, '%')
                    : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Raw {r.soil_moisture_raw}</span>
                  }
                </td>
                <td>
                  {r.water_tds_ppm !== null
                    ? renderVal(r.water_tds_ppm, 'ppm')
                    : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Raw {r.water_tds_adc_raw || '—'}</span>
                  }
                </td>
                <td>
                  {r.water_ph !== null
                    ? renderVal(r.water_ph, 'pH')
                    : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Raw {r.water_ph_adc_raw || '—'}</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

