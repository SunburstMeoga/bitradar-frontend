import React from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { title, description, refreshText, onRefresh } = this.props;
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121212' }}>
          <div className="text-center p-8">
            <h2 className="text-white text-xl font-semibold mb-4">
              {title || 'Something went wrong'}
            </h2>
            <p className="text-[#8f8f8f] mb-6">
              {description || 'An unexpected error occurred. Please refresh the page and try again.'}
            </p>
            <button
              onClick={() => (typeof onRefresh === 'function' ? onRefresh() : window.location.reload())}
              className="px-6 py-3 bg-[#c5ff33] text-black rounded-lg font-medium hover:opacity-80 transition-opacity"
            >
              {refreshText || 'Refresh Page'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 函数式组件版本的错误显示
export const ErrorDisplay = ({ error, onRetry, message }) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-[40vw] md:py-10">
      <div className="text-[#f5384e] text-size-[16vw] md:text-lg mb-[16vw] md:mb-4">
        {message || error?.message || t('common.error')}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-[24vw] md:px-6 py-[12vw] md:py-3 bg-[#c5ff33] text-black rounded-[8vw] md:rounded-lg font-medium hover:opacity-80 transition-opacity"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  );
};

// 加载状态组件
export const LoadingSpinner = ({ message }) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-[40vw] md:py-10">
      <div className="inline-block animate-spin rounded-full h-[32vw] md:h-8 w-[32vw] md:w-8 border-b-2 border-[#c5ff33] mb-[16vw] md:mb-4"></div>
      <div className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
        {message || t('common.loading')}
      </div>
    </div>
  );
};

export default ErrorBoundary;
