import Marquee from 'react-fast-marquee';
import { useTranslation } from 'react-i18next';

const SystemMaintenanceBanner = () => {
  const { t } = useTranslation();
  const message = t('system_maintenance.banner_text', {
    defaultValue: '尊敬的用户：系统将于 5分钟后 开始维护，预计持续5分钟 。维护期间将暂停结算功能，所有下注可能无法正常处理或结算！感谢您的配合与理解'
  });
  return (
    <div className="w-full" style={{ backgroundColor: '#EF4444' }}>
      <Marquee pauseOnHover={false} speed={50} gradient={false} delay={2} className="py-[8vw] md:py-2">
        <span className="text-white text-size-[14vw] md:text-sm font-medium" style={{ fontWeight: 500 }}>
          {message} &nbsp;&nbsp;&nbsp;
        </span>
      </Marquee>
    </div>
  );
};

export default SystemMaintenanceBanner;