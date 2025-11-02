import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CaptchaModal from '../../components/Captcha/CaptchaModal.jsx';

export default function TestCaptcha() {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState('');
  const { t } = useTranslation();

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{t('captcha.test_title')}</h2>
      <p style={{ color: '#64748b', marginBottom: 12 }}>
        {t('captcha.test_description')}
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
        {t('captcha.open_modal')}
      </button>

      <div style={{ marginTop: 12 }}>
        {status === 'success' && (
          <div style={{ color: '#10b981' }}>{t('captcha.success')}</div>
        )}
        {status === 'failure' && (
          <div style={{ color: '#ef4444' }}>{t('captcha.fail')}</div>
        )}
      </div>

      <CaptchaModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t('captcha.dialog_title')}
        description={t('captcha.dialog_description')}
        captchaType="math"
        placeholder={t('captcha.placeholder_math')}
        reloadText={t('captcha.reload_text')}
        onSuccess={() => setStatus('success')}
        onFail={() => setStatus('failure')}
      />
    </div>
  );
}