import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function RuleModal({ isOpen, rule, initialRule, onClose, onSave }) {
  const currentRule = rule || initialRule;
  const isEdit = !!currentRule;

  const [ruleCode, setRuleCode] = useState('');
  const [name, setName] = useState('');
  const [parameter, setParameter] = useState('air_temperature_c');
  const [operator, setOperator] = useState('>');
  const [thresholdMin, setThresholdMin] = useState(35);
  const [thresholdMax, setThresholdMax] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [actionAdvice, setActionAdvice] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Sync state whenever modal opens or currentRule changes
  useEffect(() => {
    if (isOpen) {
      if (currentRule) {
        setRuleCode(currentRule.rule_code || '');
        setName(currentRule.name || '');
        setParameter(currentRule.parameter || 'air_temperature_c');
        setOperator(currentRule.operator || '>');
        setThresholdMin(currentRule.threshold_min !== undefined && currentRule.threshold_min !== null ? currentRule.threshold_min : 35);
        setThresholdMax(currentRule.threshold_max !== undefined && currentRule.threshold_max !== null ? currentRule.threshold_max : '');
        setSeverity(currentRule.severity || 'warning');
        setActionAdvice(currentRule.action_advice || '');
        setIsActive(currentRule.is_active !== undefined ? currentRule.is_active : true);
      } else {
        setRuleCode('');
        setName('');
        setParameter('air_temperature_c');
        setOperator('>');
        setThresholdMin(35);
        setThresholdMax('');
        setSeverity('warning');
        setActionAdvice('');
        setIsActive(true);
      }
    }
  }, [isOpen, currentRule]);

  // Support closing with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // If modal is not open, do not render anything
  if (!isOpen) return null;

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
            {isEdit ? `Chỉnh sửa Quy tắc #${currentRule.id}` : 'Thêm Quy tắc Chăm sóc Mới'}
          </h3>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
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
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
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
