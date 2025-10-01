import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService, userService, membershipService } from '../services';

// Web3 Store - 暂时禁用devtools和persist来解决BigInt序列化问题
export const useWeb3Store = create(
  // devtools(
    // persist(
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
      })
    // {
    //   name: 'web3-store',
    // }
  // )
);

// 认证 Store
export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // 状态
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,

        // 动作
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        setLoading: (isLoading) => set({ isLoading }),

        // 登录
        login: async (account, customMessage = null) => {
          set({ isLoading: true });
          try {
            const result = await authService.web3Login(account, customMessage);

            if (result.success) {
              set({
                isAuthenticated: true,
                user: result.user,
                token: result.token,
                isLoading: false
              });
              return result;
            }

            throw new Error('登录失败');
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        // 登出
        logout: () => {
          authService.logout();
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false
          });
        },

        // 检查登录状态
        checkAuth: () => {
          const isLoggedIn = authService.isLoggedIn();
          const token = authService.getCurrentToken();

          if (isLoggedIn && token) {
            set({
              isAuthenticated: true,
              token
            });
            return true;
          } else {
            set({
              isAuthenticated: false,
              user: null,
              token: null
            });
            return false;
          }
        },

        // 重置状态
        reset: () => set({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false
        }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          token: state.token
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// 用户数据 Store
export const useUserStore = create(
  devtools(
    (set, get) => ({
      // 状态
      profile: null,
      balance: null,
      stats: null,
      orders: [],
      membershipInfo: null,
      membershipConfig: null,
      isLoading: false,

      // 动作
      setProfile: (profile) => set({ profile }),
      setBalance: (balance) => set({ balance }),
      setStats: (stats) => set({ stats }),
      setOrders: (orders) => set({ orders }),
      setMembershipInfo: (membershipInfo) => set({ membershipInfo }),
      setMembershipConfig: (membershipConfig) => set({ membershipConfig }),
      setLoading: (isLoading) => set({ isLoading }),

      // 获取用户完整信息
      fetchUserInfo: async () => {
        set({ isLoading: true });
        try {
          const result = await userService.getFullUserInfo();

          if (result.success) {
            set({
              profile: result.data.profile,
              balance: result.data.balance,
              stats: result.data.stats,
              isLoading: false
            });
            return result;
          }

          throw new Error('获取用户信息失败');
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 获取用户资料
      fetchProfile: async () => {
        try {
          const result = await userService.getProfile();

          if (result.success) {
            set({ profile: result.data });
            console.log('✅ 用户资料获取成功:', result.data);
            return result;
          }

          throw new Error('获取用户资料失败');
        } catch (error) {
          console.error('❌ 获取用户资料失败:', error);
          throw error;
        }
      },

      // 获取用户余额
      fetchBalance: async () => {
        try {
          const result = await userService.getBalance();

          if (result.success) {
            // 处理新的余额数据结构
            const balanceData = result.data;

            // 如果有balances数组，转换为更易用的格式
            if (balanceData.balances && Array.isArray(balanceData.balances)) {
              const balanceMap = {};
              balanceData.balances.forEach(balance => {
                balanceMap[balance.token_symbol] = {
                  available: balance.available_balance,
                  frozen: balance.frozen_balance,
                  total: balance.total_balance
                };
              });

              // 保存原始数据和转换后的数据
              set({
                balance: {
                  ...balanceData,
                  balanceMap // 添加便于使用的映射
                }
              });
            } else {
              set({ balance: balanceData });
            }

            return result;
          }

          throw new Error('获取余额失败');
        } catch (error) {
          throw error;
        }
      },

      // 获取订单历史
      fetchOrders: async (page = 1, limit = 20, betTokenSymbol = 'all', append = false) => {
        try {
          const result = await userService.getOrders(page, limit, betTokenSymbol);

          if (result.success) {
            if (append) {
              set(state => ({
                orders: [...state.orders, ...result.data]
              }));
            } else {
              set({ orders: result.data });
            }
            return result;
          }

          throw new Error('获取订单历史失败');
        } catch (error) {
          throw error;
        }
      },

      // 获取会员配置
      fetchMembershipConfig: async () => {
        try {
          const result = await membershipService.getConfig();

          if (result.success) {
            set({ membershipConfig: result.data });
            console.log('✅ 会员配置获取成功:', result.data);
            return result;
          }

          throw new Error('获取会员配置失败');
        } catch (error) {
          console.error('❌ 获取会员配置失败:', error);
          throw error;
        }
      },

      // 获取会员信息
      fetchMembershipInfo: async () => {
        try {
          const result = await membershipService.getMembershipInfo();

          if (result.success) {
            set({ membershipInfo: result.data });
            console.log('✅ 会员信息获取成功:', result.data);
            return result;
          }

          throw new Error('获取会员信息失败');
        } catch (error) {
          console.error('❌ 获取会员信息失败:', error);
          throw error;
        }
      },

      // 执行会员升级
      upgradeMembership: async (membershipType) => {
        try {
          const result = await membershipService.upgradeMembership(membershipType);

          if (result.success) {
            // 升级成功后重新获取会员信息、余额和配置
            const membershipInfoPromise = get().fetchMembershipInfo();
            const balancePromise = get().fetchBalance();
            const membershipConfigPromise = get().fetchMembershipConfig();

            await Promise.all([membershipInfoPromise, balancePromise, membershipConfigPromise]);

            console.log('✅ 会员升级成功，所有数据已刷新:', result.data);
            return result;
          }

          throw new Error('会员升级失败');
        } catch (error) {
          console.error('❌ 会员升级失败:', error);
          throw error;
        }
      },

      // 重置状态
      reset: () => set({
        profile: null,
        balance: null,
        stats: null,
        orders: [],
        membershipInfo: null,
        membershipConfig: null,
        isLoading: false
      }),
    }),
    {
      name: 'user-store',
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
