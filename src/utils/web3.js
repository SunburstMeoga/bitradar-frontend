import Web3 from 'web3';

// 获取环境变量
const getChainConfig = () => {
  return {
    chainId: import.meta.env.VITE_BSC_CHAIN_ID,
    chainName: import.meta.env.VITE_BSC_CHAIN_NAME,
    rpcUrl: import.meta.env.VITE_BSC_RPC_URL,
    blockExplorer: import.meta.env.VITE_BSC_BLOCK_EXPLORER,
    currencyName: import.meta.env.VITE_BSC_CURRENCY_NAME,
    currencySymbol: import.meta.env.VITE_BSC_CURRENCY_SYMBOL,
    currencyDecimals: parseInt(import.meta.env.VITE_BSC_CURRENCY_DECIMALS),
  };
};

// 检查是否安装了MetaMask
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// 连接钱包
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    
    const web3 = new Web3(window.ethereum);
    const chainId = await web3.eth.getChainId();
    
    return {
      account: accounts[0],
      chainId: chainId.toString(),
      web3,
      provider: window.ethereum,
    };
  } catch (error) {
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
};

// 切换网络
export const switchNetwork = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const config = getChainConfig();
  const chainIdHex = `0x${parseInt(config.chainId).toString(16)}`;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError) {
    // 如果网络不存在，尝试添加网络
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: config.chainName,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.blockExplorer],
              nativeCurrency: {
                name: config.currencyName,
                symbol: config.currencySymbol,
                decimals: config.currencyDecimals,
              },
            },
          ],
        });
      } catch (addError) {
        throw new Error(`Failed to add network: ${addError.message}`);
      }
    } else {
      throw new Error(`Failed to switch network: ${switchError.message}`);
    }
  }
};

// 检查是否为正确的网络
export const isCorrectNetwork = (chainId) => {
  const config = getChainConfig();
  return chainId === config.chainId;
};

// 格式化地址
export const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// 监听账户变化
export const onAccountsChanged = (callback) => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// 监听网络变化
export const onChainChanged = (callback) => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('chainChanged', callback);
  }
};

// 移除监听器
export const removeListeners = () => {
  if (isMetaMaskInstalled()) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};
