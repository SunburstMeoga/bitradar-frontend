import Marquee from 'react-fast-marquee';
import { useTranslation } from 'react-i18next';

const SystemMaintenanceBanner = () => {
  const { t } = useTranslation();
  const message = t('system_maintenance.banner_text', {
    defaultValue: '尊敬的用户：系统正在维护，预计将于纽约冬令时（EST）19:00 结束。维护期间将暂停下注功能，敬请谅解！'
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