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

  useEffect(() => {
    if (isOpen) {
      if (currentRule) {
        setRuleCode(currentRule.rule_code || '');
        setName(currentRule.name || '');
        setParameter(currentRule.parameter || 'air_temperature_c');
        setOperator(currentRule.operator || '>');
        setThresholdMin(
          currentRule.threshold_min !== undefined && currentRule.threshold_min !== null
            ? currentRule.threshold_min
            : ''
        );
        setThresholdMax(
          currentRule.threshold_max !== undefined && currentRule.threshold_max !== null
            ? currentRule.threshold_max
            : ''
        );
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      rule_code: ruleCode.trim(),
      name: name.trim(),
      parameter,
      operator,
      threshold_min: thresholdMin !== '' ? Number(thresholdMin) : null,
      threshold_max: thresholdMax !== '' ? Number(thresholdMax) : null,
      severity,
      action_advice: actionAdvice.trim(),
      is_active: isActive
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {isEdit ? `Chỉnh sửa quy tắc` : 'Thêm quy tắc mới'}
            </h3>
            {isEdit && (
              <p className="modal-subtitle">
                Mã: <code>{currentRule.rule_code}</code>
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Mã quy tắc *</label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-input"
                  placeholder="VD: AIR_TEMP_HIGH"
                  value={ruleCode}
                  onChange={(e) => setRuleCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mức độ cảnh báo</label>
                <select
                  className="form-select"
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
              <label className="form-label">Tên quy tắc *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="VD: Cảnh báo nhiệt độ không khí quá nóng"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Thông số cảm biến</label>
                <select
                  className="form-select"
                  value={parameter}
                  onChange={(e) => setParameter(e.target.value)}
                >
                  <option value="air_temperature_c">Nhiệt độ không khí (°C)</option>
                  <option value="air_humidity_pct">Độ ẩm không khí (%)</option>
                  <option value="soil_temperature_c">Nhiệt độ đất (°C)</option>
                  <option value="soil_moisture_pct">Độ ẩm đất (%)</option>
                  <option value="water_ph">pH dung dịch</option>
                  <option value="water_tds_ppm">TDS dung dịch (ppm)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Toán tử so sánh</label>
                <select
                  className="form-select"
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

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  {operator === 'between' || operator === 'outside' ? 'Ngưỡng dưới' : 'Giá trị ngưỡng'} *
                </label>
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
                  <label className="form-label">Ngưỡng trên *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="form-input"
                    value={thresholdMax}
                    onChange={(e) => setThresholdMax(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Khuyến nghị hành động *</label>
              <textarea
                required
                rows={3}
                className="form-input form-textarea"
                placeholder="VD: Kéo lưới che nắng và bật phun sương làm mát mái."
                value={actionAdvice}
                onChange={(e) => setActionAdvice(e.target.value)}
              />
            </div>

            <label className="form-checkbox-row" htmlFor="is_active_chk">
              <input
                type="checkbox"
                id="is_active_chk"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Kích hoạt quy tắc này ngay lập tức</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>{isEdit ? 'Lưu thay đổi' : 'Tạo quy tắc'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
