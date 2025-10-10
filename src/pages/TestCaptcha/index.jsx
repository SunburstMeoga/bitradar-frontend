import { useState } from 'react';
import CaptchaModal from '../../components/Captcha/CaptchaModal.jsx';

export default function TestCaptcha() {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState('');

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>验证码测试页</h2>
      <p style={{ color: '#64748b', marginBottom: 12 }}>
        验证码以弹窗形式展示。此页面用于体验与测试全局弹窗验证码组件。
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          height: 36,
          padding: '0 12px',
          borderRadius: 6,
          border: '1px solid #1e293b',
          background: '#1e293b',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        打开验证码弹窗
      </button>

      <div style={{ marginTop: 12 }}>
        {status === 'success' && (
          <div style={{ color: '#10b981' }}>验证通过</div>
        )}
        {status === 'failure' && (
          <div style={{ color: '#ef4444' }}>验证失败</div>
        )}
      </div>

      <CaptchaModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="安全验证"
        description="请输入下方验证码完成验证。"
        captchaType="math"
        placeholder="请输入计算结果"
        reloadText="重新加载"
        onSuccess={() => setStatus('success')}
        onFail={() => setStatus('failure')}
      />
    </div>
  );
}