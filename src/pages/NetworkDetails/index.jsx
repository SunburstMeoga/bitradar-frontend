import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import CountUp from 'react-countup';
import networkService from '../../services/networkService';
import referralService from '../../services/referralService';
import { formatNumber as formatTwo } from '../../utils/format.js';
import userService from '../../services/userService';
import toast from 'react-hot-toast';

// 向下箭头SVG组件
const ArrowDownIcon = ({ isExpanded }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 自定义动画金额组件
const AnimatedAmount = ({ amount, fontSize = '14vw', mdFontSize = 'text-sm', className = 'text-white' }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const smallerFontSize = `${parseInt(fontSize) / 2}vw`;

  useEffect(() => {
    const duration = 2000; // 2秒
    const steps = 60; // 60帧
    const increment = amount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, amount);
      setCurrentValue(current);

      if (step >= steps || current >= amount) {
        setCurrentValue(amount);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  const [integerPart, decimalPart] = currentValue.toFixed(2).split('.');

  return (
    <span className={`${className} text-size-[${fontSize}] md:${mdFontSize} font-medium`}>
      {integerPart}
      <span className={`text-size-[${smallerFontSize}] md:text-xs align-baseline`}>
        .{decimalPart}
      </span>
    </span>
  );
};

const NetworkDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 设置页面标题
  usePageTitle('network_details');
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [selectedTab, setSelectedTab] = useState('membership'); // membership | mining
  const [includeInactive, setIncludeInactive] = useState(false);
  const [queryDepth, setQueryDepth] = useState(5);

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState(null);
  const [rewardConfig, setRewardConfig] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uplineWallet, setUplineWallet] = useState(null);
  const [referralRewards, setReferralRewards] = useState([]);
  // 金牌奖励与交易挖矿奖励数据
  const [goldRewardsData, setGoldRewardsData] = useState({ records: [], summary: null, pagination: null });
  const [goldPage, setGoldPage] = useState(1);
  const [goldLimit, setGoldLimit] = useState(10);
  const [loadingGold, setLoadingGold] = useState(false);
  const [miningRewardsData, setMiningRewardsData] = useState({ records: [], summary: null, pagination: null });
  const [miningPage, setMiningPage] = useState(1);
  const [miningLimit, setMiningLimit] = useState(10);
  const [loadingMining, setLoadingMining] = useState(false);

  // Rocket奖励详情区块引用（会员推广 / 交易挖矿）
  const rocketMembershipRef = useRef(null);
  const rocketMiningRef = useRef(null);

  // tabs切换后，平滑滚动至对应的“ROCKET奖励详情”区块（推广机制不滚动）
  useEffect(() => {
    let targetEl = null;
    if (selectedTab === 'membership') targetEl = rocketMembershipRef.current;
    else if (selectedTab === 'mining') targetEl = rocketMiningRef.current;
    if (targetEl && typeof targetEl.scrollIntoView === 'function') {
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) {
        // 兼容旧浏览器：无smooth参数时退化为默认滚动
        targetEl.scrollIntoView();
      }
    }
  }, [selectedTab]);

  // 递归统计所有层级的团队成员数量（children 的总数）
  const countDescendants = (node) => {
    if (!node || !Array.isArray(node.children)) return 0;
    let total = 0;
    for (const child of node.children) {
      total += 1; // 统计当前子节点
      total += countDescendants(child); // 递归统计子节点的子节点
    }
    return total;
  };

  // 计算唯一后代总数（按 id/user_id/wallet_address 去重）
  const getUniqueDescendantCount = (treeStructure, maxDepth = Infinity) => {
    if (!treeStructure || !Array.isArray(treeStructure.children)) return 0;
    const seen = new Set();
    const queue = treeStructure.children.map(child => ({ node: child, level: 1 }));
    let count = 0;

    const keyOf = (n) => {
      if (!n) return null;
      return (
        (n.id !== undefined ? `id:${n.id}` : null) ||
        (n.user_id !== undefined ? `uid:${n.user_id}` : null) ||
        (n.wallet_address ? `wa:${n.wallet_address}` : null)
      );
    };

    while (queue.length > 0) {
      const { node, level } = queue.shift();
      if (level <= maxDepth) {
        const key = keyOf(node);
        if (key && !seen.has(key)) {
          seen.add(key);
          count += 1;
        }
        const kids = Array.isArray(node.children) ? node.children : [];
        if (level < maxDepth) {
          for (const k of kids) queue.push({ node: k, level: level + 1 });
        }
      }
    }
    return count;
  };

  // 从API数据中提取的统计信息
  const overviewData = networkData ? {
    teamMembers: getUniqueDescendantCount(networkData?.tree_structure, queryDepth),
    totalDeposit: parseFloat(networkData.statistics?.total_network_volume || '0'),
    totalWithdrawal: 0 // API中没有提现数据，暂时设为0
  } : {
    teamMembers: 0,
    totalDeposit: 0,
    totalWithdrawal: 0
  };

  // 从网体结构中构建层级数据（按层级聚合，避免覆盖与漏计）
  const buildLevelData = (treeStructure, maxDepth = Infinity) => {
    if (!treeStructure || !Array.isArray(treeStructure.children)) return [];

    // 使用BFS按层级聚合
    const levelMap = new Map(); // level -> nodes[]
    const queue = [];
    for (const child of treeStructure.children) {
      queue.push({ node: child, level: 1 });
    }

    while (queue.length > 0) {
      const { node, level } = queue.shift();
      if (level <= maxDepth) {
        if (!levelMap.has(level)) levelMap.set(level, []);
        levelMap.get(level).push(node);

        const kids = Array.isArray(node.children) ? node.children : [];
        if (level < maxDepth) {
          for (const k of kids) {
            queue.push({ node: k, level: level + 1 });
          }
        }
      }
    }

    const levels = [...levelMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([level, nodes]) => ({
        level,
        count: nodes.length,
        users: nodes.map(user => ({
          id: user.id,
          user_id: user.user_id,
          wallet_address: user.wallet_address,
          invite_code: user.invite_code,
          membership_type: user.membership_type,
          vip_level: user.vip_level || 1,
          stake_amount: parseFloat(user.stake_amount || '0'),
          relationship: user.relationship || 'direct',
          level_difference: user.level_difference || 1,
          network_reward_eligible: user.network_reward_eligible || false,
          flat_reward_eligible: user.flat_reward_eligible || false,
          direct_invites: user.direct_invites || 0,
          total_invites: user.total_invites || 0,
          total_rewards: user.total_rewards || '0',
          children: user.children || []
        }))
      }));

    return levels;
  };

  const levelData = buildLevelData(networkData?.tree_structure, queryDepth);
  const teamTotalFromLevels = levelData.reduce((sum, l) => sum + (l?.count || 0), 0);

  // 加载网体数据
  const loadNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行加载网体数据和奖励配置
      const [networkResponse, configResponse, profileResponse, rewardsResponse] = await Promise.all([
        networkService.getMyNetworkTree({
          depth: queryDepth, // 查询深度可控
          include_inactive: includeInactive // 是否包含未激活用户
        }),
        networkService.getNetworkRewardConfig(),
        userService.getProfile().catch(() => null),
        networkService.getReferralRewards().catch(() => null)
      ]);

      if (networkResponse.success) {
        setNetworkData(networkResponse.data);
      } else {
        throw new Error('获取网体数据失败');
      }

      if (configResponse.success) {
        setRewardConfig(configResponse.data.config);
      }
      // 奖励配置失败不影响主要功能，只记录错误

      if (profileResponse && profileResponse.success) {
        setProfile(profileResponse.data);
      }

      // 获取上级钱包地址：传入当前用户ID，让后端返回其 inviter 信息
      try {
        const targetUserId = profileResponse?.data?.id;
        const detailResp = await referralService.getReferralTreeDetail(targetUserId);
        const wallet = detailResp?.data?.inviter_wallet_address;
        if (wallet) {
          setUplineWallet(wallet);
        }
      } catch (e) {
        console.warn('获取上级钱包地址失败:', e?.message || e);
      }

      if (rewardsResponse && rewardsResponse.success) {
        // 兼容不同字段命名
        const list = Array.isArray(rewardsResponse.data?.rewards)
          ? rewardsResponse.data.rewards
          : (Array.isArray(rewardsResponse.data) ? rewardsResponse.data : []);
        setReferralRewards(list);
      }

    } catch (err) {
      console.error('加载网体数据失败:', err);
      setError(err.message || '加载网体数据失败');
      toast.error('加载网体数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载金牌推广奖励
  const loadGoldRewards = async () => {
    try {
      setLoadingGold(true);
      const resp = await networkService.getAllRocketRewards({ filter: 'membership', page: goldPage, limit: goldLimit });
      if (resp && resp.success) {
        setGoldRewardsData(resp.data);
      }
    } catch (err) {
      console.error('加载金牌推广奖励失败:', err);
    } finally {
      setLoadingGold(false);
    }
  };

  // 加载交易挖矿奖励
  const loadMiningRewards = async () => {
    try {
      setLoadingMining(true);
      const resp = await networkService.getAllRocketRewards({ filter: 'trading_mining', page: miningPage, limit: miningLimit });
      if (resp && resp.success) {
        setMiningRewardsData(resp.data);
      }
    } catch (err) {
      console.error('加载交易挖矿奖励失败:', err);
    } finally {
      setLoadingMining(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadNetworkData();
  }, [includeInactive, queryDepth]);

  // 首次及分页变化时加载金牌奖励
  useEffect(() => {
    loadGoldRewards();
  }, [goldPage, goldLimit]);

  // 在切换到“交易挖矿”Tab或分页变化时加载挖矿奖励
  useEffect(() => {
    if (selectedTab === 'mining') {
      loadMiningRewards();
    }
  }, [selectedTab, miningPage, miningLimit]);

  // 处理层级展开/收起
  const handleLevelToggle = (level) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  // 格式化用户ID显示（显示钱包地址或用户ID）
  const formatUserId = (user) => {
    if (!user) return '';
    
    // 优先显示钱包地址的简化版本
    if (user.wallet_address) {
      const address = user.wallet_address;
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    // 如果没有钱包地址，显示用户ID
    if (user.user_id) {
      return `用户 #${user.user_id}`;
    }
    
    return '未知用户';
  };

  // 格式化金额显示，小数点后字体小一半，带跳动效果
  const formatAmount = (amount, fontSize = '14vw', className = 'text-white') => {
    return <AnimatedAmount amount={amount} fontSize={fontSize} className={className} />;
  };

  // 格式化数字显示，带跳动效果（整数）
  const formatNumber = (number, fontSize = '16vw', mdFontSize = 'text-lg') => {
    return (
      <span className={`text-white text-size-[${fontSize}] md:${mdFontSize} font-medium`}>
        <CountUp
          start={0}
          end={number}
          duration={2}
          separator=""
        />
      </span>
    );
  };

  const formatWalletShort = (address) => {
    if (!address || typeof address !== 'string') return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 加载状态
  if (loading) {
    return (
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[20vw] md:pb-5">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-size-[16vw] md:text-lg">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[20vw] md:pb-5">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-400 text-size-[16vw] md:text-lg mb-4">{error}</p>
            <div
              onClick={loadNetworkData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.retry')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[20vw] md:pb-5">
      {/* 顶部过滤与总览（隐藏收益按钮与总质押金额） */}
      <div className="mb-[24vw] md:mb-6">
        <div className="flex justify-between items-center mb-[16vw] md:mb-4">
          <h2 className="text-white text-size-[18vw] md:text-xl font-semibold" style={{ fontWeight: 600 }}>
            {t('network_details.referral_overview')}
          </h2>
          {/* 收益明细按钮隐藏，不删除 */}
        </div>

        {/* 过滤条件隐藏 */}
        <div className="hidden"></div>

       

        {/* 总质押金额隐藏，不删除 */}
      </div>

      {/* Tabs */}
      <div className="mb-[16vw] md:mb-4 flex items-center gap-[8vw] md:gap-2">
        <div
          onClick={() => setSelectedTab('membership')}
          className={`px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded text-size-[12vw] md:text-xs ${selectedTab === 'membership' ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-white'} hover:opacity-80`}
        >
          {t('network_details.tabs.membership_network')}
        </div>
        <div
          onClick={() => setSelectedTab('mining')}
          className={`px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded text-size-[12vw] md:text-xs ${selectedTab === 'mining' ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-white'} hover:opacity-80`}
        >
          {t('network_details.tabs.mining_network')}
        </div>
        <div
          onClick={() => setSelectedTab('promotion')}
          className={`px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded text-size-[12vw] md:text-xs ${selectedTab === 'promotion' ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-white'} hover:opacity-80`}
        >
          {t('network_details.tabs.promotion_mechanism')}
        </div>
        {/* 理财网体Tab先隐藏，不删除 */}
      </div>

      {selectedTab === 'membership' && (
        <div>
           {/* 团队总人数 */}
        <div
          className="w-full h-[50vw] md:h-12 flex items-center px-[16vw] md:px-4 mb-[12vw] md:mb-3 rounded-[8vw] md:rounded-lg border border-gray-400"
          style={{ backgroundColor: 'rgba(64, 64, 64, 0.3)' }}
        >
          <span className="text-white text-size-[16vw] md:text-lg">{t('network_details.team_members')}</span>
          <div className="ml-auto">{formatNumber(teamTotalFromLevels, '16vw', 'text-lg')}</div>
        </div>
          {/* 概览统计：金牌、银牌、我的上级 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[12vw] md:gap-3 mb-[16vw] md:mb-4">
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.gold_members')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {(() => {
                  const allUsers = levelData.flatMap(l => l.users || []);
                  const gold = allUsers.filter(u => u.membership_type === 'gold').length;
                  return gold;
                })()}
              </div>
            </div>
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.silver_members')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {(() => {
                  const allUsers = levelData.flatMap(l => l.users || []);
                  const silver = allUsers.filter(u => u.membership_type === 'silver').length;
                  return silver;
                })()}
              </div>
            </div>
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.my_upline')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {uplineWallet
                  ? formatWalletShort(uplineWallet)
                  : (profile?.invited_by ? `用户 #${profile.invited_by}` : t('network_details.no_referrals'))}
              </div>
            </div>
          </div>

          {/* 推荐关系（现有列表复用） */}
          <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
            {t('network_details.referral_system')}
          </h2>
          <div className="space-y-[2vw] md:space-y-1">
            {levelData.length > 0 ? levelData.map((level) => (
              <div key={level.level}>
                {/* 层级标题 */}
                <div
                  onClick={() => handleLevelToggle(level.level)}
                  className="w-full h-[50vw] md:h-12 flex items-center justify-between px-[16vw] md:px-4 rounded-[8vw] md:rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'rgb(41, 41, 41)' }}
                >
                  <span className="text-white text-size-[16vw] md:text-lg">
                    {t('network_details.level_title', { level: level.level, count: level.count })}
                  </span>
                  <ArrowDownIcon isExpanded={expandedLevel === level.level} />
                </div>

                {/* 展开的用户列表 */}
                {expandedLevel === level.level && (
                  <div className="mt-[2vw] md:mt-1 space-y-[1vw] md:space-y-1">
                    {level.users.map((user, index) => (
                      <div
                        key={user.user_id || index}
                        className="px-[16vw] md:px-4 py-[12vw] md:py-3 rounded-[8vw] md:rounded-lg"
                        style={{ backgroundColor: 'rgb(31, 31, 31)' }}
                      >
                        {/* 用户信息 */}
                        <div className="flex justify-between items-center mb-[8vw] md:mb-2">
                          <div className="text-white text-size-[14vw] md:text-sm font-medium">
                            {formatUserId(user)}
                          </div>
                        </div>

                        {/* 用户数据（仅显示会员类型，隐藏质押金额） */}
                        <div className="flex justify-center text-size-[12vw] md:text-xs">
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw] md:mb-1">{t('network_details.membership_type')}</span>
                            <span className="text-white text-size-[12vw] md:text-xs">
                              {t(`network_details.membership_types.${user.membership_type || 'none'}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">
                  {t('network_details.no_referrals')}
                </p>
              </div>
            )}
          </div>

          {/* ROCKET奖励详情 */}
          <div ref={rocketMembershipRef} className="mt-[24vw] md:mt-6">
            <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
              {t('network_details.rocket_rewards')}
            </h2>
            {/* 奖励摘要 */}
            {(() => {
              const records = Array.isArray(goldRewardsData.records) ? goldRewardsData.records : [];
              const to2 = (v) => (v === null || v === undefined ? '—' : formatTwo(v));
              const sumByType = (typeKey) => {
                const total = records
                  .filter(r => {
                    const tType = (r.reward_type || '').toLowerCase();
                    const c = (r.reward_category || '').toLowerCase();
                    if (typeKey === 'referral_reward') return tType === 'referral_reward' || c === 'referral';
                    if (typeKey === 'membership_upgrade_reward') return tType === 'membership_upgrade_reward' || c === 'membership_upgrade';
                    if (typeKey === 'network_reward') return tType === 'network_reward';
                    if (typeKey === 'peer_level_reward') return tType === 'peer_level_reward';
                    return false;
                  })
                  .reduce((acc, r) => acc + parseFloat(r.amount || r.reward_amount || '0'), 0);
                return to2(total);
              };
              const referralReward = sumByType('referral_reward');
              const networkReward = sumByType('network_reward');
              const peerLevelReward = sumByType('peer_level_reward');
              const membershipUpgrade = sumByType('membership_upgrade_reward');
              // 根据用户要求，移除会员推广摘要卡片
              return null;
            })()}

            {/* 奖励列表 */}
            <div className="space-y-[4vw] md:space-y-1">
              {loadingGold ? (
                <div className="text-center py-8">
                  <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">{t('common.loading')}</p>
                </div>
              ) : Array.isArray(goldRewardsData.records) && goldRewardsData.records.length > 0 ? (
                goldRewardsData.records.map((item, idx) => {
                  const canonicalType = (() => {
                    const tType = (item.reward_type || '').toLowerCase();
                    const c = (item.reward_category || '').toLowerCase();
                    if (tType === 'referral_reward' || c === 'referral') return 'referral_reward';
                    if (tType === 'membership_upgrade_reward' || c === 'membership_upgrade') return 'membership_upgrade_reward';
                    if (tType === 'network_reward') return 'network_reward';
                    if (tType === 'peer_level_reward') return 'peer_level_reward';
                    return tType || c || 'unknown';
                  })();
                  const raName = item?.referral_activity_reward_records?.name;
                  const name = (() => {
                    if (raName) {
                      const key = `token_history.transaction_types.${raName}`;
                      const translated = t(key);
                      if (translated && translated !== key) return translated;
                    }
                    return t(`network_details.reward_types.${canonicalType}`);
                  })();
                  return (
                    <div key={item.transaction_id || idx} className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg mb-[4vw] md:mb-1" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-size-[14vw] md:text-sm font-medium">{name}</span>
                        <span className="flex items-center gap-[2vw] md:gap-1 text-size-[14vw] md:text-sm font-medium">
                          <span className="text-green-400">{formatTwo(item.amount || item.reward_amount)}</span>
                          <span className="text-[#8f8f8f]">Rocket</span>
                        </span>
                      </div>
                      <div className="flex flex-col text-size-[12vw] md:text-xs text-[#8f8f8f] mt-[2vw] md:mt-0.5">
                        <span>{t('network_details.record.distributed')}：{item.distributed_at ? new Date(item.distributed_at).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">{t('network_details.no_data')}</p>
                </div>
              )}
            </div>

            {/* 分页 */}
            {goldRewardsData.pagination && (
              <div className="mt-[12vw] md:mt-3 flex items-center gap-[8vw] md:gap-2">
                <button
                  className="px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded bg-[#2a2a2a] text-white text-size-[12vw] md:text-xs hover:opacity-80 disabled:opacity-50"
                  onClick={() => setGoldPage(Math.max((goldRewardsData.pagination.page || 1) - 1, 1))}
                  disabled={(goldRewardsData.pagination.page || 1) <= 1}
                >{t('token_history.pagination.previous')}</button>
                <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs">
                  {t('token_history.pagination.page_of_total', { current: goldRewardsData.pagination.page || 1, total: goldRewardsData.pagination.total_pages || 1 })}
                </div>
                <button
                  className="px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded bg-[#2a2a2a] text-white text-size-[12vw] md:text-xs hover:opacity-80 disabled:opacity-50"
                  onClick={() => setGoldPage(Math.min((goldRewardsData.pagination.page || 1) + 1, goldRewardsData.pagination.total_pages || 1))}
                  disabled={(goldRewardsData.pagination.page || 1) >= (goldRewardsData.pagination.total_pages || 1)}
                >{t('token_history.pagination.next')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'mining' && (
        <div>
          {/* 团队总人数（与会员资格推广一致） */}
          <div
            className="w-full h-[50vw] md:h-12 flex items-center px-[16vw] md:px-4 mb-[12vw] md:mb-3 rounded-[8vw] md:rounded-lg border border-gray-400"
            style={{ backgroundColor: 'rgba(64, 64, 64, 0.3)' }}
          >
            <span className="text-white text-size-[16vw] md:text-lg">{t('network_details.team_members')}</span>
            <div className="ml-auto">{formatNumber(teamTotalFromLevels, '16vw', 'text-lg')}</div>
          </div>

          {/* 概览统计：金牌、银牌、我的上级（与会员资格推广一致） */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[12vw] md:gap-3 mb-[16vw] md:mb-4">
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.gold_members')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {(() => {
                  const allUsers = levelData.flatMap(l => l.users || []);
                  const gold = allUsers.filter(u => u.membership_type === 'gold').length;
                  return gold;
                })()}
              </div>
            </div>
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.silver_members')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {(() => {
                  const allUsers = levelData.flatMap(l => l.users || []);
                  const silver = allUsers.filter(u => u.membership_type === 'silver').length;
                  return silver;
                })()}
              </div>
            </div>
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.my_upline')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {uplineWallet
                  ? formatWalletShort(uplineWallet)
                  : (profile?.invited_by ? `用户 #${profile.invited_by}` : t('network_details.no_referrals'))}
              </div>
            </div>
          </div>

          {/* 推荐关系（与会员资格推广一致，复用列表） */}
          <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
            {t('network_details.referral_system')}
          </h2>
          <div className="space-y-[2vw] md:space-y-1">
            {levelData.length > 0 ? levelData.map((level) => (
              <div key={level.level}>
                {/* 层级标题 */}
                <div
                  onClick={() => handleLevelToggle(level.level)}
                  className="w-full h-[50vw] md:h-12 flex items-center justify-between px-[16vw] md:px-4 rounded-[8vw] md:rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'rgb(41, 41, 41)' }}
                >
                  <span className="text-white text-size-[16vw] md:text-lg">
                    {t('network_details.level_title', { level: level.level, count: level.count })}
                  </span>
                  <ArrowDownIcon isExpanded={expandedLevel === level.level} />
                </div>

                {/* 展开的用户列表 */}
                {expandedLevel === level.level && (
                  <div className="mt-[2vw] md:mt-1 space-y-[1vw] md:space-y-1">
                    {level.users.map((user, index) => (
                      <div
                        key={user.user_id || index}
                        className="px-[16vw] md:px-4 py-[12vw] md:py-3 rounded-[8vw] md:rounded-lg"
                        style={{ backgroundColor: 'rgb(31, 31, 31)' }}
                      >
                        {/* 用户信息 */}
                        <div className="flex justify-between items-center mb-[8vw] md:mb-2">
                          <div className="text-white text-size-[14vw] md:text-sm font-medium">
                            {formatUserId(user)}
                          </div>
                        </div>

                        {/* 用户数据（仅显示会员类型，隐藏质押金额） */}
                        <div className="flex justify-center text-size-[12vw] md:text-xs">
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw] md:mb-1">{t('network_details.membership_type')}</span>
                            <span className="text-white text-size-[12vw] md:text-xs">
                              {t(`network_details.membership_types.${user.membership_type || 'none'}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">
                  {t('network_details.no_referrals')}
                </p>
              </div>
            )}
          </div>

          {/* ROCKET奖励详情（仅该部分在两个Tabs间切换） */}
          <div ref={rocketMiningRef} className="mt-[24vw] md:mt-6">
            <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
              {t('network_details.rocket_rewards')}
            </h2>

            {/* 奖励摘要（交易挖矿） */}
            {(() => {
              const records = Array.isArray(miningRewardsData.records) ? miningRewardsData.records : [];
              const to2 = (v) => (v === null || v === undefined ? '—' : formatTwo(v));
              const sumByType = (typeKey) => {
                const total = records
                  .filter(r => {
                    const tType = (r.reward_type || '').toLowerCase();
                    const c = (r.reward_category || '').toLowerCase();
                    if (typeKey === 'trading_mining_self') return c === 'trading_mining' && (tType === 'self' || tType === 'trading_mining_self');
                    if (typeKey === 'trading_mining_layer') return c === 'trading_mining_layer' || tType === 'layer_reward' || tType === 'trading_mining_layer';
                    return false;
                  })
                  .reduce((acc, r) => acc + parseFloat(r.amount || r.reward_amount || '0'), 0);
                return to2(total);
              };
              const selfReward = sumByType('trading_mining_self');
              const layerReward = sumByType('trading_mining_layer');
              const recordCount = to2(records.length);
              // 根据用户要求，移除交易挖矿摘要与记录数卡片
              return null;
            })()}

            {/* 列表（交易挖矿） */}
            <div className="space-y-[4vw] md:space-y-1">
              {loadingMining ? (
                <div className="text-center py-8">
                  <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">{t('common.loading')}</p>
                </div>
              ) : Array.isArray(miningRewardsData.records) && miningRewardsData.records.length > 0 ? (
                miningRewardsData.records.map((item, idx) => {
                  const canonicalType = (() => {
                    const tType = (item.reward_type || '').toLowerCase();
                    const c = (item.reward_category || '').toLowerCase();
                    if (c === 'trading_mining' && (tType === 'self' || tType === 'trading_mining_self')) return 'trading_mining_self';
                    if (c === 'trading_mining_layer' || tType === 'layer_reward' || tType === 'trading_mining_layer') return 'trading_mining_layer';
                    if (/^layer_[1-5]$/.test(tType)) return tType; // layer_1..layer_5
                    return tType || c || 'unknown';
                  })();
                  const raName = item?.referral_activity_reward_records?.name;
                  const name = (() => {
                    if (raName) {
                      const key = `token_history.transaction_types.${raName}`;
                      const translated = t(key);
                      if (translated && translated !== key) return translated;
                    }
                    return t(`network_details.reward_types.${canonicalType}`);
                  })();
                  return (
                    <div key={item.transaction_id || idx} className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg mb-[4vw] md:mb-1" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-size-[14vw] md:text-sm font-medium">{name}</span>
                        <span className="flex items-center gap-[2vw] md:gap-1 text-size-[14vw] md:text-sm font-medium">
                          <span className="text-green-400">{formatTwo(item.amount || item.reward_amount)}</span>
                          <span className="text-[#8f8f8f]">Rocket</span>
                        </span>
                      </div>
                      <div className="flex flex-col text-size-[12vw] md:text-xs text-[#8f8f8f] mt-[2vw] md:mt-0.5">
                        <span>{t('network_details.record.distributed')}：{item.distributed_at ? new Date(item.distributed_at).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">{t('network_details.no_data')}</p>
                </div>
              )}
            </div>

            {/* 分页（交易挖矿） */}
            {miningRewardsData.pagination && (
              <div className="mt-[12vw] md:mt-3 flex items-center gap-[8vw] md:gap-2">
                <button
                  className="px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded bg-[#2a2a2a] text-white text-size-[12vw] md:text-xs hover:opacity-80 disabled:opacity-50"
                  onClick={() => setMiningPage(Math.max((miningRewardsData.pagination.page || 1) - 1, 1))}
                  disabled={(miningRewardsData.pagination.page || 1) <= 1}
                >{t('token_history.pagination.previous')}</button>
                <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs">
                  {t('token_history.pagination.page_of_total', { current: miningRewardsData.pagination.page || 1, total: miningRewardsData.pagination.total_pages || 1 })}
                </div>
                <button
                  className="px-[12vw] md:px-3 py-[6vw] md:py-1.5 rounded-[6vw] md:rounded bg-[#2a2a2a] text-white text-size-[12vw] md:text-xs hover:opacity-80 disabled:opacity-50"
                  onClick={() => setMiningPage(Math.min((miningRewardsData.pagination.page || 1) + 1, miningRewardsData.pagination.total_pages || 1))}
                  disabled={(miningRewardsData.pagination.page || 1) >= (miningRewardsData.pagination.total_pages || 1)}
                >{t('token_history.pagination.next')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'promotion' && (
        <div>
          {/* 推广机制说明内容块 */}
          <div className="space-y-[12vw] md:space-y-3">
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <h3 className="text-white text-size-[16vw] md:text-base font-medium mb-[8vw] md:mb-2" style={{ fontWeight: 600 }}>
                {t('network_details.tabs.promotion_mechanism')}
              </h3>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm mb-[6vw] md:mb-1">{t('network_details.promotion.intro_1')}</p>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm mb-[6vw] md:mb-1">{t('network_details.promotion.intro_2')}</p>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm">{t('network_details.promotion.intro_3')}</p>
            </div>

            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <h4 className="text-white text-size-[16vw] md:text-base font-medium mb-[8vw] md:mb-2" style={{ fontWeight: 600 }}>
                {t('network_details.promotion.section1_title')}
              </h4>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm mb-[6vw] md:mb-1">{t('network_details.promotion.section1_example')}</p>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm">{t('network_details.promotion.section1_silver_note')}</p>
            </div>

            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <h4 className="text-white text-size-[16vw] md:text-base font-medium mb-[8vw] md:mb-2" style={{ fontWeight: 600 }}>
                {t('network_details.promotion.section2_title')}
              </h4>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm">{t('network_details.promotion.section2_example')}</p>
            </div>

            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <h4 className="text-white text-size-[16vw] md:text-base font-medium mb-[8vw] md:mb-2" style={{ fontWeight: 600 }}>
                {t('network_details.promotion.section3_title')}
              </h4>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm mb-[6vw] md:mb-1">{t('network_details.promotion.section3_desc')}</p>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm mb-[6vw] md:mb-1">{t('network_details.promotion.section3_example_intro')}</p>
              <p className="text-[#cfcfcf] text-size-[14vw] md:text-sm">{t('network_details.promotion.section3_rewards')}</p>
            </div>
          </div>
        </div>
      )}

      {/* 奖励配置 */}
      {rewardConfig && (
        <div className="mt-[24vw] md:mt-6">
          <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
            {t('network_details.reward_config.title')}
          </h2>

          <div className="space-y-[12vw] md:space-y-3">
            {/* 基本配置 */}
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="grid grid-cols-2 gap-[12vw] md:gap-3">
                <div>
                  <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">
                    {t('network_details.reward_config.max_levels')}
                  </div>
                  <div className="text-white text-size-[14vw] md:text-sm font-medium">
                    {rewardConfig.max_levels} 层
                  </div>
                </div>
                <div>
                  <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">
                    {t('network_details.reward_config.min_referrals')}
                  </div>
                  <div className="text-white text-size-[14vw] md:text-sm font-medium">
                    {rewardConfig.min_referrals_required} 人
                  </div>
                </div>
              </div>
            </div>

            {/* 层级费率 */}
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="text-white text-size-[16vw] md:text-base font-medium mb-[12vw] md:mb-3">
                {t('network_details.reward_config.level_rates')}
              </div>
              <div className="space-y-[8vw] md:space-y-2">
                {rewardConfig.level_rates?.map((levelRate, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
                      第 {levelRate.level} 层
                    </span>
                    <span className="text-green-400 text-size-[14vw] md:text-sm font-medium">
                      {levelRate.rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 结算周期 */}
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">
                {t('network_details.reward_config.calculation_period')}
              </div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {rewardConfig.calculation_period === 'daily' ? '每日结算' : rewardConfig.calculation_period}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDetails;
