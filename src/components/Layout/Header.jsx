import { useTranslation } from 'react-i18next';
import { useWeb3Store } from '../../store';
import { connectWallet, formatAddress } from '../../utils/web3';
import LanguageSelector from '../LanguageSelector';

const Header = () => {
  const { t } = useTranslation();
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
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">BitRadar</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {/* Wallet Connection */}
            <div>
              {isConnected ? (
                <div className="bg-primary text-black px-4 py-2 rounded-lg font-medium">
                  {formatAddress(account)}
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isConnecting ? t('wallet.connecting') : t('common.connect_wallet')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
