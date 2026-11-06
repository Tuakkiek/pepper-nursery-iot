/**
 * Pepper Nursery IoT - Admin Dashboard Logic
 * Quản trị Quy tắc Chăm sóc Cây ớt (Care Rules) & Trạng thái Hệ thống
 * Tuân thủ docs/contracts/api.md và backend/README.md
 * Hoàn toàn không sửa backend - Chỉ tiêu thụ REST API v1
 */

import { authService } from './auth.js';
import { APP_CONFIG, loadRuntimeConfig } from './config.js';

// Danh mục thông số và nhãn hiển thị tiếng Việt
export const PARAMETER_METADATA = {
  air_temperature_c: { label: 'Nhiệt độ không khí', unit: '°C', icon: '🌡️' },
  air_humidity_pct: { label: 'Độ ẩm không khí', unit: '%', icon: '💧' },
  soil_temperature_c: { label: 'Nhiệt độ đất/giá thể', unit: '°C', icon: '🌱' },
  soil_moisture_pct: { label: 'Độ ẩm đất/giá thể', unit: '%', icon: '🪴' },
  water_ph: { label: 'Độ pH nước tưới', unit: 'pH', icon: '🧪' },
  water_tds_ppm: { label: 'Độ dẫn TDS dinh dưỡng', unit: 'ppm', icon: '⚡' }
};

// Dữ liệu rules mock fallback phục vụ khi backend chưa khởi động
const MOCK_RULES = [
  {
    id: 1,
    rule_code: 'RULE_TEMP_HIGH',
    name: 'Nhiệt độ không khí quá cao',
    description: 'Nhiệt độ vượt ngưỡng an toàn cho cây ớt con',
    parameter: 'air_temperature_c',
    operator: '>',
    threshold_min: null,
    threshold_max: 35.0,
    severity: 'danger',
    action_advice: 'Nhiệt độ không khí vượt 35°C, bật lưới đen che nắng và kích hoạt phun sương làm mát.',
    is_active: 1
  },
  {
    id: 2,
    rule_code: 'RULE_TEMP_LOW',
    name: 'Nhiệt độ không khí thấp',
    description: 'Thời tiết lạnh làm chậm sinh trưởng cây con',
    parameter: 'air_temperature_c',
    operator: '<',
    threshold_min: 18.0,
    threshold_max: null,
    severity: 'warning',
    action_advice: 'Nhiệt độ không khí dưới 18°C, hạ màng phủ kín tránh rét cho cây ớt con.',
    is_active: 1
  },
  {
    id: 3,
    rule_code: 'RULE_HUM_HIGH',
    name: 'Độ ẩm không khí quá cao',
    description: 'Nguy cơ bùng phát nấm bệnh lở cổ rễ',
    parameter: 'air_humidity_pct',
    operator: '>',
    threshold_min: null,
    threshold_max: 85.0,
    severity: 'warning',
    action_advice: 'Độ ẩm không khí > 85%, tăng cường quạt thông gió để phòng ngừa nấm bệnh lở cổ rễ.',
    is_active: 1
  },
  {
    id: 4,
    rule_code: 'RULE_SOIL_DRY',
    name: 'Giá thể khô hạn thiếu nước',
    description: 'Độ ẩm đất thấp, rễ non không lấy được nước',
    parameter: 'soil_moisture_pct',
    operator: '<',
    threshold_min: 45.0,
    threshold_max: null,
    severity: 'danger',
    action_advice: 'Độ ẩm giá thể dưới 45%, kích hoạt hệ thống tưới nhỏ giọt bổ sung nước.',
    is_active: 1
  },
  {
    id: 5,
    rule_code: 'RULE_SOIL_WET',
    name: 'Giá thể quá ẩm thừa nước',
    description: 'Nguy cơ nghẹt rễ và thối rễ non',
    parameter: 'soil_moisture_pct',
    operator: '>',
    threshold_min: null,
    threshold_max: 80.0,
    severity: 'warning',
    action_advice: 'Độ ẩm giá thể vượt 80%, tạm ngưng tưới và khơi thông thoát nước tránh thối rễ.',
    is_active: 1
  },
  {
    id: 6,
    rule_code: 'RULE_PH_ACID',
    name: 'Nước tưới quá chua (Axit)',
    description: 'pH thấp gây độc rễ và khó hấp thu lân',
    parameter: 'water_ph',
    operator: '<',
    threshold_min: 5.5,
    threshold_max: null,
    severity: 'danger',
    action_advice: 'pH nước tưới dưới 5.5 (quá chua), cần dùng dung dịch nâng pH trước khi tưới.',
    is_active: 1
  },
  {
    id: 7,
    rule_code: 'RULE_TDS_HIGH',
    name: 'Dinh dưỡng nước tưới quá đặc',
    description: 'TDS cao gây cháy rễ và xót cây con',
    parameter: 'water_tds_ppm',
    operator: '>',
    threshold_min: null,
    threshold_max: 800.0,
    severity: 'danger',
    action_advice: 'Chỉ số TDS > 800 ppm, dinh dưỡng quá đặc có thể gây cháy rễ non, cần pha loãng thêm nước.',
    is_active: 1
  }
];

class AdminApp {
  constructor() {
    this.rules = [];
    this.filteredRules = [];
    this.editingRuleId = null;
    this.deletingRuleId = null;
    this.isUsingMock = false;

    // DOM Elements Cache
    this.el = {
      adminUserName: document.getElementById('admin-user-name'),
      adminUserRole: document.getElementById('admin-user-role'),
      btnLogout: document.getElementById('btn-logout'),
      statTotalRules: document.getElementById('stat-total-rules'),
      statActiveRules: document.getElementById('stat-active-rules'),
      statSyncStatus: document.getElementById('stat-sync-status'),
      statLastPolled: document.getElementById('stat-last-polled'),
      searchInput: document.getElementById('search-rule-input'),
      filterParam: document.getElementById('filter-param-select'),
      filterSeverity: document.getElementById('filter-severity-select'),
      filterStatus: document.getElementById('filter-status-select'),
      rulesTableBody: document.getElementById('rules-table-body'),
      rulesLoading: document.getElementById('rules-loading'),
      rulesEmpty: document.getElementById('rules-empty'),
      btnOpenAddModal: document.getElementById('btn-open-add-modal'),
      btnReloadRules: document.getElementById('btn-reload-rules'),
      btnSyncThingSpeak: document.getElementById('btn-admin-sync-thingspeak'),
      
      // Rule Form Modal
      ruleModal: document.getElementById('rule-modal'),
      ruleModalTitle: document.getElementById('rule-modal-title'),
      ruleForm: document.getElementById('rule-form'),
      btnCancelRuleModal: document.getElementById('btn-cancel-rule-modal'),
      btnCloseRuleModal: document.getElementById('btn-close-rule-modal'),
      btnSubmitRule: document.getElementById('btn-submit-rule'),
      ruleCodeInput: document.getElementById('input-rule-code'),
      ruleNameInput: document.getElementById('input-rule-name'),
      ruleDescInput: document.getElementById('input-rule-desc'),
      ruleParamSelect: document.getElementById('select-rule-param'),
      ruleOperatorSelect: document.getElementById('select-rule-operator'),
      ruleMinInput: document.getElementById('input-rule-min'),
      ruleMaxInput: document.getElementById('input-rule-max'),
      ruleSeveritySelect: document.getElementById('select-rule-severity'),
      ruleAdviceInput: document.getElementById('input-rule-advice'),
      ruleActiveCheck: document.getElementById('check-rule-active'),
      thresholdUnitSpan: document.getElementById('threshold-unit-span'),

      // Delete Confirm Modal
      deleteModal: document.getElementById('delete-modal'),
      deleteRuleName: document.getElementById('delete-rule-name'),
      btnConfirmDelete: document.getElementById('btn-confirm-delete'),
      btnCancelDelete: document.getElementById('btn-cancel-delete'),
      btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),

      // Toast Notification
      adminToast: document.getElementById('admin-toast'),
      toastMessage: document.getElementById('toast-message'),
      toastIcon: document.getElementById('toast-icon')
    };

    this.init();
  }

  async init() {
    await loadRuntimeConfig();

    // 1. Kiểm tra xác thực và quyền Admin
    const user = authService.getUser();
    if (!authService.isAuthenticated() || !user) {
      window.location.href = 'login.html?redirect=admin.html';
      return;
    }

    if (user.role !== 'admin') {
      alert(`Tài khoản '${user.username}' không có quyền Quản trị viên (Role hiện tại: ${user.role}). Bạn sẽ được chuyển về Dashboard công cộng.`);
      window.location.href = 'index.html';
      return;
    }

    // Hiển thị thông tin Admin
    if (this.el.adminUserName) this.el.adminUserName.textContent = user.full_name || user.username;
    if (this.el.adminUserRole) this.el.adminUserRole.textContent = 'Quản trị viên (admin)';

    // 2. Gán sự kiện
    this.bindEvents();

    // 3. Tải dữ liệu ban đầu
    await Promise.all([
      this.loadRules(),
      this.loadThingSpeakStatus()
    ]);
  }

  bindEvents() {
    // Đăng xuất
    if (this.el.btnLogout) {
      this.el.btnLogout.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?')) {
          authService.logout();
          window.location.href = 'login.html';
        }
      });
    }

    // Tìm kiếm & Lọc
    if (this.el.searchInput) {
      this.el.searchInput.addEventListener('input', () => this.applyFilters());
    }
    if (this.el.filterParam) {
      this.el.filterParam.addEventListener('change', () => this.applyFilters());
    }
    if (this.el.filterSeverity) {
      this.el.filterSeverity.addEventListener('change', () => this.applyFilters());
    }
    if (this.el.filterStatus) {
      this.el.filterStatus.addEventListener('change', () => this.applyFilters());
    }

    // Nút tải lại danh sách
    if (this.el.btnReloadRules) {
      this.el.btnReloadRules.addEventListener('click', () => this.loadRules());
    }

    // Nút mở modal thêm mới
    if (this.el.btnOpenAddModal) {
      this.el.btnOpenAddModal.addEventListener('click', () => this.openAddModal());
    }

    // Modal Rule actions
    if (this.el.btnCancelRuleModal) {
      this.el.btnCancelRuleModal.addEventListener('click', () => this.closeRuleModal());
    }
    if (this.el.btnCloseRuleModal) {
      this.el.btnCloseRuleModal.addEventListener('click', () => this.closeRuleModal());
    }
    if (this.el.ruleForm) {
      this.el.ruleForm.addEventListener('submit', (e) => this.handleRuleSubmit(e));
    }

    // Khi đổi thông số đo trong modal, đổi đơn vị hiển thị
    if (this.el.ruleParamSelect) {
      this.el.ruleParamSelect.addEventListener('change', (e) => {
        const meta = PARAMETER_METADATA[e.target.value];
        if (this.el.thresholdUnitSpan) {
          this.el.thresholdUnitSpan.textContent = meta ? `(${meta.unit})` : '';
        }
      });
    }

    // Khi đổi operator, điều chỉnh hiển thị các ô ngưỡng
    if (this.el.ruleOperatorSelect) {
      this.el.ruleOperatorSelect.addEventListener('change', (e) => {
        this.updateThresholdInputsState(e.target.value);
      });
    }

    // Delete Modal actions
    if (this.el.btnCancelDelete) {
      this.el.btnCancelDelete.addEventListener('click', () => this.closeDeleteModal());
    }
    if (this.el.btnCloseDeleteModal) {
      this.el.btnCloseDeleteModal.addEventListener('click', () => this.closeDeleteModal());
    }
    if (this.el.btnConfirmDelete) {
      this.el.btnConfirmDelete.addEventListener('click', () => this.handleDeleteConfirm());
    }

    // Đồng bộ ThingSpeak
    if (this.el.btnSyncThingSpeak) {
      this.el.btnSyncThingSpeak.addEventListener('click', () => this.triggerThingSpeakSync());
    }
  }

  showToast(message, isError = false) {
    if (!this.el.adminToast) return;
    this.el.adminToast.className = isError ? 'admin-toast error' : 'admin-toast success';
    if (this.el.toastIcon) this.el.toastIcon.textContent = isError ? '❌' : '✅';
    if (this.el.toastMessage) this.el.toastMessage.textContent = message;
    this.el.adminToast.style.display = 'flex';

    setTimeout(() => {
      this.el.adminToast.style.display = 'none';
    }, 4000);
  }

  // --- API CALLS ---

  getBaseUrl() {
    return (APP_CONFIG.apiBaseUrl || 'http://localhost:8000').replace(/\/+$/, '');
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${authService.getToken()}`
    };
  }

  /**
   * Tải danh sách quy tắc: GET /api/v1/rules?all=true
   */
  async loadRules() {
    if (this.el.rulesLoading) this.el.rulesLoading.style.display = 'table-row';
    if (this.el.rulesEmpty) this.el.rulesEmpty.style.display = 'none';

    try {
      const endpoint = `${this.getBaseUrl()}/api/v1/rules?all=true`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi ${response.status}`);
      }

      const data = await response.json();
      this.rules = data.rules || [];
      this.isUsingMock = false;
    } catch (err) {
      console.warn('Không thể tải rules từ backend thật, chuyển sang dữ liệu mẫu:', err.message);
      this.rules = [...MOCK_RULES];
      this.isUsingMock = true;
      this.showToast('Backend chưa online — Đang hiển thị danh sách quy tắc mẫu', false);
    } finally {
      if (this.el.rulesLoading) this.el.rulesLoading.style.display = 'none';
      this.updateStats();
      this.applyFilters();
    }
  }

  /**
   * Cập nhật thông tin KPI cards
   */
  updateStats() {
    const total = this.rules.length;
    const active = this.rules.filter(r => r.is_active).length;

    if (this.el.statTotalRules) this.el.statTotalRules.textContent = total;
    if (this.el.statActiveRules) this.el.statActiveRules.textContent = active;
  }

  /**
   * Tải trạng thái ThingSpeak worker: GET /api/v1/sync/thingspeak/status
   */
  async loadThingSpeakStatus() {
    try {
      const endpoint = `${this.getBaseUrl()}/api/v1/sync/thingspeak/status`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data || {};
        if (this.el.statSyncStatus) {
          this.el.statSyncStatus.textContent = data.enabled ? 'Đang kết nối' : 'Đã tắt';
        }
        if (this.el.statLastPolled) {
          this.el.statLastPolled.textContent = data.last_polled_at
            ? new Date(data.last_polled_at).toLocaleTimeString('vi-VN')
            : 'Chưa có';
        }
      }
    } catch (_) {
      if (this.el.statSyncStatus) this.el.statSyncStatus.textContent = 'Chưa kết nối';
    }
  }

  /**
   * Kích hoạt đồng bộ ThingSpeak: POST /api/v1/sync/thingspeak
   */
  async triggerThingSpeakSync() {
    const btn = this.el.btnSyncThingSpeak;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang đồng bộ...';
    }

    try {
      const endpoint = `${this.getBaseUrl()}/api/v1/sync/thingspeak`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error((res.error && res.error.message) || 'Lỗi đồng bộ');
      }

      this.showToast(`✅ ${res.message || 'Đồng bộ thành công!'} (Số bản ghi: ${res.synced_count ?? '0'})`);
      await this.loadThingSpeakStatus();
    } catch (err) {
      this.showToast(`Lỗi đồng bộ ThingSpeak: ${err.message}`, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📡 Đồng bộ ThingSpeak';
      }
    }
  }

  // --- LỌC VÀ HIỂN THỊ DANH SÁCH RULES ---

  applyFilters() {
    const keyword = (this.el.searchInput?.value || '').toLowerCase().trim();
    const param = this.el.filterParam?.value || 'all';
    const severity = this.el.filterSeverity?.value || 'all';
    const status = this.el.filterStatus?.value || 'all';

    this.filteredRules = this.rules.filter(rule => {
      // Keyword
      const matchKey = !keyword || 
        (rule.rule_code && rule.rule_code.toLowerCase().includes(keyword)) ||
        (rule.name && rule.name.toLowerCase().includes(keyword)) ||
        (rule.action_advice && rule.action_advice.toLowerCase().includes(keyword));

      // Parameter
      const matchParam = param === 'all' || rule.parameter === param;

      // Severity
      const matchSev = severity === 'all' || rule.severity === severity;

      // Status
      let matchStatus = true;
      if (status === 'active') matchStatus = Boolean(rule.is_active);
      if (status === 'inactive') matchStatus = !rule.is_active;

      return matchKey && matchParam && matchSev && matchStatus;
    });

    this.renderRulesTable();
  }

  renderRulesTable() {
    if (!this.el.rulesTableBody) return;
    this.el.rulesTableBody.innerHTML = '';

    if (this.filteredRules.length === 0) {
      if (this.el.rulesEmpty) this.el.rulesEmpty.style.display = 'table-row';
      return;
    }
    if (this.el.rulesEmpty) this.el.rulesEmpty.style.display = 'none';

    this.filteredRules.forEach(rule => {
      const tr = document.createElement('tr');
      const paramMeta = PARAMETER_METADATA[rule.parameter] || { label: rule.parameter, unit: '', icon: '📊' };

      // Biểu diễn điều kiện
      let conditionStr = '';
      if (rule.operator === 'between') {
        conditionStr = `${rule.threshold_min ?? '—'} ≤ X ≤ ${rule.threshold_max ?? '—'} ${paramMeta.unit}`;
      } else if (rule.operator === 'outside') {
        conditionStr = `X < ${rule.threshold_min ?? '—'} hoặc X > ${rule.threshold_max ?? '—'} ${paramMeta.unit}`;
      } else {
        const thresholdVal = rule.threshold_max ?? rule.threshold_min ?? '—';
        conditionStr = `${rule.operator} ${thresholdVal} ${paramMeta.unit}`;
      }

      // Severity badge class
      let badgeClass = 'badge-info';
      let sevLabel = 'Thông tin';
      if (rule.severity === 'warning') {
        badgeClass = 'badge-warning';
        sevLabel = 'Cảnh báo';
      } else if (rule.severity === 'danger') {
        badgeClass = 'badge-error';
        sevLabel = 'Nguy hiểm';
      }

      tr.innerHTML = `
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span class="rule-code-badge">${this.escapeHtml(rule.rule_code)}</span>
            <strong style="font-size: 14px; color: var(--color-navy);">${this.escapeHtml(rule.name)}</strong>
            ${rule.description ? `<small style="color: var(--color-text-secondary);">${this.escapeHtml(rule.description)}</small>` : ''}
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${paramMeta.icon}</span>
            <span style="font-weight: 500;">${paramMeta.label}</span>
          </div>
        </td>
        <td>
          <span class="rule-condition-badge">${this.escapeHtml(conditionStr)}</span>
        </td>
        <td>
          <span class="badge ${badgeClass}">${sevLabel}</span>
        </td>
        <td style="max-width: 280px;">
          <div style="font-size: 13px; line-height: 1.4; color: var(--color-navy);">
            ${this.escapeHtml(rule.action_advice)}
          </div>
        </td>
        <td>
          <label class="switch" title="${rule.is_active ? 'Đang kích hoạt' : 'Đã tạm tắt'}">
            <input type="checkbox" class="toggle-rule-active" data-id="${rule.id}" ${rule.is_active ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-action-edit btn-edit-rule" data-id="${rule.id}" title="Chỉnh sửa quy tắc">
              ✏️ Sửa
            </button>
            <button class="btn-action-delete btn-delete-rule" data-id="${rule.id}" title="Xóa quy tắc">
              🗑️ Xóa
            </button>
          </div>
        </td>
      `;

      // Bắt sự kiện trực tiếp trên các nút
      tr.querySelector('.toggle-rule-active')?.addEventListener('change', (e) => {
        this.toggleRuleActive(rule.id, e.target.checked);
      });
      tr.querySelector('.btn-edit-rule')?.addEventListener('click', () => {
        this.openEditModal(rule);
      });
      tr.querySelector('.btn-delete-rule')?.addEventListener('click', () => {
        this.openDeleteModal(rule);
      });

      this.el.rulesTableBody.appendChild(tr);
    });
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- THÊM & SỬA QUY TẮC MODAL ---

  updateThresholdInputsState(operator) {
    const minGroup = this.el.ruleMinInput?.closest('.form-group');
    const maxGroup = this.el.ruleMaxInput?.closest('.form-group');

    if (operator === 'between' || operator === 'outside') {
      if (minGroup) minGroup.style.display = 'flex';
      if (maxGroup) maxGroup.style.display = 'flex';
    } else if (operator === '<' || operator === '<=') {
      if (minGroup) minGroup.style.display = 'none';
      if (maxGroup) maxGroup.style.display = 'flex';
    } else {
      // '>' hoặc '>='
      if (minGroup) minGroup.style.display = 'flex';
      if (maxGroup) maxGroup.style.display = 'none';
    }
  }

  openAddModal() {
    this.editingRuleId = null;
    if (this.el.ruleModalTitle) this.el.ruleModalTitle.textContent = 'Thêm Quy Tắc Chăm Sóc Mới';
    if (this.el.ruleForm) this.el.ruleForm.reset();

    // Defaults
    if (this.el.ruleCodeInput) {
      this.el.ruleCodeInput.readOnly = false;
      this.el.ruleCodeInput.value = `RULE_CUSTOM_${Date.now().toString().slice(-4)}`;
    }
    if (this.el.ruleOperatorSelect) this.el.ruleOperatorSelect.value = '>';
    if (this.el.ruleSeveritySelect) this.el.ruleSeveritySelect.value = 'warning';
    if (this.el.ruleActiveCheck) this.el.ruleActiveCheck.checked = true;

    // Trigger update UI
    this.updateThresholdInputsState('>');
    const meta = PARAMETER_METADATA[this.el.ruleParamSelect?.value || 'air_temperature_c'];
    if (this.el.thresholdUnitSpan) this.el.thresholdUnitSpan.textContent = meta ? `(${meta.unit})` : '';

    this.el.ruleModal?.classList.add('active');
  }

  openEditModal(rule) {
    this.editingRuleId = rule.id;
    if (this.el.ruleModalTitle) this.el.ruleModalTitle.textContent = `Chỉnh Sửa Quy Tắc #${rule.id} (${rule.rule_code})`;

    if (this.el.ruleCodeInput) {
      this.el.ruleCodeInput.value = rule.rule_code || '';
      this.el.ruleCodeInput.readOnly = true; // Không cho sửa rule_code theo chuẩn CSDL
    }
    if (this.el.ruleNameInput) this.el.ruleNameInput.value = rule.name || '';
    if (this.el.ruleDescInput) this.el.ruleDescInput.value = rule.description || '';
    if (this.el.ruleParamSelect) this.el.ruleParamSelect.value = rule.parameter || 'air_temperature_c';
    if (this.el.ruleOperatorSelect) this.el.ruleOperatorSelect.value = rule.operator || '>';
    if (this.el.ruleMinInput) this.el.ruleMinInput.value = rule.threshold_min ?? '';
    if (this.el.ruleMaxInput) this.el.ruleMaxInput.value = rule.threshold_max ?? '';
    if (this.el.ruleSeveritySelect) this.el.ruleSeveritySelect.value = rule.severity || 'warning';
    if (this.el.ruleAdviceInput) this.el.ruleAdviceInput.value = rule.action_advice || '';
    if (this.el.ruleActiveCheck) this.el.ruleActiveCheck.checked = Boolean(rule.is_active);

    this.updateThresholdInputsState(rule.operator || '>');
    const meta = PARAMETER_METADATA[rule.parameter || 'air_temperature_c'];
    if (this.el.thresholdUnitSpan) this.el.thresholdUnitSpan.textContent = meta ? `(${meta.unit})` : '';

    this.el.ruleModal?.classList.add('active');
  }

  closeRuleModal() {
    this.el.ruleModal?.classList.remove('active');
    this.editingRuleId = null;
  }

  async handleRuleSubmit(e) {
    e.preventDefault();

    const ruleCode = this.el.ruleCodeInput.value.trim();
    const name = this.el.ruleNameInput.value.trim();
    const description = this.el.ruleDescInput.value.trim() || null;
    const parameter = this.el.ruleParamSelect.value;
    const operator = this.el.ruleOperatorSelect.value;
    const severity = this.el.ruleSeveritySelect.value;
    const actionAdvice = this.el.ruleAdviceInput.value.trim();
    const isActive = this.el.ruleActiveCheck.checked;

    let minVal = this.el.ruleMinInput.value !== '' ? parseFloat(this.el.ruleMinInput.value) : null;
    let maxVal = this.el.ruleMaxInput.value !== '' ? parseFloat(this.el.ruleMaxInput.value) : null;

    // Chuẩn hóa theo operator
    if (operator === '>' || operator === '>=') {
      maxVal = minVal;
      minVal = null;
    } else if (operator === '<' || operator === '<=') {
      minVal = null;
    }

    const payload = {
      rule_code: ruleCode,
      name,
      description,
      parameter,
      operator,
      threshold_min: minVal,
      threshold_max: maxVal,
      severity,
      action_advice: actionAdvice,
      is_active: isActive
    };

    const submitBtn = this.el.btnSubmitRule;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Đang lưu...';
    }

    try {
      if (this.editingRuleId) {
        // CẬP NHẬT: PUT /api/v1/rules/:id
        await this.updateRuleApi(this.editingRuleId, payload);
        this.showToast(`✅ Đã cập nhật quy tắc #${this.editingRuleId} thành công!`);
      } else {
        // TẠO MỚI: POST /api/v1/rules
        await this.createRuleApi(payload);
        this.showToast(`✅ Đã thêm quy tắc mới '${ruleCode}' thành công!`);
      }

      this.closeRuleModal();
      await this.loadRules();
    } catch (err) {
      this.showToast(`Lỗi: ${err.message}`, true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Lưu quy tắc';
      }
    }
  }

  async createRuleApi(payload) {
    if (this.isUsingMock) {
      const newMock = { ...payload, id: Date.now() };
      this.rules.unshift(newMock);
      return newMock;
    }

    const endpoint = `${this.getBaseUrl()}/api/v1/rules`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data.error && data.error.message) || `Lỗi tạo quy tắc (${response.status})`);
    }
    return data.rule;
  }

  async updateRuleApi(id, payload) {
    if (this.isUsingMock) {
      const idx = this.rules.findIndex(r => r.id === id);
      if (idx !== -1) {
        this.rules[idx] = { ...this.rules[idx], ...payload };
      }
      return this.rules[idx];
    }

    const endpoint = `${this.getBaseUrl()}/api/v1/rules/${id}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data.error && data.error.message) || `Lỗi cập nhật quy tắc (${response.status})`);
    }
    return data.rule;
  }

  /**
   * Toggle nhanh trạng thái kích hoạt: PUT /api/v1/rules/:id
   */
  async toggleRuleActive(id, newStatus) {
    try {
      if (this.isUsingMock) {
        const item = this.rules.find(r => r.id === id);
        if (item) item.is_active = newStatus ? 1 : 0;
      } else {
        const endpoint = `${this.getBaseUrl()}/api/v1/rules/${id}`;
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ is_active: newStatus })
        });
        if (!response.ok) throw new Error('Không thể đổi trạng thái');
      }

      this.updateStats();
      this.showToast(`Đã ${newStatus ? 'bật' : 'tắt'} quy tắc #${id}`);
    } catch (err) {
      this.showToast(`Lỗi khi đổi trạng thái: ${err.message}`, true);
      this.loadRules(); // khôi phục trạng thái cũ
    }
  }

  // --- XÓA QUY TẮC MODAL ---

  openDeleteModal(rule) {
    this.deletingRuleId = rule.id;
    if (this.el.deleteRuleName) {
      this.el.deleteRuleName.textContent = `"${rule.name}" (${rule.rule_code})`;
    }
    this.el.deleteModal?.classList.add('active');
  }

  closeDeleteModal() {
    this.el.deleteModal?.classList.remove('active');
    this.deletingRuleId = null;
  }

  async handleDeleteConfirm() {
    if (!this.deletingRuleId) return;

    const btn = this.el.btnConfirmDelete;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang xóa...';
    }

    try {
      if (this.isUsingMock) {
        this.rules = this.rules.filter(r => r.id !== this.deletingRuleId);
      } else {
        const endpoint = `${this.getBaseUrl()}/api/v1/rules/${this.deletingRuleId}`;
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data.error && data.error.message) || `Lỗi xóa (${response.status})`);
        }
      }

      this.showToast(`✅ Đã xóa quy tắc #${this.deletingRuleId} thành công!`);
      this.closeDeleteModal();
      await this.loadRules();
    } catch (err) {
      this.showToast(`Lỗi khi xóa quy tắc: ${err.message}`, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🗑️ Xác nhận xóa';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminApp = new AdminApp();
});

