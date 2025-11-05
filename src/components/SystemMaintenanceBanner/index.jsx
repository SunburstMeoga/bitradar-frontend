import { useState, useEffect, useCallback } from 'react';

// 系统维护横幅组件：监听全局维护状态事件，显示提示条
const SystemMaintenanceBanner = () => {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const handleUpdate = useCallback((event) => {
    const payload = event?.detail || {};
    // 兼容不同结构：is_maintenance / status === 'maintenance' / active
    const isActive = Boolean(
      payload?.is_maintenance ||
      payload?.active ||
      (typeof payload?.status === 'string' && payload.status.toLowerCase() === 'maintenance')
    );
    setStatus({
      active: isActive,
      message: payload?.message || '系统维护中，部分功能暂不可用',
      ...payload
    });
    // 一旦状态有更新，重新显示（取消之前的隐藏）
    setDismissed(false);
  }, []);

  useEffect(() => {
    // 监听来自 WebSocket 的维护状态更新事件
    window.addEventListener('maintenance-status-update', handleUpdate);
    return () => {
      window.removeEventListener('maintenance-status-update', handleUpdate);
    };
  }, [handleUpdate]);

  if (!status?.active || dismissed) return null;

  return (
    <div className="w-full px-4 py-2 bg-[#c5ff33] text-black text-sm flex items-center justify-center gap-3">
      <span>🔧 {status.message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="px-2 py-1 bg-black/10 rounded hover:bg-black/20"
      >
        关闭
      </button>
    </div>
  );
};

export default SystemMaintenanceBanner;