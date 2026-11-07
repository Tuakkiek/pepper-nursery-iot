import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Radio, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Power
} from 'lucide-react';
import { apiService } from '../services/api.js';
import RuleModal from './RuleModal.jsx';

export default function AdminConsole({ user, onOpenAuthModal, showToast }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paramFilter, setParamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tsStatus, setTsStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    loadRules();
    loadThingSpeakStatus();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRules(true);
      setRules(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadThingSpeakStatus = async () => {
    try {
      const status = await apiService.getThingSpeakStatus();
      setTsStatus(status);
    } catch {
      // ignore
    }
  };

  const handleSyncThingSpeak = async () => {
    setIsSyncing(true);
    try {
      const res = await apiService.syncThingSpeak();
      showToast(`Đã đồng bộ ${res.new_readings_count || 0} bản ghi từ ThingSpeak!`, 'success');
      loadThingSpeakStatus();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleActive = async (rule) => {
    if (!isAdmin) {
      showToast('Cần quyền Admin để chỉnh sửa quy tắc', 'error');
      return;
    }
    try {
      await apiService.updateRule(rule.id, { is_active: !rule.is_active });
      showToast(`Đã ${!rule.is_active ? 'kích hoạt' : 'tắt'} quy tắc ${rule.rule_code}`, 'success');
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRule = async (id, code) => {
    if (!isAdmin) {
      showToast('Cần quyền Admin để xóa quy tắc', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy tắc [${code}]?`)) return;

    try {
      await apiService.deleteRule(id);
      showToast(`Đã xóa thành công quy tắc #${id}`, 'success');
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveRule = async (payload) => {
    try {
      if (editingRule) {
        await apiService.updateRule(editingRule.id, payload);
        showToast('Đã cập nhật quy tắc thành công', 'success');
      } else {
        await apiService.createRule(payload);
        showToast('Đã thêm quy tắc mới thành công', 'success');
      }
      setModalOpen(false);
      setEditingRule(null);
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter logic
  const filteredRules = rules.filter(r => {
    const matchSearch = r.rule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.action_advice?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchParam = paramFilter === 'ALL' || r.parameter === paramFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? r.is_active : !r.is_active);

    return matchSearch && matchParam && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Admin Role Guard Banner */}
      {!isAdmin && (
        <div className="advice-banner warning">
          <div className="advice-icon-wrap">
            <ShieldCheck size={28} color="var(--amber-strong)" />
          </div>
          <div className="advice-body">
            <div className="advice-title">Chế độ xem Quản trị (Read-Only)</div>
            <div className="advice-text">
              Bạn đang xem danh sách quy tắc với vai trò Khách / Người dùng thường. Để Thêm, Sửa, Xóa hoặc Đổi trạng thái kích hoạt, vui lòng đăng nhập với tài khoản Quản trị viên (Admin).
            </div>
            <div style={{ marginTop: '8px' }}>
              <button 
                className="btn btn-primary btn-sm"
                onClick={onOpenAuthModal}
              >
                🔑 Đăng nhập quyền Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI & ThingSpeak Worker Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {/* KPI 1 */}
        <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG SỐ QUY TẮC</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand-navy)', margin: '4px 0' }}>{rules.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Đang kích hoạt: <strong style={{ color: 'var(--success-strong)' }}>{rules.filter(r => r.is_active).length}</strong> quy tắc
          </div>
        </div>

        {/* KPI 2: ThingSpeak Control Center */}
        <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>THINGSPEAK WORKER</span>
              <span className={`badge ${tsStatus?.is_running ? 'badge-normal' : 'badge-empty'}`}>
                {tsStatus?.is_running ? '● Đang chạy' : '○ Tạm dừng'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--brand-navy)', marginTop: '6px' }}>
              Channel ID: <strong>{tsStatus?.channel_id || 3543608}</strong> · Quét mỗi 20s
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleSyncThingSpeak}
              disabled={isSyncing}
              style={{ width: '100%' }}
            >
              <Radio size={14} />
              <span>{isSyncing ? 'Đang kích hoạt...' : 'Ép đồng bộ ThingSpeak ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules Toolbar */}
      <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--brand-navy)' }}>
            Danh sách Quy tắc Chăm sóc Cây ớt con
          </h3>
          {isAdmin && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingRule(null); setModalOpen(true); }}
            >
              <Plus size={15} />
              <span>Thêm quy tắc mới</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text"
              placeholder="Tìm theo mã, tên hoặc lời khuyên..."
              className="form-input"
              style={{ paddingLeft: '32px', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-secondary)" />
            <select 
              className="select-input"
              value={paramFilter}
              onChange={(e) => setParamFilter(e.target.value)}
            >
              <option value="ALL">Tất cả thông số</option>
              <option value="air_temperature_c">Nhiệt độ không khí</option>
              <option value="air_humidity_pct">Độ ẩm không khí</option>
              <option value="soil_temperature_c">Nhiệt độ đất</option>
              <option value="soil_moisture_pct">Độ ẩm đất</option>
              <option value="water_ph">pH dung dịch</option>
              <option value="water_tds_ppm">TDS dung dịch</option>
            </select>
          </div>

          <select 
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Đã tắt</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={loadRules} title="Tải lại danh sách">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Rules Table */}
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã quy tắc</th>
                <th>Tên quy tắc</th>
                <th>Thông số cảm biến</th>
                <th>Điều kiện / Ngưỡng</th>
                <th>Mức độ</th>
                <th>Lời khuyên hành động</th>
                <th>Trạng thái</th>
                {isAdmin && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    Không tìm thấy quy tắc nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRules.map(r => (
                  <tr key={r.id}>
                    <td><code>{r.rule_code}</code></td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      <span className="badge badge-normal">{r.parameter}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.operator} {r.threshold_min ?? ''} {r.threshold_max ? `.. ${r.threshold_max}` : ''}
                    </td>
                    <td>
                      <span className={`badge ${r.severity === 'danger' ? 'badge-error' : r.severity === 'warning' ? 'badge-stale' : 'badge-normal'}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '12px' }}>
                      {r.action_advice}
                    </td>
                    <td>
                      <button 
                        type="button"
                        onClick={() => handleToggleActive(r)}
                        className={`badge ${r.is_active ? 'badge-ok' : 'badge-empty'}`}
                        style={{ cursor: isAdmin ? 'pointer' : 'default', border: 'none' }}
                        title={isAdmin ? "Nhấn để bật/tắt" : ""}
                      >
                        {r.is_active ? '● BẬT' : '○ TẮT'}
                      </button>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setEditingRule(r); setModalOpen(true); }}
                            title="Chỉnh sửa quy tắc"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteRule(r.id, r.rule_code)}
                            title="Xóa quy tắc"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <RuleModal 
          rule={editingRule}
          onClose={() => { setModalOpen(false); setEditingRule(null); }}
          onSave={handleSaveRule}
        />
      )}
    </div>
  );
}

