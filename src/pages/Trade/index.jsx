import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import useViewportHeight from '../../hooks/useViewportHeight';
import { useApiCall } from '../../hooks/useApiCall';
import { useAuthStore, useUserStore, useWeb3Store } from '../../store';
import { safeParseFloat, formatNumber } from '../../utils/format';
import { orderService, tokenService, networkService } from '../../services';
import { connectWallet } from '../../utils/web3';
import Modal from '../../components/Modal';
import CaptchaModal from '../../components/Captcha/CaptchaModal.jsx';
import PriceChart from '../../components/PriceChart';
import pUSDIcon from '../../assets/icons/pUSD.png';
import upDownIcon from '../../assets/icons/up-down.png';
import buyUpIcon from '../../assets/icons/buy-up.png';
import buyDownIcon from '../../assets/icons/buy-down.png';
import timeIcon from '../../assets/icons/time.png';
import toast from 'react-hot-toast';
import sliderIcon from '../../assets/icons/slider.png';

const Trade = () => {
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuthStore();
const { balance, profile, fetchBalance, fetchProfile, fetchMembershipInfo, fetchMembershipConfig, fetchOrders } = useUserStore();
  const { setAccount, setChainId, setWeb3, setProvider, setIsConnected } = useWeb3Store();

  // 获取视口高度信息
  const { mainAreaHeight, isMobile } = useViewportHeight();

  // 用于测量页面中固定元素的真实高度
  const priceBarRef = useRef(null);
  const tradingCardRef = useRef(null);

  // 设置页面标题
  usePageTitle('trade');

  const [tradeAmount, setTradeAmount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0.00);
  const [priceChange, setPriceChange] = useState(0.00);
  const [selectedToken, setSelectedToken] = useState(() => {
    try {
      return localStorage.getItem('selectedTradeToken') || '';
    } catch (_) {
      return '';
    }
  });
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [userBets, setUserBets] = useState([]); // 用户下注记录
  const [isPlacingBet, setIsPlacingBet] = useState(false); // 下注加载状态
  const [tokenOptions, setTokenOptions] = useState([]); // 可选择的币种列表
  const [isLoadingTokens, setIsLoadingTokens] = useState(true); // 代币列表加载状态
  const [isConnecting, setIsConnecting] = useState(false); // 连接钱包状态
  // 订单配置（手续费、下注区间等）
  const [orderConfigs, setOrderConfigs] = useState(null);
  // 验证码相关状态
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [isCaptchaRequired, setIsCaptchaRequired] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isPostSuccessCooldown, setIsPostSuccessCooldown] = useState(false);
  // 自身奖励进度
  const [estimatedSelfReward, setEstimatedSelfReward] = useState(null);
  const [claimCountToday, setClaimCountToday] = useState(null);

  // 刷新自身奖励进度（订单结算后需要再次获取最新数据）
  const refreshSelfRewardProgress = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await networkService.getSelfRewardProgress();
      if (res.success && res.data) {
        try {
          setEstimatedSelfReward(res.data.estimated_self_reward);
          setClaimCountToday(res.data.claim_count_today);
        } catch (_) {}
      }
    } catch (err) {
      console.warn('⚠️ 获取自身奖励进度失败:', err);
    }
  }, [isAuthenticated]);

  // 计算PriceChart的动态高度：填满可视区剩余高度（基于真实渲染尺寸）
  const calculateChartHeight = () => {
    // 若 mainAreaHeight 尚未就绪，给出合理的默认值以避免闪烁
    const available = mainAreaHeight || window.innerHeight || 0;

    // 工具：计算包含 margin 的元素总高度
    const totalWithMargins = (el) => {
      if (!el) return 0;
      const rectHeight = el.getBoundingClientRect()?.height || 0;
      const styles = window.getComputedStyle(el);
      const mt = parseFloat(styles.marginTop) || 0;
      const mb = parseFloat(styles.marginBottom) || 0;
      return rectHeight + mt + mb;
    };

    // 真实测量价格栏与交易卡片高度（含外边距）
    const priceBarTotal = totalWithMargins(priceBarRef.current);
    const tradingCardTotal = totalWithMargins(tradingCardRef.current);

    const fixedElementsHeight = priceBarTotal + tradingCardTotal + 34;

    // 计算图表高度，保证最小值，确保其它元素正常显示
    const chartHeight = Math.max(available - fixedElementsHeight, isMobile ? 200 : 250);
    return `${Math.round(chartHeight)}px`;
  };

  const dynamicChartHeight = calculateChartHeight();

  // 使用 ref 来跟踪前一个价格，避免循环依赖
  const previousPriceRef = useRef(67234.56);
  const balanceFetchedRef = useRef(false);
  const pendingDirectionRef = useRef(null);
  const recentPricesRef = useRef([]);
  const amountInputRef = useRef(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 监听移动端键盘打开/关闭（基于 visualViewport）
  useEffect(() => {
    // 获取订单配置
    const fetchOrderConfigs = async () => {
      try {
        const res = await orderService.getOrderConfigs();
        if (res && res.success) {
          setOrderConfigs(res.data);
          console.log('✅ 订单配置已加载:', res.data);
        }
      } catch (error) {
        console.error('❌ 获取订单配置失败:', error);
      }
    };
    fetchOrderConfigs();

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // 当可视视口高度显著缩小时，视为键盘打开
      const keyboardOpen = vv.height < window.innerHeight - 120;
      setIsKeyboardOpen(keyboardOpen);
      if (keyboardOpen) {
        try {
          amountInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {}
      }
    };

    vv.addEventListener('resize', handleResize);
    // 初始化检测一次
    handleResize();

    return () => {
      vv.removeEventListener('resize', handleResize);
    };
  }, []);

  // 使用防重复调用的API hook
  const safeFetchBalance = useApiCall(fetchBalance, []);

  // 跟踪待结算订单ID，订单结算后刷新余额
  const pendingOrderIdsRef = useRef(new Set());
  const visibleBetIdsRef = useRef(new Set());

  const pollPendingOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    const ids = Array.from(visibleBetIdsRef.current || new Set());
    if (ids.length === 0) return;
    try {
      let hasAnySettled = false;
      for (const id of ids) {
        try {
          const orderDetail = await orderService.getOrder(id);
          if (orderDetail.success && orderDetail.data) {
            const orderData = orderDetail.data;
            if (orderData.status !== 'PENDING') {
              hasAnySettled = true;
              setUserBets(prev =>
                prev.map(b => b.id === id ? {
                  ...b,
                  settlementPrice: parseFloat(orderData.exit_price || '0'),
                  isWin: orderData.status === 'WIN',
                  profit: parseFloat(orderData.profit_loss || '0'),
                  status: 'settled',
                  orderDetail: orderData
                } : b)
              );
              // 结算后从可见集合移除，避免继续轮询
              try { visibleBetIdsRef.current.delete(id); } catch (_) {}
            }
          }
        } catch (error) {
          console.error('❌ 查询订单详情失败:', id, error);
        }
      }
      if (hasAnySettled) {
        if (typeof fetchBalance === 'function') {
          await fetchBalance();
        }
        // 订单结算后，刷新自身奖励进度
        await refreshSelfRewardProgress();
      }
    } catch (error) {
      console.error('❌ 轮询订单状态失败:', error);
    }
  }, [isAuthenticated, fetchBalance, refreshSelfRewardProgress]);

  // 启动轮询：每5秒检查一次订单状态，若有结算则刷新余额
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      pollPendingOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pollPendingOrders]);

  // 在认证或切换代币后立即执行一次检查以初始化待结算集合
  useEffect(() => {
    if (isAuthenticated) {
      pollPendingOrders();
    } else {
      pendingOrderIdsRef.current = new Set();
    }
  }, [isAuthenticated, selectedToken, pollPendingOrders]);



  // 获取当前选中币种的余额
  const getCurrentTokenBalance = () => {
    if (!balance) return 0;

    // 根据代币symbol映射到对应的余额字段
    const balanceFieldMap = {
      'USDT': 'usdt_balance',
      'USDR': 'usdr_balance',
      'LUSD': 'lusd_balance',
      'LuckyUSD': 'lusd_balance', // LuckyUSD对应LUSD
      'Rocket': 'rocket_balance'
    };

    const balanceField = balanceFieldMap[selectedToken];
    if (balanceField && balance[balanceField]) {
      return safeParseFloat(balance[balanceField], 0);
    }

    // 如果没有找到对应的余额字段，返回0
    console.warn(`⚠️ 未找到代币 ${selectedToken} 对应的余额字段`);
    return 0;
  };

  const userBalance = getCurrentTokenBalance();
  const isUp = priceChange > 0;
  const isButtonsDisabled = tradeAmount === 0 || isPlacingBet || userBalance < tradeAmount || isPostSuccessCooldown;

  // 滑动条是否禁用（余额 <= 0）
  const isSliderDisabled = userBalance <= 0;

  // 确保滑动条计算的安全性
  const safeUserBalance = Math.max(userBalance, 1); // 最小值为1，避免除零错误

  // 获取可用于下注的代币列表
  const fetchBetTokens = async () => {
    try {
      setIsLoadingTokens(true);
      console.log('🪙 开始获取代币列表...');
      console.log('🪙 API基础URL:', import.meta.env.VITE_API_BASE_URL);

      const result = await tokenService.getBetTokens();
      console.log('🪙 tokenService.getBetTokens() 返回结果:', result);

      if (result.success && result.data) {
        // 过滤只显示可下注的代币，并转换为UI需要的格式
        const formattedTokens = result.data
          .filter(token => token.is_bet_enabled === true && ['USDT', 'LUSD', 'LuckyUSD'].includes(token.symbol)) // 仅保留USDT与LUSD
          .map(token => ({
            name: token.symbol,
            displayName: token.name,
            icon: pUSDIcon, // 暂时使用统一图标
            decimals: token.decimals,
            isActive: token.is_active,
            isBetEnabled: token.is_bet_enabled,
            isSettlementEnabled: token.is_settlement_enabled,
            // 保存原始数据
            originalData: token
          }));

        setTokenOptions(formattedTokens);
        console.log('🪙 代币列表获取成功 (已过滤可下注代币):', formattedTokens);

        // 设置默认选中的代币
        if (formattedTokens.length > 0) {
          // 优先使用本地存储的币种选择
          let stored = '';
          try { stored = localStorage.getItem('selectedTradeToken') || ''; } catch (_) {}
          const storedExists = stored && formattedTokens.some(token => token.name === stored);
          if (storedExists) {
            setSelectedToken(stored);
            console.log('🪙 使用本地存储的选中代币:', stored);
          } else {
            // 如果当前没有选中代币，或者选中的代币不在新列表中，选择第一个代币
            const currentTokenExists = selectedToken && formattedTokens.some(token => token.name === selectedToken);
            if (!currentTokenExists) {
              setSelectedToken(formattedTokens[0].name);
              console.log('🪙 设置默认选中代币:', formattedTokens[0].name);
            }
          }
        }

        if (result.isFallback) {
          console.warn('🪙 使用了fallback代币列表');
        }
      }
    } catch (error) {
      console.error('🪙 获取代币列表失败:', error);
      console.error('🪙 错误详情:', {
        message: error.message,
        response: error.response,
        request: error.request
      });
      // 如果获取失败，使用默认列表（与API数据结构保持一致）
      const defaultTokens = [
        {
          name: 'USDT',
          displayName: 'Tether USD',
          icon: pUSDIcon,
          decimals: 8,
          isActive: true,
          isBetEnabled: true,
          isSettlementEnabled: true
        },

        {
          name: 'LUSD',
          displayName: 'LuckyUSD',
          icon: pUSDIcon,
          decimals: 8,
          isActive: true,
          isBetEnabled: true,
          isSettlementEnabled: false
        }
      ];
      setTokenOptions(defaultTokens);

      // 设置默认选中的代币
      if (defaultTokens.length > 0) {
        // 优先使用本地存储的选中代币
        let stored = '';
        try { stored = localStorage.getItem('selectedTradeToken') || ''; } catch (_) {}
        const storedExists = stored && defaultTokens.some(token => token.name === stored);
        if (storedExists) {
          setSelectedToken(stored);
          console.log('🪙 使用本地存储，设置默认选中代币:', stored);
        } else if (!selectedToken) {
          setSelectedToken(defaultTokens[0].name);
          console.log('🪙 使用fallback，设置默认选中代币:', defaultTokens[0].name);
        }
      }
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // 处理滑块变化
  const handleSliderChange = (e) => {
    // 如果滑动条被禁用，不处理变化
    if (isSliderDisabled) return;

    const value = parseFloat(e.target.value);
    setSliderValue(value);
    const floored = Math.floor(value);
    setTradeAmount(floored);
    setInputValue(String(floored));
  };

  // 处理输入框变化
  const handleInputChange = (e) => {
    // 如果滑动条被禁用，不处理变化
    if (isSliderDisabled) return;

    // 只允许输入整数，过滤掉小数点和非数字字符
    const raw = e.target.value;
    let sanitized = String(raw).replace(/[^\d]/g, '');

    // 允许输入为空，直接显示为空并重置数值
    if (sanitized === '') {
      setInputValue('');
      setTradeAmount(0);
      setSliderValue(0);
      return;
    }

    // 不允许前导0，移除所有前导0
    sanitized = sanitized.replace(/^0+/, '');

    // 如果移除前导0后为空，视为清空
    if (sanitized === '') {
      setInputValue('');
      setTradeAmount(0);
      setSliderValue(0);
      return;
    }

    const value = parseInt(sanitized, 10);
    const max = Math.floor(userBalance);
    const min = userBalance >= 1 ? 1 : 0; // 余额>=1时，最小值为1，否则为0
    const clampedValue = Math.min(Math.max(value, min), max);
    setTradeAmount(clampedValue);
    setSliderValue(clampedValue);
    setInputValue(String(clampedValue));
  };

  // 处理币种选择框点击
  const handleTokenSelectorClick = () => {
    setIsTokenModalOpen(true);
  };

  // 处理币种选择
  const handleTokenSelect = (tokenName) => {
    setSelectedToken(tokenName);
    try {
      localStorage.setItem('selectedTradeToken', tokenName);
    } catch (_) {}
    setIsTokenModalOpen(false);

    // 币种切换时重置滑动条值，使用统一的余额获取逻辑
    let newBalance = 0;
    if (balance) {
      // 根据代币symbol映射到对应的余额字段
      const balanceFieldMap = {
        'USDT': 'usdt_balance',
        'USDR': 'usdr_balance',
        'LUSD': 'lusd_balance',
        'LuckyUSD': 'lusd_balance', // LuckyUSD对应LUSD
        'Rocket': 'rocket_balance'
      };

      const balanceField = balanceFieldMap[tokenName];
      if (balanceField && balance[balanceField]) {
        newBalance = safeParseFloat(balance[balanceField], 0);
      }
    }

    console.log(`🪙 切换到代币 ${tokenName}，余额: ${newBalance}`);

    if (newBalance <= 0) {
      // 余额为0时，滑动条和交易金额都设为0
      setSliderValue(0);
      setTradeAmount(0);
      setInputValue('0');
    } else if (newBalance >= 1) {
      // 余额>=1时，设置默认值为1
      setSliderValue(1);
      setTradeAmount(1);
      setInputValue('1');
    } else {
      // 余额在0-1之间时，设置为0（因为只能输入整数）
      setSliderValue(0);
      setTradeAmount(0);
      setInputValue('0');
    }
  };

  // 关闭币种选择弹窗
  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false);
  };

  // 连接钱包并登录
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      // 1. 连接钱包
      const result = await connectWallet();
      setAccount(result.account);
      setChainId(result.chainId);
      setWeb3(result.web3);
      setProvider(result.provider);
      setIsConnected(true);

      // 2. 进行Web3登录认证
      try {
        await login(result.account);
        toast.success(t('toast.wallet_connected'));

        // 3. 获取用户信息、余额与会员数据
        try {
          await Promise.all([
            fetchProfile(),
            fetchBalance(),
            fetchMembershipInfo(),
            fetchMembershipConfig()
          ]);
        } catch (fetchError) {
          console.error('获取用户数据失败:', fetchError);
        }
      } catch (authError) {
        console.error('Web3登录失败:', authError);
        toast.error(t('toast.login_failed', { message: authError.message }));
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      toast.error(t('toast.wallet_connect_failed', { message: error.message }));
    } finally {
      setIsConnecting(false);
    }
  };

  // 验证码通过后继续下注（参考 /test-captcha 逻辑：成功即关闭并继续流程）
  const handleCaptchaSuccess = () => {
    setIsCaptchaVerified(true);
    setIsCaptchaOpen(false);
    const dir = pendingDirectionRef.current;
    setIsCaptchaRequired(false);
    pendingDirectionRef.current = null;
    if (dir) {
      // 直接走下注内部流程，避免再次触发验证码判断导致闪烁
      setTimeout(() => {
        placeBetInternal(dir);
      }, 0);
    }
  };

  const handleCaptchaFail = () => {
    toast.error(t('captcha.fail'));
    // 保持弹窗开启，直到验证成功
  };

  // 处理用户下注
  // 下注内部流程：不做验证码判断，纯下注逻辑
  const placeBetInternal = async (direction) => {
    setIsPlacingBet(true);
    try {
      const now = Date.now();

      // 准备API请求数据 - 使用新的参数格式
      const orderData = {
        orderType: direction === 'up' ? 'CALL' : 'PUT', // up -> CALL, down -> PUT
        amount: tradeAmount, // 数字格式的下注金额
        entryPrice: currentPrice, // 数字格式的入场价格
        betTokenSymbol: selectedToken, // 使用当前选中的代币
        tradingPairSymbol: "BTCUSDT", // 交易对符号，去掉斜杠
        ratio: 1.8, // 固定比率，可以后续从配置或API获取
        frontendSubmitTime: now // 前端提交时间戳
      };

      console.log('🎯 发送下注请求 (新格式):', orderData);
      console.log('🎯 当前认证状态:', isAuthenticated);
      const userBalance = getCurrentTokenBalance();
      console.log('🎯 当前用户余额:', userBalance);
      console.log('🎯 选中的代币:', selectedToken);
      console.log('🎯 交易金额:', tradeAmount);

      // 验证订单数据
      const validationErrors = [];
      if (!orderData.amount || orderData.amount < 1.0) {
        validationErrors.push('下注金额必须大于等于1.00');
      }
      // 检查下注金额是否在配置区间内
      try {
        const minAmt = orderConfigs ? parseFloat(orderConfigs.min_bet_amount) : undefined;
        const maxAmt = orderConfigs ? parseFloat(orderConfigs.max_bet_amount) : undefined;
        if (Number.isFinite(minAmt) && Number.isFinite(maxAmt)) {
          if (orderData.amount < minAmt || orderData.amount > maxAmt) {
            toast.error(t('toast.bet_amount_range', { min: minAmt, max: maxAmt }));
            return;
          }
        } else if (Number.isFinite(minAmt) && orderData.amount < minAmt) {
          toast.error(t('toast.bet_amount_min', { min: minAmt }));
          return;
        } else if (Number.isFinite(maxAmt) && orderData.amount > maxAmt) {
          toast.error(t('toast.bet_amount_max', { max: maxAmt }));
          return;
        }
      } catch (_) {}
      if (!orderData.betTokenSymbol) {
        validationErrors.push('必须选择下注代币');
      }
      if (!orderData.orderType || !['CALL', 'PUT'].includes(orderData.orderType)) {
        validationErrors.push('订单类型必须是CALL或PUT');
      }
      if (!orderData.tradingPairSymbol) {
        validationErrors.push('交易对不能为空');
      }
      if (!orderData.entryPrice || orderData.entryPrice <= 0) {
        validationErrors.push('入场价格必须大于0');
      }
      if (!orderData.ratio || orderData.ratio <= 0) {
        validationErrors.push('比率必须大于0');
      }

      if (validationErrors.length > 0) {
        console.error('❌ 订单数据验证失败:', validationErrors);
        toast.error(t('validation_failed'));
        return;
      }

      // 调用API创建订单
      const result = await orderService.createOrder(orderData);

      if (result.success) {
        // API调用成功，显示成功消息
        toast.success(t('success'));

        // 创建本地下注记录（用于图表显示）
        // 适配新的API响应格式
        const responseOrderData = result.data.order || result.data;
        
        // 确保订单ID被正确保存
        const orderId = responseOrderData.id;
        if (!orderId) {
          console.error('❌ 订单创建成功但缺少订单ID:', responseOrderData);
          toast.error(t('validation_failed'));
          return;
        }

        console.log('✅ 订单创建成功，订单ID:', orderId);

        const newBet = {
          id: orderId, // 确保使用API返回的订单ID
          direction,
          amount: tradeAmount,
          price: parseFloat(responseOrderData.entryPrice || responseOrderData.entry_price) || currentPrice,
          timestamp: new Date(responseOrderData.created_at || responseOrderData.createdAt).getTime() || now,
          settlementTime: new Date(responseOrderData.expires_at || responseOrderData.expiresAt).getTime() || (now + 60000),
          settlementPrice: null,
          isWin: null,
          profit: null,
          status: 'active', // 初始状态为活跃
          // 当前交易对（用于持久化和切换后过滤显示）
          pair: orderData.tradingPairSymbol,
          // 保存API返回的完整数据
          apiData: responseOrderData
        };

        setUserBets(prev => {
          const next = [...prev, newBet];
          return next;
        });
        console.log('✅ 下注记录已保存:', newBet);

        // 重置交易金额（先重置为0，随后刷新余额，触发默认1的设置）
        setTradeAmount(0);
        setSliderValue(0);
        setInputValue('0');

        // 刷新用户余额（await，确保后续逻辑完成后再触发验证码）
        if (fetchBalance) {
          console.log('🔄 下注成功，刷新余额...');
          try {
            await fetchBalance();
            console.log('✅ 余额刷新完成');
          } catch (error) {
            console.error('❌ 余额刷新失败:', error);
          }
        }

        // 下单成功后开启1.5秒冷却，防止恶意快速下单
        setIsPostSuccessCooldown(true);
        setTimeout(() => setIsPostSuccessCooldown(false), 1500);

        // 在所有成功后的逻辑完成后，按10%概率弹出验证码（不影响本次下注）
        // const shouldShowCaptchaAfterSuccess = Math.random() < 0.1; //验证弹窗出现概率 0.1
        const shouldShowCaptchaAfterSuccess = false //不出验证弹窗
        if (shouldShowCaptchaAfterSuccess) {
          // 标记后续下注需通过安全验证
          setIsCaptchaRequired(true);
          setIsCaptchaOpen(true);
          toast(t('toast.captcha_title'));
        }
      }
    } catch (error) {
      console.error('❌ 下注失败:', error);

      // 显示错误消息
      const errorMessage = error.message || t('retry');
      toast.error(errorMessage);
    } finally {
      setIsPlacingBet(false);
      // 单次下注结束后重置验证状态，以便下次继续按10%概率拦截
      setIsCaptchaVerified(false);
    }
  };

  // 公开的下注入口：包含前置校验与验证码拦截
  const handlePlaceBet = async (direction) => {
    console.log('🎯 开始下注流程，参数检查:', {
      tradeAmount,
      currentPrice,
      isPlacingBet,
      direction,
      selectedToken,
      isAuthenticated
    });

    if (tradeAmount === 0 || !currentPrice || isPlacingBet) {
      console.log('❌ 下注条件不满足:', {
        tradeAmountZero: tradeAmount === 0,
        noPriceData: !currentPrice,
        isPlacingBet
      });
      return;
    }

    // 点击后立即显示 loading，然后进行未完成订单检查
    setIsPlacingBet(true);
    try {
      const res = await fetchOrders(1, 120, selectedToken || 'all', false, 'pending');
      if (res && res.success) {
        const orders = res.data || [];
        const hasUnfinished = orders.some(order => order?.profit_loss === "0" || order?.status === 'PENDING');
        if (hasUnfinished) {
          toast.error(t('trade.previous_order_unfinished'));
          setIsPlacingBet(false);
          return;
        }
      }
    } catch (err) {
      console.error('❌ 检查未完成订单失败:', err);
      // 不中断下注流程，继续执行现有逻辑
    }

    // 检查用户是否已认证
    if (!isAuthenticated) {
      console.log('❌ 用户未认证');
      toast.error(t('wallet_connect_required'));
      setIsPlacingBet(false);
      return;
    }

    // 检查是否有有效的token
    const currentToken = localStorage.getItem('authToken');
    console.log('🔐 当前认证token:', currentToken ? `${currentToken.substring(0, 20)}...` : '无');

    if (!currentToken) {
      console.log('❌ 没有认证token');
      toast.error(t('wallet.not_authenticated'));
      setIsPlacingBet(false);
      return;
    }

    // 检查选中的代币
    if (!selectedToken || selectedToken === '') {
      toast.error(t('trade.select_token'));
      setIsPlacingBet(false);
      return;
    }

    // 检查余额是否足够
    const userBalance = getCurrentTokenBalance();
    if (userBalance < tradeAmount) {
      toast.error(t('exchange.insufficient_balance'));
      setIsPlacingBet(false);
      return;
    }

    // 验证码拦截：仅在存在待验证要求且未通过时拦截（改为下注成功后触发）
    const shouldGateByCaptcha = isCaptchaRequired && !isCaptchaVerified;
    if (shouldGateByCaptcha) {
      setIsCaptchaOpen(true);
      pendingDirectionRef.current = direction;
      toast(t('toast.captcha_title'));
      setIsPlacingBet(false);
      return;
    }

    // 通过拦截后，执行内部流程
    await placeBetInternal(direction);
  };

  // 处理价格更新的回调函数，使用useCallback稳定引用
  const handlePriceUpdate = useCallback((priceData) => {
    const newPrice = priceData.price;
    const prevPrice = previousPriceRef.current;
    const currentTime = Date.now();

    // 记录最近价格序列用于按结算时间回溯定位价格点
    try {
      const ts = priceData.timestamp;
      if (typeof ts === 'number' && Number.isFinite(ts)) {
        const buf = recentPricesRef.current;
        buf.push({ timestamp: ts, price: newPrice });
        if (buf.length > 600) buf.splice(0, buf.length - 600); // 保留最近约10分钟
      }
    } catch (_) {}

    // 更新当前价格
    setCurrentPrice(newPrice);

    // 基于60秒前价格计算涨跌幅
    const baseline = typeof priceData.price60sAgo === 'number' ? priceData.price60sAgo : null;
    if (baseline && baseline > 0) {
      const changePercent = ((newPrice - baseline) / baseline) * 100;
      setPriceChange(changePercent);
    }

    // 检查并处理到期的下注记录 - 使用新的订单详情API逻辑
    setUserBets(prev => {
      return prev.map(bet => {
        // 如果下注已经结算过，跳过
        if (bet.status === 'settled') return bet;

        // 检查是否到达结算时间
        if (currentTime >= bet.settlementTime) {
          // 使用订单详情API获取真实的结算状态
          const checkOrderStatus = async () => {
            try {
              if (!bet.id) {
                console.warn('⚠️ 订单缺少ID，无法查询详情:', bet);
                return bet;
              }

              console.log('🔍 查询订单详情:', bet.id);
              const orderDetail = await orderService.getOrder(bet.id);
              
              if (orderDetail.success && orderDetail.data) {
                const orderData = orderDetail.data;
                console.log('📋 订单详情:', orderData);

                 // 根据订单状态判断是否已结算
                 if (orderData.status === 'PENDING') {
                   // 订单仍在等待结算，保持临时亏样式
                   console.log('⏳ 订单仍在等待结算:', bet.id);
                   return { ...bet, isWin: false };
                 } else {
                   // 订单已结算，使用API返回的真实数据
                   const isWin = orderData.status === 'WIN';
                   const profit = parseFloat(orderData.profit_loss || '0');
                   const settlementPrice = parseFloat(orderData.exit_price || '0');

                   console.log('🎯 订单结算完成:', {
                     id: bet.id,
                     status: orderData.status,
                     isWin,
                     profit,
                     settlementPrice,
                     entryPrice: orderData.entry_price,
                     exitPrice: orderData.exit_price
                   });

                   return {
                     ...bet,
                     settlementPrice,
                     isWin,
                     profit,
                     status: 'settled',
                     // 保存完整的订单详情数据
                     orderDetail: orderData
                   };
                 }
              } else {
                console.error('❌ 获取订单详情失败:', orderDetail);
                return bet;
              }
            } catch (error) {
              console.error('❌ 查询订单详情出错:', error);
              return bet;
            }
          };

          // 异步执行订单状态检查
          checkOrderStatus().then(updatedBet => {
            if (updatedBet.status === 'settled') {
              // 如果订单已结算，更新状态
              setUserBets(prevBets => 
                prevBets.map(b => b.id === updatedBet.id ? updatedBet : b)
              );
              // 订单结算后刷新自身奖励进度
              networkService.getSelfRewardProgress()
                .then(res => {
                  if (res && res.success && res.data) {
                    try {
                      setEstimatedSelfReward(res.data.estimated_self_reward);
                      setClaimCountToday(res.data.claim_count_today);
                    } catch (_) {}
                  }
                })
                .catch(err => console.warn('⚠️ 获取自身奖励进度失败:', err));
            }
          });

          // 到期时立即临时标记为亏，并避免重复触发详情查询
          return { ...bet, isWin: false, _finalStatusCheckTriggered: true };
        }

        return bet;
      });
    });

    // 更新前一个价格的引用
    previousPriceRef.current = newPrice;
  }, []);

  // 获取代币列表
  useEffect(() => {
    fetchBetTokens();
  }, []); // 只在组件挂载时执行一次



  // 获取用户余额
  useEffect(() => {
    if (isAuthenticated && !balanceFetchedRef.current) {
      balanceFetchedRef.current = true;
      safeFetchBalance().catch(error => {
        console.error('获取余额失败:', error);
        balanceFetchedRef.current = false; // 失败时重置，允许重试
      });
    }
  }, [isAuthenticated]); // 移除 safeFetchBalance 依赖，避免循环依赖

  // 获取用户资料（包括总盈利等信息）
  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile().catch(error => {
        console.error('获取用户资料失败:', error);
      });
    }
  }, [isAuthenticated, profile, fetchProfile]);

  // 从服务器恢复订单为图表下注点（替代localStorage），并驱动后续轮询
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadOrdersToBets = async () => {
      try {
        const result = await fetchOrders(1, 100, selectedToken || 'all', false, 'all');
        if (result && result.success) {
          const orders = result.data || [];
          const nowTs = Date.now();
          const mapped = orders.map(order => {
            const isPending = order?.profit_loss === "0" || order?.status === 'PENDING';
            const createdTs = Date.parse(order?.created_at);
            const expiryTs = Date.parse(order?.expiry_time) || Date.parse(order?.expiry_at);
            return {
              id: order?.id,
              timestamp: Number.isFinite(createdTs) ? createdTs : Date.now(),
              settlementTime: Number.isFinite(expiryTs) ? expiryTs : (Number.isFinite(createdTs) ? createdTs + 60_000 : Date.now() + 60_000),
              price: safeParseFloat(order?.entry_price, 0),
              settlementPrice: isPending ? undefined : safeParseFloat(order?.exit_price, 0),
              status: isPending ? 'active' : 'settled',
              isWin: isPending ? ((Number.isFinite(expiryTs) && expiryTs <= nowTs) ? false : undefined) : (order?.status === 'WIN'),
              profit: isPending ? undefined : safeParseFloat(order?.profit_loss, 0),
              direction: order?.order_type === 'CALL' ? 'up' : 'down',
              orderDetail: order
            };
          });
          setUserBets(mapped);
        }
      } catch (error) {
        console.error('❌ 从服务器恢复下注点失败:', error);
      }
    };
    loadOrdersToBets();
  }, [isAuthenticated, selectedToken, fetchOrders]);


  // 移除通用的持久化effect，改为在新增下注或图表回传时写入

  // 监听余额变化和代币选择变化，输出调试信息
  useEffect(() => {
    if (selectedToken && balance) {
      const currentBalance = getCurrentTokenBalance();
      console.log(`💰 当前选中代币: ${selectedToken}, 余额: ${currentBalance}`);
      console.log('💰 完整余额数据:', balance);
    }
  }, [balance, selectedToken]); // 依赖余额数据和选中代币

  // 当余额数据更新时，设置滑动条默认值
  useEffect(() => {
    const currentBalance = getCurrentTokenBalance();

    if (currentBalance <= 0) {
      // 余额为0时，滑动条和交易金额都设为0
      setSliderValue(0);
      setTradeAmount(0);
      setInputValue('0');
    } else if (currentBalance >= 1 && tradeAmount === 0) {
      // 余额>=1且当前交易金额为0时，设置默认值为1
      setSliderValue(1);
      setTradeAmount(1);
      setInputValue('1');
    }
  }, [balance, selectedToken]); // 只依赖余额数据和选中的币种

  // 首次进入或认证后，获取自身奖励进度（estimated_self_reward / claim_count_today）
  useEffect(() => {
    refreshSelfRewardProgress();
  }, [refreshSelfRewardProgress]);

  // 接收图表可见下注点集合，但不再用它覆盖完整 userBets
  // 仅用于后续可能的分析/调试，保持完整历史以避免开盘点消失
  const handleVisibleUserBetsChange = useCallback((visibleBets) => {
    const ids = new Set(
      (visibleBets || []).filter(b => b && b.id && b.status !== 'settled').map(b => b.id)
    );
    visibleBetIdsRef.current = ids;
  }, []);



  return (
    <div className="flex flex-col pb-[86vw] md:pb-20" style={{ backgroundColor: '#121212' }}>
      {/* 价格信息栏 */}
      <div
        ref={priceBarRef}
        className="w-full h-[64vw] md:h-16 px-[16vw] md:px-4 flex items-center justify-between border-t border-b mt-[10vw] md:mt-3"
        style={{ borderColor: '#292929' }}
      >
        {/* 左侧：图片和文案 */}
        <div className="flex items-center gap-[8vw] md:gap-2">
          <img
            src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
            alt="BTC"
            className="w-[34vw] md:w-9 h-[34vw] md:h-9 object-contain"
          />
          <div className="h-[34vw] md:h-9 flex flex-col justify-between -mt-[7vw] md:mt-0">
            <p className="text-white text-size-[15vw] md:text-base font-semibold h-[18vw] md:h-auto">BTC-USD</p>
            {/* <p className="text-white text-size-[13vw] md:text-sm h-[15vw] md:h-auto">{t('trade.binary_options')}</p> */}
          </div>
        </div>

        {/* 右侧：价格趋势 */}
        <div className="h-[34vw] md:h-9 flex flex-col justify-between items-end -mt-[1vw] md:mt-0">
          <div className="text-white text-size-[15vw] md:text-base font-semibold h-[18vw] md:h-auto">
            {currentPrice.toFixed(2)}
          </div>
          <div className="flex items-center gap-[4vw] md:gap-1 h-[15vw] md:h-auto">
            {/* 三角形 */}
            <div
              className={`w-0 h-0 ${isUp ? 'triangle-up' : 'triangle-down'}`}
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: isUp ? `6px solid ${isUp ? '#00bc4b' : '#f5384e'}` : 'none',
                borderTop: !isUp ? `6px solid ${isUp ? '#00bc4b' : '#f5384e'}` : 'none',
              }}
            />
            <span
              className="text-size-[13vw] md:text-sm"
              style={{ color: isUp ? '#00bc4b' : '#f5384e' }}
            >
              {isUp ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

    
      {/* 价格图表 */}
      <div
        className='w-full mb-[10vw] md:mb-3'
        style={{ height: dynamicChartHeight }}
      >
        <PriceChart
          userBets={userBets}
          onPriceUpdate={handlePriceUpdate}
          onVisibleUserBetsChange={handleVisibleUserBetsChange}
          feeRate={(() => { try { return parseFloat(orderConfigs?.fee_rate) } catch (_) { return 0.03 } })()}
        />
      </div>

      {/* 交易卡片 */}
      <div ref={tradingCardRef} className="w-[375vw] md:w-full flex-shrink-0 flex flex-col items-center justify-center px-[16vw] md:px-4" style={{ marginBottom: isKeyboardOpen ? '20vh' : 0 }}>
        {/* 第一部分：Trade Amount */}
        <div
          className="w-[343vw] md:w-full h-[116vw] md:h-auto pt-[16vw] md:pt-4 pr-[16vw] md:pr-4 pb-[14vw] md:pb-4 pl-[16vw] md:pl-4 rounded-[12vw] md:rounded-lg"
          style={{ backgroundColor: '#1f1f1f' }}
        >
          {/* 第一行：标题和余额 */}
          <div className="flex justify-between items-center mb-[6vw] md:mb-2">
            <span className="text-white text-size-[13vw] md:text-sm">{t('trade.trade_amount')}</span>
            <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm">{t('trade.balance')}: {formatNumber(userBalance, 2)}</span>
          </div>

          {/* 第二行：输入框和按钮 */}
          <div className="w-full flex items-center mb-[6vw] md:mb-2">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                disabled={isSliderDisabled}
                pattern="[0-9]*"
                inputMode="numeric"
                className="w-full h-[40vw] md:h-10 bg-transparent border-none outline-none text-[#c5ff33] text-size-[34vw] md:text-2xl font-semibold"
                style={{ appearance: 'none' }}
                ref={amountInputRef}
                onFocus={() => {
                  // 输入框聚焦时，滚动到中间位置以避免被底部tabs遮挡
                  try {
                    amountInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } catch (_) {}
                }}
              />
            </div>
            <div className="w-[8vw] md:w-2 flex-shrink-0"></div>
            <div className="flex items-center gap-[8vw] md:gap-2 flex-shrink-0">
              <button
                type="button"
                className={`h-[34vw] md:h-8 rounded-[34vw] md:rounded-full px-[12vw] md:px-3 py-[8vw] md:py-2 text-size-[12vw] md:text-xs font-medium ${selectedToken === 'LUSD' ? 'bg-[#c5ff33] text-black' : 'bg-[#3d3d3d] text-white'}`}
                onClick={() => handleTokenSelect('LUSD')}
              >
                LUSD
              </button>
              <button
                type="button"
                className={`h-[34vw] md:h-8 rounded-[34vw] md:rounded-full px-[12vw] md:px-3 py-[8vw] md:py-2 text-size-[12vw] md:text-xs font-medium ${selectedToken === 'USDT' ? 'bg-[#c5ff33] text-black' : 'bg-[#3d3d3d] text-white'}`}
                onClick={() => handleTokenSelect('USDT')}
              >
                USDT
              </button>
            </div>
          </div>

          {/* 第三行：滑块 */}
          <div className="w-[311vw] md:w-full h-[20vw] md:h-5 relative flex items-center">
            {/* 滑块轨道背景 */}
            <div className="w-full h-[4vw] md:h-1 bg-[#3d3d3d] rounded-full relative">
              {/* 绿色进度条 */}
              <div
                className="h-full bg-[#c5ff33] rounded-full transition-all duration-200"
                style={{
                  width: `${(sliderValue / safeUserBalance) * 100}%`
                }}
              />

              {/* 滑块按钮 */}
              <div
                className={`absolute w-[17vw] md:w-4 h-[17vw] md:h-4 top-1/2 transform -translate-y-1/2 ${isSliderDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  left: `calc(${(sliderValue / safeUserBalance) * 100}% - 8.5vw)`,
                  minWidth: '17vw'
                }}
              >
                <img
                  src={sliderIcon}
                  alt="slider"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* 隐藏的input用于处理交互 */}
            <input
              type="range"
              min="0"
              max={safeUserBalance}
              value={sliderValue}
              onChange={handleSliderChange}
              disabled={isSliderDisabled}
              className={`absolute inset-0 w-full h-full opacity-0 ${isSliderDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
          </div>
        </div>

        {/* 第二部分：Payout */}
        {/* <div
          className="w-[343vw] md:w-full h-[50vw] md:h-12 -mt-[17vw] md:-mt-4 border rounded-[12vw] md:rounded-lg flex items-center justify-center"
          style={{ borderColor: '#1f1f1f' }}
        >
          <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm pb-[2vw]"> <br /> {t('trade.payout')}: {formatNumber(safeParseFloat(profile?.total_profit, 0), 2)}</span>
        </div> */}

        {/* 第三部分：按钮和时间 */}
        <div className="w-full md:w-full mt-[12vw] md:mt-3">
          {!isAuthenticated ? (
            /* 未认证时显示连接钱包按钮 */
            <div className="w-full flex justify-center">
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-[200vw] md:w-64 h-[50vw] md:h-12 bg-[#c5ff33] text-black text-size-[17vw] md:text-lg font-semibold rounded-[12vw] md:rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isConnecting ? t('wallet.connecting') : t('common.connect_wallet')}
              </button>
            </div>
          ) : (
            /* 已认证时显示交易按钮 */
            <>
              {/* 按钮与时间同一行 */}
              <div className="w-full flex items-center justify-between">
                {/* Up按钮 */}
                <div
                  className={`w-[100vw] md:w-32 h-[50vw] md:h-12 rounded-[12vw] md:rounded-lg flex items-center justify-center gap-[8vw] md:gap-2 ${isButtonsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    backgroundColor: '#00bc4b',
                    filter: isButtonsDisabled ? 'brightness(0.3)' : 'brightness(1)'
                  }}
                  onClick={() => !isButtonsDisabled && handlePlaceBet('up')}
                >
                  {isPlacingBet ? (
                    <div className="w-[24vw] md:w-6 h-[24vw] md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <img src={buyUpIcon} alt="Up" className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
                  )}
                  <span className="text-white text-size-[17vw] md:text-lg font-semibold">
                    {isPlacingBet ? t('loading') : t('trade.up')}
                  </span>
                </div>

                {/* 时间模块：放置在中间 */}
                 <div className="h-[38vw] md:h-10 flex flex-col items-center justify-center">
                  {/* <img src={timeIcon} alt="Time" className="w-[16vw] md:w-4 h-[16vw] md:h-4 mb-[4vw] md:mb-1" />
                  <span className="text-white text-size-[15vw] md:text-sm font-semibold">{t('history.duration_1m')}</span> */}
                  <div className="text-white flex flex-col items-center text-size-[8vw] md:text-size-[2vw] font-semibold">
                    <div>{t('trade.estimated_reward')}</div>
                    <div>{formatNumber(safeParseFloat(estimatedSelfReward || '0', 0), 2)}ROCKET</div>
                  </div>
                  <div className="text-white flex flex-col items-center text-size-[8vw] md:text-size-[2vw] font-semibold">
                    {t('trade.luckyusd_claim_count')}: {claimCountToday ?? '--'}
                  </div>
                </div>

                {/* Down按钮 */}
                <div
                  className={`w-[100vw] md:w-32 h-[50vw] md:h-12 rounded-[12vw] md:rounded-lg flex items-center justify-center gap-[8vw] md:gap-2 ${isButtonsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    backgroundColor: '#f5384e',
                    filter: isButtonsDisabled ? 'brightness(0.3)' : 'brightness(1)'
                  }}
                  onClick={() => !isButtonsDisabled && handlePlaceBet('down')}
                >
                  {isPlacingBet ? (
                    <div className="w-[24vw] md:w-6 h-[24vw] md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <img src={buyDownIcon} alt="Down" className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
                  )}
                  <span className="text-white text-size-[17vw] md:text-lg font-semibold">
                    {isPlacingBet ? t('common.loading') : t('trade.down')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 币种选择弹窗 */}
      <Modal isOpen={isTokenModalOpen} onClose={handleCloseTokenModal}>
        <div className="p-[20vw] md:p-5">
          {/* 弹窗标题 */}
          <div className="text-center mb-[20vw] md:mb-5">
            <h3 className="text-white text-size-[18vw] md:text-lg font-semibold">{t('trade.select_token')}</h3>
          </div>

          {/* 币种选项列表 */}
          <div className="space-y-[12vw] md:space-y-3">
            {isLoadingTokens ? (
              // 加载状态
              <div className="flex items-center justify-center py-[40vw] md:py-10">
                <div className="w-[32vw] md:w-8 h-[32vw] md:h-8 border-2 border-[#c5ff33] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-[12vw] md:ml-3 text-white text-size-[14vw] md:text-sm">{t('loading')}</span>
              </div>
            ) : tokenOptions.length === 0 ? (
              // 空状态
              <div className="flex items-center justify-center py-[40vw] md:py-10">
                <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">{t('no_data')}</span>
              </div>
            ) : (
              // 代币列表
              tokenOptions.map((token) => (
                <div
                  key={token.name}
                  className={`w-full h-[50vw] md:h-12 rounded-[12vw] md:rounded-lg px-[16vw] md:px-4 flex items-center gap-[12vw] md:gap-3 cursor-pointer transition-colors ${
                    selectedToken === token.name
                      ? 'bg-[#c5ff33] bg-opacity-20 border border-[#c5ff33]'
                      : 'bg-[#3d3d3d] hover:bg-[#4d4d4d]'
                  }`}
                  onClick={() => handleTokenSelect(token.name)}
                >
                  <img src={token.icon} alt={token.name} className="w-[24vw] md:w-6 h-[24vw] md:h-6 flex-shrink-0" />
                  <span className={`text-size-[16vw] md:text-base font-medium ${
                    selectedToken === token.name ? 'text-[#c5ff33]' : 'text-white'
                  }`}>
                    {token.name}
                  </span>
                  {selectedToken === token.name && (
                    <div className="ml-auto w-[16vw] md:w-4 h-[16vw] md:h-4 rounded-full bg-[#c5ff33] flex items-center justify-center">
                      <div className="w-[8vw] md:w-2 h-[8vw] md:h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
      {/* 验证码弹窗 */}
      <CaptchaModal
        isOpen={isCaptchaOpen}
        onClose={() => setIsCaptchaOpen(false)}
        title={t('captcha.title')}
        description={t('captcha.description')}
        captchaType="math"
        placeholder={t('captcha.placeholder_math')}
        reloadText={t('captcha.reload_text')}
        onSuccess={handleCaptchaSuccess}
        onFail={handleCaptchaFail}
      />
    </div>
  );
};

export default Trade;
