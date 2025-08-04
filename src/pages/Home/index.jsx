import { useTranslation } from 'react-i18next';
import VwTest from '../../components/VwTest';
import './index.scss';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      {/* 原有的简单演示 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="home-title">
            {t('home.title')}
          </h1>
          <p className="home-subtitle">
            {t('home.welcome')}
          </p>
          <p className="home-description">
            {t('home.description')}
          </p>
        </div>
      </div>
      <div className='w-[200vw] mx-auto h-[300vw] bg-primary' ></div>
      {/* vw 插件测试 */}
      <VwTest />
    </div>
  );
};

export default Home;
