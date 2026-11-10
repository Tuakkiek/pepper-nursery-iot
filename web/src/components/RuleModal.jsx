import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';

export default function RuleModal({ rule, onClose, onSave }) {
  const isEdit = !!rule;

  const [ruleCode, setRuleCode] = useState(rule?.rule_code || '');
  const [name, setName] = useState(rule?.name || '');
  const [parameter, setParameter] = useState(rule?.parameter || 'air_temperature_c');
  const [operator, setOperator] = useState(rule?.operator || '>');
  const [thresholdMin, setThresholdMin] = useState(rule?.threshold_min !== undefined ? rule.threshold_min : 35);
  const [thresholdMax, setThresholdMax] = useState(rule?.threshold_max !== undefined ? rule.threshold_max : '');
  const [severity, setSeverity] = useState(rule?.severity || 'warning');
  const [actionAdvice, setActionAdvice] = useState(rule?.action_advice || '');
  const [isActive, setIsActive] = useState(rule?.is_active !== undefined ? rule.is_active : true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      rule_code: ruleCode,
      name,
      parameter,
      operator,
      threshold_min: thresholdMin !== '' ? Number(thresholdMin) : null,
      threshold_max: thresholdMax !== '' ? Number(thresholdMax) : null,
      severity,
      action_advice: actionAdvice,
      is_active: isActive
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? `Chỉnh sửa Quy tắc #${rule.id}` : 'Thêm Quy tắc Chăm sóc Mới'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Mã quy tắc (Rule Code)</label>
            <input 
              type="text"
              required
              disabled={isEdit}
              className="form-input"
              placeholder="VD: AIR_TEMP_HIGH_01"
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tên quy tắc</label>
            <input 
              type="text"
              required
              className="form-input"
              placeholder="VD: Cảnh báo nhiệt độ không khí quá nóng"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <div className="form-group">
              <label className="form-label">Thông số cảm biến</label>
              <select 
                className="select-input"
                style={{ width: '100%' }}
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
              >
                <option value="air_temperature_c">Nhiệt độ không khí (°C)</option>
                <option value="air_humidity_pct">Độ ẩm không khí (%)</option>
                <option value="soil_temperature_c">Nhiệt độ đất (°C)</option>
                <option value="soil_moisture_pct">Độ ẩm đất (%)</option>
                <option value="water_ph">pH nước tưới</option>
                <option value="water_tds_ppm">TDS dung dịch (ppm)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Toán tử so sánh</label>
              <select 
                className="select-input"
                style={{ width: '100%' }}
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                <option value=">">&gt; Lớn hơn</option>
                <option value="<">&lt; Nhỏ hơn</option>
                <option value=">=">&gt;= Lớn hơn hoặc bằng</option>
                <option value="<=">&lt;= Nhỏ hơn hoặc bằng</option>
                <option value="between">Trong khoảng (between)</option>
                <option value="outside">Ngoài khoảng (outside)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <div className="form-group">
              <label className="form-label">Ngưỡng (Threshold Min)</label>
              <input 
                type="number"
                step="0.1"
                required
                className="form-input"
                value={thresholdMin}
                onChange={(e) => setThresholdMin(e.target.value)}
              />
            </div>

            {(operator === 'between' || operator === 'outside') && (
              <div className="form-group">
                <label className="form-label">Ngưỡng trên (Threshold Max)</label>
                <input 
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={thresholdMax}
                  onChange={(e) => setThresholdMax(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mức độ nghiêm trọng</label>
              <select 
                className="select-input"
                style={{ width: '100%' }}
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="info">Thông tin (Info)</option>
                <option value="warning">Cảnh báo (Warning)</option>
                <option value="danger">Nguy hiểm (Danger)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nội dung khuyến nghị hành động (Action Advice)</label>
            <textarea 
              required
              rows={3}
              className="form-input"
              placeholder="VD: Cần kéo bạt lưới che nắng và bật hệ thống phun sương làm mát"
              value={actionAdvice}
              onChange={(e) => setActionAdvice(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input 
              type="checkbox"
              id="is_active_chk"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="is_active_chk" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer' }}>
              Kích hoạt quy tắc này ngay lập tức
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} />
              <span>{isEdit ? 'Lưu thay đổi' : 'Tạo quy tắc'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

