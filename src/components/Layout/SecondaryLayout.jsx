import { Toaster } from 'react-hot-toast';
import SecondaryHeader from './SecondaryHeader';
import ResponsiveContainer from './ResponsiveContainer';
import ScrollToTop from '../ScrollToTop';
import AuthExpiredHandler from '../AuthExpiredHandler';
import ErrorBoundary from '../ErrorBoundary';
import { useTranslation } from 'react-i18next';
import MobileWeb3Check from '../MobileWeb3Check';
import LusdAutoClaimPrompt from '../LusdAutoClaimPrompt';

const SecondaryLayout = ({ title, onBack, children }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#121212' }}>
      <ScrollToTop />
      <ResponsiveContainer>
        <SecondaryHeader title={title} onBack={onBack} />
        <main className="flex-1">
          <ErrorBoundary
            title={t('error_boundary.title', { defaultValue: '出现错误' })}
            description={t('error_boundary.description', { defaultValue: '发生了意外错误，请刷新页面重试。' })}
            refreshText={t('error_boundary.refresh', { defaultValue: '刷新' })}
          >
            {children}
          </ErrorBoundary>
        </main>
      </ResponsiveContainer>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#2a2a2a',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            padding: '8px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* 全局登录过期弹窗监听器 */}
      <AuthExpiredHandler />
+     {/* 手机+Web3检查与LuckyUSD自动领取 */}
+     <MobileWeb3Check />
+     <LusdAutoClaimPrompt />
    </div>
  );
};

export default SecondaryLayout;
