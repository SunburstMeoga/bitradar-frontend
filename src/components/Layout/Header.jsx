import { useWeb3Store } from '../../store';
import { connectWallet, formatAddress } from '../../utils/web3';
import logoImg from '../../assets/images/logo.png';
import binanceIcon from '../../assets/icons/binance.png';
import downIcon from '../../assets/icons/down.png';

const Header = () => {
  const { account, isConnected, isConnecting, setAccount, setIsConnected, setIsConnecting } = useWeb3Store();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await connectWallet();
      setAccount(result.account);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header className="w-full sticky top-0 z-[100]" style={{ backgroundColor: '#121212' }}>
      <div className="flex justify-between items-center px-[16vw] py-[11vw]">
        {/* 左侧Logo */}
        <div>
          <img src={logoImg} alt="BitRadar" className="w-[104vw] h-[24vw] object-contain" />
        </div>

        {/* 右侧钱包连接按钮 */}
        <div>
          {isConnected ? (
            <button className="flex items-center gap-[8vw] bg-transparent border border-[#121212] rounded-[4vw] p-[9vw] hover:border-[#c5ff33] transition-all">
              <img src={binanceIcon} alt="BSC" className="w-[16vw] h-[16vw] object-contain" />
              <span className="text-white text-size-[13vw] font-medium">{formatAddress(account)}</span>
              <img src={downIcon} alt="Down" className="w-[16vw] h-[16vw] object-contain" />
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-[130vw] h-[34vw] bg-white text-black text-size-[15vw] font-semibold rounded-[34vw] flex items-center justify-center hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isConnecting ? '连接中...' : '连接钱包'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
