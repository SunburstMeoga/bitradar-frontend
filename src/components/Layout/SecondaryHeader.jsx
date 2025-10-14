import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3Store, useAuthStore, useUserStore } from '../../store';
import { connectWallet, formatAddress, autoReconnectWallet, onAccountsChanged, onChainChanged, removeListeners, getStoredAccount, setStoredAccount } from '../../utils/web3';
import binanceIcon from '../../assets/icons/binance.png';
import downIcon from '../../assets/icons/down.png';
import WalletModal from '../WalletModal';

// 返回按钮SVG组件
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 18L9 12L15 6"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SecondaryHeader = ({ title, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account, isConnected, isConnecting, setAccount, setIsConnected, setIsConnecting, setChainId, setWeb3, setProvider } = useWeb3Store();
  const { login, logout } = useAuthStore();
  const { fetchUserInfo, fetchBalance, fetchMembershipInfo, fetchMembershipConfig } = useUserStore();
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
      const prevStoredAccount = getStoredAccount();
      const walletData = await autoReconnectWallet();
      if (walletData) {
        setAccount(walletData.account);
        setChainId(walletData.chainId); // 现在chainId已经是字符串
        setWeb3(walletData.web3);
        setProvider(walletData.provider);
        setIsConnected(true);
        if (prevStoredAccount && walletData.account && prevStoredAccount !== walletData.account) {
          try {
            await logout();
          } catch (_) {}
          try {
            await login(walletData.account);
            await Promise.all([
              fetchUserInfo(),
              fetchBalance(),
              fetchMembershipInfo(),
              fetchMembershipConfig()
            ]);
            setStoredAccount(walletData.account, 'evm');
            window.location.reload();
          } catch (error) {
            console.error('页面刷新后检测到地址变化，重新登录失败:', error);
          }
        } else {
          setStoredAccount(walletData.account, 'evm');
        }
      }
    };

    initWallet();

    // 监听账户变化
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // 用户断开了钱包连接
        setAccount(null);
        setIsConnected(false);
        setChainId(null);
        setWeb3(null);
        setProvider(null);
        // 清理本地token登录信息与钱包地址
        try {
          logout();
        } catch (e) {
          console.warn('登出失败:', e);
        }
        try {
          localStorage.removeItem('web3-storage');
        } catch (e) {
          console.warn('清理本地地址失败:', e);
        }
      } else {
        // 用户切换了账户 -> 重新登录并刷新用户数据
        const switchedAccount = accounts[0];
        setAccount(switchedAccount);
        setStoredAccount(switchedAccount, 'evm');

        const reloginAndRefresh = async () => {
          try {
            await login(switchedAccount);
            await Promise.all([
              fetchUserInfo(),
              fetchBalance(),
              fetchMembershipInfo(),
              fetchMembershipConfig()
            ]);
            // 登录后整页刷新，确保所有页面状态与数据一致
            window.location.reload();
          } catch (error) {
            console.error('账户切换后重新登录失败:', error);
            alert(`账户切换登录失败: ${error.message}`);
          }
        };

        reloginAndRefresh();
      }
    };

    // 监听网络变化
    const handleChainChanged = (chainId) => {
      setChainId(chainId.toString());
      // 可以在这里添加网络切换的逻辑
    };

    // 为避免重复注册，先移除旧的监听器，再添加新的监听器
    removeListeners();
    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    // 清理函数：组件卸载时移除监听器，防止重复触发
    return () => {
      removeListeners();
    };
  }, [setAccount, setIsConnected, setChainId, setWeb3, setProvider, logout]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await connectWallet();
      setAccount(result.account);
      setChainId(result.chainId); // 现在chainId已经是字符串
      setWeb3(result.web3);
      setProvider(result.provider);
      setIsConnected(true);

      // 登录并刷新用户信息与会员数据
      try {
        await login(result.account);
        await Promise.all([
          fetchUserInfo(),
          fetchBalance(),
          fetchMembershipInfo(),
          fetchMembershipConfig()
        ]);
      } catch (authError) {
        console.error('登录或获取用户数据失败:', authError);
        alert(`登录失败: ${authError.message}`);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(error.message);
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

  // 处理返回按钮点击
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // 默认返回上一页
    }
  };

  return (
    <header className="w-full sticky top-0 z-[100]" style={{ backgroundColor: '#121212' }}>
      {/* 移动端：使用vw单位 */}
      <div className="flex justify-between items-center pl-[8vw] pr-[16vw] py-[11vw] md:hidden">
        {/* 左侧返回按钮和标题 */}
        <div className="flex items-center gap-[8vw]">
          <button
            onClick={handleBackClick}
            className="w-[32vw] h-[32vw] flex items-center justify-center"
          >
            <BackIcon />
          </button>
          <span className="text-white text-size-[16vw] font-medium">{title}</span>
        </div>

        {/* 右侧钱包连接按钮 */}
        <div>
          {isConnected ? (
            <button
              onClick={handleWalletClick}
              className="w-[90vw] h-[36vw] flex items-center gap-[4vw] bg-transparent border border-[#3D3D3D] rounded-[34vw] p-[9vw] hover:border-[#3D3D3D] transition-all"
            >
              <img src={binanceIcon} alt="BSC" className="w-[16vw] h-[16vw] object-contain" />
              <span className="text-white text-size-[13vw] font-medium">{formatAddress(account, 3, 3)}</span>
              <img src={downIcon} alt="Down" className="w-[16vw] h-[16vw] object-contain" />
            </button>
          ) : (
            <button
              onClick={handleWalletClick}
              disabled={isConnecting}
              className="w-[100vw] h-[34vw] bg-white text-black text-size-[15vw] font-semibold rounded-[34vw] flex items-center justify-center hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isConnecting ? t('wallet.connecting') : t('common.connect_wallet')}
            </button>
          )}
        </div>
      </div>

      {/* 平板端和PC端：使用固定px单位 */}
      <div className="hidden md:flex md:justify-between md:items-center md:pl-2 md:pr-4 md:py-3">
        {/* 左侧返回按钮和标题 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackClick}
            className="w-8 h-8 flex items-center justify-center"
          >
            <BackIcon />
          </button>
          <span className="text-white text-base font-medium">{title}</span>
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
              disabled={isConnecting}
              className="w-32 h-8 bg-white text-black text-sm font-semibold rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isConnecting ? t('wallet.connecting') : t('common.connect_wallet')}
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

export default SecondaryHeader;
