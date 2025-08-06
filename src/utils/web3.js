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

// 连接钱包（完整流程：检查网络 -> 切换/添加网络 -> 连接账户）
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('请安装MetaMask钱包');
  }

  try {
    // 1. 首先请求连接账户
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('未找到钱包账户');
    }

    // 2. 检查当前网络
    const web3 = new Web3(window.ethereum);
    const currentChainId = await web3.eth.getChainId();
    const config = getChainConfig();

    // 3. 如果网络不正确，尝试切换
    if (!isCorrectNetwork(currentChainId.toString())) {
      await switchNetwork();
      // 切换后重新获取chainId
      const newChainId = await web3.eth.getChainId();
      if (!isCorrectNetwork(newChainId.toString())) {
        throw new Error('网络切换失败，请手动切换到正确的网络');
      }
    }

    // 4. 返回连接结果
    const finalChainId = await web3.eth.getChainId(); // 重新获取最新的chainId
    return {
      account: accounts[0],
      chainId: finalChainId.toString(), // 确保返回字符串，避免BigInt序列化问题
      web3,
      provider: window.ethereum,
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('用户拒绝连接钱包');
    }
    throw new Error(`连接钱包失败: ${error.message}`);
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
export const formatAddress = (address, start = 4, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end + 2) return address; // +2 for 0x prefix

  if (start === 3 && end === 3) {
    // 顶部栏显示：0x1..abc（0x + 1位 + .. + 3位）
    return `${address.slice(0, 3)}..${address.slice(-3)}`; // 0x1..abc
  } else {
    // 弹窗显示：前后各4位，中间用....
    return `${address.slice(0, 6)}....${address.slice(-4)}`; // 0x1234....abcd
  }
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

// 获取BNB余额
export const getBNBBalance = async (address) => {
  if (!address || !isMetaMaskInstalled()) return '0.000';

  try {
    const web3 = new Web3(window.ethereum);
    const balance = await web3.eth.getBalance(address);
    const balanceInBNB = web3.utils.fromWei(balance, 'ether');
    return parseFloat(balanceInBNB).toFixed(3);
  } catch (error) {
    console.error('获取BNB余额失败:', error);
    return '0.000';
  }
};

// 自动重连钱包（页面刷新时调用）
export const autoReconnectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    // 检查是否已经连接
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (accounts && accounts.length > 0) {
      // 获取当前网络
      const web3 = new Web3(window.ethereum);
      const currentChainId = await web3.eth.getChainId();

      return {
        account: accounts[0],
        chainId: currentChainId.toString(), // 确保返回字符串，避免BigInt序列化问题
        web3,
        provider: window.ethereum,
      };
    }

    return null;
  } catch (error) {
    console.error('自动重连失败:', error);
    return null;
  }
};
