import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Web3 Store
export const useWeb3Store = create(
  devtools(
    (set, get) => ({
      // 状态
      account: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      web3: null,
      provider: null,
      
      // 动作
      setAccount: (account) => set({ account }),
      setChainId: (chainId) => set({ chainId }),
      setIsConnected: (isConnected) => set({ isConnected }),
      setIsConnecting: (isConnecting) => set({ isConnecting }),
      setWeb3: (web3) => set({ web3 }),
      setProvider: (provider) => set({ provider }),
      
      // 重置状态
      reset: () => set({
        account: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        web3: null,
        provider: null,
      }),
    }),
    {
      name: 'web3-store',
    }
  )
);

// App Store
export const useAppStore = create(
  devtools(
    (set, get) => ({
      // 状态
      theme: 'light',
      language: 'en',
      loading: false,
      
      // 动作
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'app-store',
    }
  )
);
