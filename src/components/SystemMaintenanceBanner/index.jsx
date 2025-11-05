import { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';
import { useTranslation } from 'react-i18next';

const SystemMaintenanceBanner = () => {
  const { i18n } = useTranslation();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // 滾動速度映射
  const speedMap = {
    slow: 30,
    medium: 50,
    fast: 80,
  };

  // 首次載入：主動查詢維護狀態
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        // 從 bitradar-go 查詢維護狀態（公開 API，無需認證）
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/maintenance/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.is_enabled) {
            setConfig(data.data);
            console.log('🔧 初始維護狀態:', data.data);
          } else {
            setConfig(null);
          }
        } else {
          console.warn('⚠️ 獲取維護狀態失敗:', response.status);
          setConfig(null);
        }
      } catch (error) {
        console.error('❌ 獲取維護狀態錯誤:', error);
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  // WebSocket 監聽：即時更新維護狀態
  useEffect(() => {
    const handleMaintenanceUpdate = (event) => {
      const data = event.detail;
      console.log('🔧 WebSocket 維護狀態更新:', data);

      if (data.is_enabled) {
        setConfig(data);
      } else {
        setConfig(null);
      }
    };

    // 監聽自定義事件
    window.addEventListener('maintenance-status-update', handleMaintenanceUpdate);

    // 清理事件監聽器
    return () => {
      window.removeEventListener('maintenance-status-update', handleMaintenanceUpdate);
    };
  }, []);

  // 如果正在載入或沒有配置，不顯示橫幅
  if (loading || !config) {
    return null;
  }

  // 根據當前語言獲取訊息
  const currentLanguage = i18n.language || 'en';
  const message = config.messages?.[currentLanguage] || config.messages?.en || '系統維護中，請稍後訪問';

  // 獲取滾動速度
  const scrollSpeed = speedMap[config.scroll_speed] || speedMap.medium;

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: '#EF4444',
      }}
    >
      <Marquee
        pauseOnHover={false}
        speed={scrollSpeed}
        gradient={false}
        delay={0}
        className="py-[8vw] md:py-2"
      >
        <span
          className="text-white text-size-[14vw] md:text-sm font-medium"
          style={{ fontWeight: 500 }}
        >
          {message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      </Marquee>
    </div>
  );
};

export default SystemMaintenanceBanner;