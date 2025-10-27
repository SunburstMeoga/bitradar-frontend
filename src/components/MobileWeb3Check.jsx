import React, { useEffect, useState, useRef } from 'react';
import GlobalConfirmDialog from './GlobalConfirmDialog';

/**
 * 应用加载时的手机设备 + Web3 环境检查
 * - 若为手机设备且无 Web3，则提示安装 TokenPocket
 * - 若为手机设备且有 Web3，则仅打印当前环境信息
 */
const MobileWeb3Check = () => {
  const [open, setOpen] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const hasWeb3 = typeof window !== 'undefined' && (window.ethereum || window.web3);

    if (!isMobile) return; // 仅在手机设备上生效

    if (hasWeb3) {
      try {
        console.log('[MobileWeb3Check] 检测到Web3环境:', {
          ethereum: !!window.ethereum,
          web3Legacy: !!window.web3,
          provider: window.ethereum || window.web3
        });
      } catch (_) {}
      return;
    }

    // 手机且无Web3：提示安装 TokenPocket
    setOpen(true);
  }, []);

  const handleInstall = () => {
    try {
      window.open('https://dl.tpstatic.net/apk/TokenPocket-pro.apk', '_blank', 'noopener');
    } catch (_) {}
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <GlobalConfirmDialog
      isOpen={open}
      onClose={() => setOpen(false)}
      title={'检测到手机设备'}
      content={'为继续使用，请安装 TokenPocket 钱包。'}
      confirmText={'安装'}
      cancelText={'暂不安装'}
      handleConfirm={handleInstall}
      handleCancel={handleCancel}
      closeOnOverlayClick={false}
      confirmLoading={false}
    />
  );
};

export default MobileWeb3Check;