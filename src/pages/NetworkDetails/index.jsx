import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import CountUp from 'react-countup';
import networkService from '../../services/networkService';
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
  const [queryDepth, setQueryDepth] = useState(10);

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState(null);
  const [rewardConfig, setRewardConfig] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [referralRewards, setReferralRewards] = useState([]);

  // 从API数据中提取的统计信息
  const overviewData = networkData ? {
    teamMembers: Array.isArray(networkData?.tree_structure?.children)
      ? networkData.tree_structure.children.length
      : 0,
    totalDeposit: parseFloat(networkData.statistics?.total_network_volume || '0'),
    totalWithdrawal: 0 // API中没有提现数据，暂时设为0
  } : {
    teamMembers: 0,
    totalDeposit: 0,
    totalWithdrawal: 0
  };

  // 从网体结构中构建层级数据
  const buildLevelData = (treeStructure) => {
    if (!treeStructure) return [];

    const levels = [];
    const processLevel = (users, level) => {
      if (users && users.length > 0) {
        levels[level - 1] = {
          level,
          count: users.length,
          users: users.map(user => ({
            user_id: user.user_id,
            wallet_address: user.wallet_address,
            invite_code: user.invite_code,
            vip_level: user.vip_level || 1, // 默认VIP等级为1
            stake_amount: parseFloat(user.stake_amount || '0'),
            relationship: user.relationship || 'direct',
            level_difference: user.level_difference || 1,
            network_reward_eligible: user.network_reward_eligible || false,
            flat_reward_eligible: user.flat_reward_eligible || false,
            direct_invites: user.direct_invites || 0,
            total_invites: user.total_invites || 0,
            total_rewards: user.total_rewards || '0'
          }))
        };

        // 递归处理子级
        users.forEach(user => {
          if (user.children && user.children.length > 0) {
            processLevel(user.children, level + 1);
          }
        });
      }
    };

    // 显示当前用户的直接下级用户（children数组）
    if (treeStructure.children && treeStructure.children.length > 0) {
      processLevel(treeStructure.children, 1);
    }

    return levels.filter(level => level); // 过滤掉空的层级
  };

  const levelData = buildLevelData(networkData?.tree_structure);

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

  // 组件挂载时加载数据
  useEffect(() => {
    loadNetworkData();
  }, [includeInactive, queryDepth]);

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

        {/* 团队总人数 */}
        <div
          className="w-full h-[50vw] md:h-12 flex items-center px-[16vw] md:px-4 mb-[12vw] md:mb-3 rounded-[8vw] md:rounded-lg border border-gray-400"
          style={{ backgroundColor: 'rgba(64, 64, 64, 0.3)' }}
        >
          <span className="text-white text-size-[16vw] md:text-lg">{t('network_details.team_members')}</span>
          <div className="ml-auto">{formatNumber(overviewData.teamMembers, '16vw', 'text-lg')}</div>
        </div>

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
        {/* 理财网体Tab先隐藏，不删除 */}
      </div>

      {selectedTab === 'membership' && (
        <div>
          {/* 概览统计：金牌、银牌、我的上级 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[12vw] md:gap-3 mb-[16vw] md:mb-4">
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.gold_members')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {(() => {
                  const allUsers = levelData.flatMap(l => l.users || []);
                  const gold = allUsers.filter(u => (u.vip_level || 1) >= 2).length;
                  return gold;
                })()}
              </div>
            </div>
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.silver_members')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {(() => {
                  const allUsers = levelData.flatMap(l => l.users || []);
                  const gold = allUsers.filter(u => (u.vip_level || 1) >= 2).length;
                  const silver = Math.max(allUsers.filter(u => (u.vip_level || 1) >= 1).length - gold, 0);
                  return silver;
                })()}
              </div>
            </div>
            <div className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_details.my_upline')}</div>
              <div className="text-white text-size-[14vw] md:text-sm font-medium">
                {profile?.invited_by ? `用户 #${profile.invited_by}` : t('network_details.no_referrals')}
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
                          <div className="text-yellow-400 text-size-[12vw] md:text-xs">
                            VIP{user.vip_level}
                          </div>
                        </div>

                        {/* 用户数据 */}
                        <div className="flex justify-between text-size-[12vw] md:text-xs">
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw] md:mb-1">{t('network_details.stake_amount')}</span>
                            {formatAmount(user.stake_amount, '12vw', 'text-white')}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw] md:mb-1">{t('network_details.relationship')}</span>
                            <span className="text-white text-size-[12vw] md:text-xs">
                              {t(`network_details.relationship_${user.relationship}`)}
                            </span>
                          </div>
                          {/* <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw] md:mb-1">{t('network_details.reward_eligible')}</span>
                            <span className={`text-size-[12vw] md:text-xs ${
                              user.network_reward_eligible || user.flat_reward_eligible ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {user.network_reward_eligible || user.flat_reward_eligible ? t('common.yes') : t('common.no')}
                            </span>
                          </div> */}
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
          <div className="mt-[24vw] md:mt-6">
            <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
              {t('network_details.rocket_rewards')}
            </h2>
            <div className="space-y-[8vw] md:space-y-2">
              {Array.isArray(referralRewards) && referralRewards.length > 0 ? (
                referralRewards.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-[16vw] md:px-4 py-[12vw] md:py-3 rounded-[8vw] md:rounded-lg" style={{ backgroundColor: 'rgb(41, 41, 41)' }}>
                    <span className="text-white text-size-[14vw] md:text-sm font-medium">{item.amount || item.reward_amount || '—'}</span>
                    <span className="text-[#8f8f8f] text-size-[12vw] md:text-xs">{item.created_at || item.time || '—'}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">{t('network_details.no_data')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'mining' && (
        <div className="text-center py-8">
          <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">{t('network_details.no_data')}</p>
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
