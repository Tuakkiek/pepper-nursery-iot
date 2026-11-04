/**
 * HistoryView Component
 * Hiển thị biểu đồ SVG trực quan và bảng dữ liệu lịch sử số đo.
 * Tuân thủ nghiêm ngặt Design_System_Web_Mobile.md:
 * - Nhiệt độ °C và độ ẩm % KHÔNG đặt chung một trục giá trị (chia 2 panel riêng)
 * - Mẫu thiếu/lỗi để khoảng trống, KHÔNG nối đường qua điểm null
 * - Đường nhiệt độ màu Navy, đường độ ẩm màu Teal
 */

export function renderHistoryView(container, historyData, activeTab = 'climate') {
  if (!container) return;

  const readings = (historyData && historyData.readings) ? historyData.readings : [];

  if (readings.length === 0) {
    container.innerHTML = `
      <div class="state-box">
        <div class="state-box-icon">📊</div>
        <div class="state-box-title">Chưa có dữ liệu lịch sử</div>
        <p class="state-box-desc">Chưa có chuỗi số đo nào được lưu trữ cho thiết bị này.</p>
      </div>
    `;
    return;
  }

  // Sắp xếp các mẫu theo thời gian tăng dần từ trái sang phải trên trục X
  const sorted = [...readings].reverse();

  container.innerHTML = `
    <div class="history-toolbar">
      <div class="tabs-group" role="tablist">
        <button class="tab-btn ${activeTab === 'climate' ? 'active' : ''}" data-tab="climate">
          🌤️ Vi khí hậu (Không khí)
        </button>
        <button class="tab-btn ${activeTab === 'soil' ? 'active' : ''}" data-tab="soil">
          🌱 Môi trường đất & Nước
        </button>
        <button class="tab-btn ${activeTab === 'table' ? 'active' : ''}" data-tab="table">
          📋 Bảng số đo gần đây
        </button>
      </div>
      <div style="font-size: 13px; color: var(--color-text-secondary);">
        Hiển thị <strong>${readings.length}</strong> lần lấy mẫu gần nhất
      </div>
    </div>

    <div id="history-content-area"></div>
  `;

  // Gắn sự kiện chuyển tab
  const tabBtns = container.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTabContent(container.querySelector('#history-content-area'), btn.dataset.tab, sorted);
    });
  });

  // Render tab hiện tại
  renderTabContent(container.querySelector('#history-content-area'), activeTab, sorted);
}

function renderTabContent(contentArea, tab, sortedReadings) {
  if (!contentArea) return;

  if (tab === 'table') {
    contentArea.innerHTML = renderHistoryTable(sortedReadings);
  } else if (tab === 'soil') {
    contentArea.innerHTML = renderDualAxisSvgChart(sortedReadings, {
      title1: 'Nhiệt độ đất (°C - DS18B20)',
      field1: 'soil_temperature_c',
      unit1: '°C',
      color1: '#002C3E', // Navy
      title2: 'Độ ẩm đất (% - HD-38 sau hiệu chuẩn)',
      field2: 'soil_moisture_pct',
      unit2: '%',
      color2: '#78BCC4'  // Teal
    });
  } else {
    // climate tab
    contentArea.innerHTML = renderDualAxisSvgChart(sortedReadings, {
      title1: 'Nhiệt độ không khí (°C - DHT22)',
      field1: 'air_temperature_c',
      unit1: '°C',
      color1: '#002C3E', // Navy
      title2: 'Độ ẩm không khí (% - DHT22)',
      field2: 'air_humidity_pct',
      unit2: '%',
      color2: '#78BCC4'  // Teal
    });
  }
}

/**
 * Vẽ biểu đồ SVG kép (Stacked 2 Panels) để tách biệt hoàn toàn trục °C và %
 * Không nối đường qua điểm có giá trị null
 */
function renderDualAxisSvgChart(samples, opts) {
  const width = 1100;
  const height = 320;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;
  const gapBetweenPanels = 30;

  const panelHeight = (height - padTop - padBottom - gapBetweenPanels) / 2;
  const panel1Top = padTop;
  const panel2Top = padTop + panelHeight + gapBetweenPanels;
  const plotWidth = width - padLeft - padRight;

  const n = samples.length;
  if (n < 1) return '<p>Không đủ điểm dữ liệu để vẽ biểu đồ.</p>';

  const getX = (index) => {
    if (n === 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (n - 1)) * plotWidth;
  };

  // Helper tìm min/max cho panel
  const getMinMax = (field) => {
    let min = Infinity, max = -Infinity;
    samples.forEach(s => {
      const v = s.reading ? s.reading[field] : null;
      if (typeof v === 'number' && !isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });
    if (min === Infinity) return { min: 0, max: 100 };
    if (min === max) { min -= 5; max += 5; }
    const padding = (max - min) * 0.15 || 2;
    return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
  };

  const range1 = getMinMax(opts.field1);
  const range2 = getMinMax(opts.field2);

  const getY1 = (val) => {
    return panel1Top + panelHeight - ((val - range1.min) / (range1.max - range1.min)) * panelHeight;
  };

  const getY2 = (val) => {
    return panel2Top + panelHeight - ((val - range2.min) / (range2.max - range2.min)) * panelHeight;
  };

  // Xây dựng đường line SVG không nối qua null
  const buildSvgPaths = (field, getY) => {
    let paths = [];
    let currentSegment = [];
    let points = [];

    samples.forEach((s, idx) => {
      const val = s.reading ? s.reading[field] : null;
      const x = getX(idx);
      if (typeof val === 'number' && !isNaN(val)) {
        const y = getY(val);
        currentSegment.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        points.push({ x, y, val, time: s.received_at });
      } else {
        if (currentSegment.length > 0) {
          paths.push(`M ${currentSegment.join(' L ')}`);
          currentSegment = [];
        }
      }
    });

    if (currentSegment.length > 0) {
      paths.push(`M ${currentSegment.join(' L ')}`);
    }

    return { pathStr: paths.join(' '), points };
  };

  const p1 = buildSvgPaths(opts.field1, getY1);
  const p2 = buildSvgPaths(opts.field2, getY2);

  // Nhãn thời gian trục X
  const timeLabels = samples.map((s, idx) => {
    const x = getX(idx);
    let timeStr = '—';
    if (s.received_at) {
      const d = new Date(s.received_at);
      timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return `<text x="${x}" y="${height - 10}" text-anchor="middle" class="chart-axis-text">${timeStr}</text>`;
  }).join('');

  return `
    <div class="chart-container" style="height: ${height}px;">
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <!-- Panel 1 Background & Grid (Nhiệt độ) -->
        <rect x="${padLeft}" y="${panel1Top}" width="${plotWidth}" height="${panelHeight}" fill="#FFFFFF" stroke="#D5E1E0" rx="8" />
        <line x1="${padLeft}" y1="${panel1Top + panelHeight / 2}" x2="${width - padRight}" y2="${panel1Top + panelHeight / 2}" class="chart-grid-line" />
        <text x="${padLeft - 10}" y="${panel1Top + 14}" text-anchor="end" class="chart-axis-text" font-weight="bold">${range1.max} ${opts.unit1}</text>
        <text x="${padLeft - 10}" y="${panel1Top + panelHeight}" text-anchor="end" class="chart-axis-text" font-weight="bold">${range1.min} ${opts.unit1}</text>
        <text x="${padLeft + 12}" y="${panel1Top + 20}" font-size="12" font-weight="bold" fill="${opts.color1}">${escapeHtml(opts.title1)}</text>

        <!-- Panel 1 Path & Points -->
        <path d="${p1.pathStr}" stroke="${opts.color1}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        ${p1.points.map(pt => `
          <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${opts.color1}" stroke="#FFFFFF" stroke-width="1.5">
            <title>${pt.val.toFixed(1)} ${opts.unit1}</title>
          </circle>
        `).join('')}

        <!-- Panel 2 Background & Grid (Độ ẩm) -->
        <rect x="${padLeft}" y="${panel2Top}" width="${plotWidth}" height="${panelHeight}" fill="#FFFFFF" stroke="#D5E1E0" rx="8" />
        <line x1="${padLeft}" y1="${panel2Top + panelHeight / 2}" x2="${width - padRight}" y2="${panel2Top + panelHeight / 2}" class="chart-grid-line" />
        <text x="${padLeft - 10}" y="${panel2Top + 14}" text-anchor="end" class="chart-axis-text" font-weight="bold">${range2.max} ${opts.unit2}</text>
        <text x="${padLeft - 10}" y="${panel2Top + panelHeight}" text-anchor="end" class="chart-axis-text" font-weight="bold">${range2.min} ${opts.unit2}</text>
        <text x="${padLeft + 12}" y="${panel2Top + 20}" font-size="12" font-weight="bold" fill="${opts.color2}">${escapeHtml(opts.title2)}</text>

        <!-- Panel 2 Path & Points -->
        <path d="${p2.pathStr}" stroke="${opts.color2}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        ${p2.points.map(pt => `
          <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${opts.color2}" stroke="#FFFFFF" stroke-width="1.5">
            <title>${pt.val.toFixed(1)} ${opts.unit2}</title>
          </circle>
        `).join('')}

        <!-- Trục X thời gian -->
        ${timeLabels}
      </svg>
    </div>

    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-color-dot" style="background-color: ${opts.color1};"></span>
        <span>${escapeHtml(opts.title1)}</span>
      </div>
      <div class="legend-item">
        <span class="legend-color-dot" style="background-color: ${opts.color2};"></span>
        <span>${escapeHtml(opts.title2)}</span>
      </div>
      <div class="legend-item">
        <span style="border-bottom: 2px dashed #999; width: 16px; display: inline-block;"></span>
        <span>Khoảng ngắt đoạn: Cảm biến lỗi/Chưa hiệu chuẩn</span>
      </div>
    </div>
  `;
}

function renderHistoryTable(samples) {
  const reversed = [...samples].reverse(); // hiển thị mới nhất lên trước
  return `
    <div class="table-responsive">
      <table class="history-table">
        <thead>
          <tr>
            <th>Mã mẫu</th>
            <th>Thời điểm nhận (GMT+7)</th>
            <th>Nhiệt độ KK</th>
            <th>Độ ẩm KK</th>
            <th>Nhiệt độ đất</th>
            <th>Độ ẩm đất</th>
            <th>TDS nước</th>
            <th>pH nước</th>
            <th>Trạng thái cảm biến</th>
          </tr>
        </thead>
        <tbody>
          ${reversed.map(s => {
            const r = s.reading || {};
            const st = r.sensor_status || {};
            const timeStr = s.received_at ? new Date(s.received_at).toLocaleTimeString('vi-VN') : '—';
            
            const formatVal = (v, unit) => {
              if (v === null || v === undefined) return '<span style="color: var(--color-coral-strong);">—</span>';
              return `<span class="tabular-nums">${v}</span> ${unit}`;
            };

            const soilMoist = r.soil_moisture_pct !== null ? `${r.soil_moisture_pct} %` : (r.soil_moisture_raw ? `${r.soil_moisture_raw} (raw)` : '—');
            const tdsVal = r.water_tds_ppm !== null ? `${r.water_tds_ppm} ppm` : (r.water_tds_adc_raw ? `${r.water_tds_adc_raw} (raw)` : '—');
            const phVal = r.water_ph !== null ? `${r.water_ph} pH` : (r.water_ph_adc_raw ? `${r.water_ph_adc_raw} (raw)` : '—');

            return `
              <tr>
                <td><code>${escapeHtml(r.sample_id || '—')}</code></td>
                <td>${timeStr}</td>
                <td>${formatVal(r.air_temperature_c, '°C')}</td>
                <td>${formatVal(r.air_humidity_pct, '%')}</td>
                <td>${formatVal(r.soil_temperature_c, '°C')}</td>
                <td>${soilMoist}</td>
                <td>${tdsVal}</td>
                <td>${phVal}</td>
                <td>
                  <span style="font-size: 11px;">
                    DHT:${st.dht22 || '—'} | DS:${st.ds18b20 || '—'} | HD:${st.hd38 || '—'} | TDS:${st.tds || '—'} | pH:${st.ph4502c || '—'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
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

