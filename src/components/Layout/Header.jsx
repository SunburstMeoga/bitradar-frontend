import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3Store, useAuthStore } from '../../store';
import { connectWallet, formatAddress, autoReconnectWallet, onAccountsChanged, onChainChanged } from '../../utils/web3';
import logoImg from '../../assets/images/logo.png';
import binanceIcon from '../../assets/icons/binance.png';
import downIcon from '../../assets/icons/down.png';
import WalletModal from '../WalletModal';
import toast from 'react-hot-toast';

const Header = () => {
  const { t } = useTranslation();
  const { account, isConnected, isConnecting, setAccount, setIsConnected, setIsConnecting, setChainId, setWeb3, setProvider } = useWeb3Store();
  const { isAuthenticated, user, login, logout, checkAuth, isLoading: authLoading } = useAuthStore();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // 页面加载时自动重连钱包
  useEffect(() => {
    // 清理可能损坏的localStorage数据
    const cleanupStorage = () => {
      try {
        const stored = localStorage.getItem('web3-storage');
        if (stored) {
          JSON.parse(stored); // 测试是否能正常解析
        }
      } catch (error) {
        console.warn('清理损坏的localStorage数据:', error);
        localStorage.removeItem('web3-storage');
      }
    };

    const initWallet = async () => {
      cleanupStorage(); // 先清理可能损坏的数据

      const walletData = await autoReconnectWallet();
      if (walletData) {
        setAccount(walletData.account);
        setChainId(walletData.chainId); // 现在chainId已经是字符串
        setWeb3(walletData.web3);
        setProvider(walletData.provider);
        setIsConnected(true);
      }
    };

    initWallet();

    // 检查认证状态
    checkAuth();

    // 监听账户变化
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // 用户断开了钱包连接
        setAccount(null);
        setIsConnected(false);
        setChainId(null);
        setWeb3(null);
        setProvider(null);
      } else {
        // 用户切换了账户
        setAccount(accounts[0]);
      }
    };

    // 监听网络变化
    const handleChainChanged = (chainId) => {
      setChainId(chainId.toString()); // 确保chainId是字符串
      // 可以在这里添加网络切换的逻辑
    };

    // 添加事件监听
    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    // 清理函数
    return () => {
      // 这里可以添加清理监听器的逻辑
    };
  }, [setAccount, setIsConnected, setChainId, setWeb3, setProvider]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // 1. 首先连接钱包
      const result = await connectWallet();
      setAccount(result.account);
      setChainId(result.chainId);
      setWeb3(result.web3);
      setProvider(result.provider);
      setIsConnected(true);

      // 2. 然后进行Web3登录认证
      try {
        await login(result.account);
        toast.success('钱包连接并登录成功！');
      } catch (authError) {
        console.error('Web3登录失败:', authError);
        toast.error(`登录失败: ${authError.message}`);
        // 即使登录失败，钱包连接仍然保持
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // 处理钱包按钮点击
  const handleWalletClick = () => {
    if (isConnected) {
      // 已连接钱包，打开弹窗
      setIsWalletModalOpen(true);
    } else {
      // 未连接钱包，执行连接
      handleConnect();
    }
  };

  return (
    <header className="w-full sticky top-0 z-[100]" style={{ backgroundColor: '#121212' }}>
      {/* 移动端：使用vw单位 */}
      <div className="flex justify-between items-center px-[16vw] py-[11vw] md:hidden">
        {/* 左侧Logo */}
        <div>
          <img src={logoImg} alt="BitRocket" className="w-[104vw] h-[24vw] object-contain" />
        </div>

        {/* 右侧钱包连接按钮 */}
        <div>
          {isConnected ? (
            <button
              onClick={handleWalletClick}
              className="w-[112vw] h-[36vw] flex items-center gap-[4vw] bg-transparent border border-[#3D3D3D] rounded-[34vw] p-[9vw] hover:border-[#3D3D3D] transition-all"
            >
              <img src={binanceIcon} alt="BSC" className="w-[16vw] h-[16vw] object-contain" />
              <span className="text-white text-size-[13vw] font-medium">{formatAddress(account, 3, 3)}</span>
              <img src={downIcon} alt="Down" className="w-[16vw] h-[16vw] object-contain" />
            </button>
          ) : (
            <button
              onClick={handleWalletClick}
              disabled={isConnecting || authLoading}
              className="w-[130vw] h-[34vw] bg-white text-black text-size-[15vw] font-semibold rounded-[34vw] flex items-center justify-center hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {(isConnecting || authLoading) ? t('wallet.connecting') : t('common.connect_wallet')}
            </button>
          )}
        </div>
      </div>

      {/* 平板端和PC端：使用固定px单位 */}
      <div className="hidden md:flex md:justify-between md:items-center md:px-4 md:py-3">
        {/* 左侧Logo */}
        <div>
          <img src={logoImg} alt="BitRocket" className="w-26 h-6 object-contain" />
        </div>

        {/* 右侧钱包连接按钮 */}
        <div>
          {isConnected ? (
            <button
              onClick={handleWalletClick}
              className="w-28 h-9 flex items-center gap-1 bg-transparent border border-[#3D3D3D] rounded-full px-2 hover:border-[#3D3D3D] transition-all"
            >
              <img src={binanceIcon} alt="BSC" className="w-4 h-4 object-contain" />
              <span className="text-white text-sm font-medium">{formatAddress(account, 3, 3)}</span>
              <img src={downIcon} alt="Down" className="w-4 h-4 object-contain" />
            </button>
          ) : (
            <button
              onClick={handleWalletClick}
              disabled={isConnecting || authLoading}
              className="w-32 h-8 bg-white text-black text-sm font-semibold rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {(isConnecting || authLoading) ? t('wallet.connecting') : t('common.connect_wallet')}
            </button>
          )}
        </div>
      </div>

      {/* 钱包弹窗 */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </header>
  );
};

export default Header;
