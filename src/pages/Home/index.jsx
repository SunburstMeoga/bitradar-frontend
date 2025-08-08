import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import VwTest from '../../components/VwTest';
import VwPluginTest from '../../components/VwPluginTest';

const Home = () => {
  const { t } = useTranslation();

  // 设置页面标题
  usePageTitle('home');

  return (
    <div className="min-h-screen p-[20vw] pb-[86vw]" style={{ backgroundColor: '#121212' }}>
      {/* 原有的简单演示 */}
      <div className="max-w-7xl mx-auto px-[16vw] py-[32vw]">
        <div className="text-center mb-[48vw]">
          <h1 className="text-size-[32vw] font-bold text-[#c5ff33] mb-[16vw]">
            {t('home.title')}
          </h1>
          <p className="text-size-[20vw] text-white mb-[8vw] font-semibold">
            {t('home.welcome')}
          </p>
          <p className="text-size-[16vw] text-[#8f8f8f] mb-[32vw]">
            {t('home.description')}
          </p>
        </div>
      </div>

      {/* vw插件测试 */}
      <VwPluginTest />
    </div>
  );
};

export default Home;
