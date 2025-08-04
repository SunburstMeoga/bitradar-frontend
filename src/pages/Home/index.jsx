import { useTranslation } from 'react-i18next';
import VwTest from '../../components/VwTest';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen p-[20vw] pb-[86vw]" style={{ backgroundColor: '#121212' }}>
      {/* 原有的简单演示 */}
      <div className="max-w-7xl mx-auto px-[16vw] py-[32vw]">
        <div className="text-center mb-[48vw]">
          <h1 className="text-[32vw] font-bold text-[#c5ff33] mb-[16vw]">
            {t('home.title')}
          </h1>
          <p className="text-[20vw] text-white mb-[8vw] font-semibold">
            {t('home.welcome')}
          </p>
          <p className="text-[16vw] text-[#8f8f8f] mb-[32vw]">
            {t('home.description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
