import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { referralService } from '../../services';

// 树节点连接线SVG组件
const TreeLineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2V12M12 12H22M12 12L6 18" stroke="#3D3D3D" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// 用户节点图标SVG组件
const UserNodeIcon = ({ level }) => {
  const colors = {
    0: '#5671FB', // 自己 - 蓝色
    1: '#FFD700', // 第一层 - 金色
    2: '#FF6B6B', // 第二层 - 红色
    3: '#4ECDC4', // 第三层 - 青色
  };
  
  const color = colors[level] || '#9D9D9D';
  
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2"/>
      <circle cx="16" cy="12" r="4" stroke={color} strokeWidth="1.5" fill="none"/>
      <path d="M8 24c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

// 展开/收起图标SVG组件
const ExpandIcon = ({ isExpanded }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none"
    className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
  >
    <path 
      d="M6 4L10 8L6 12" 
      stroke="#9D9D9D" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 树节点组件
const TreeNode = ({ node, level = 0, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // 默认展开前两层
  const hasChildren = node.direct_referrals && node.direct_referrals.length > 0;

  return (
    <div className="relative">
      {/* 节点内容 */}
      <div className="flex items-center gap-3 py-2">
        {/* 层级缩进 */}
        {level > 0 && (
          <div className="flex items-center">
            {Array.from({ length: level }).map((_, i) => (
              <div key={i} className="w-6" />
            ))}
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#3D3D3D] rounded-full" />
            </div>
          </div>
        )}
        
        {/* 用户图标 */}
        <UserNodeIcon level={level} />
        
        {/* 用户信息 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] md:text-sm text-white font-medium">
              {level === 0 ? '我' : `用户 ${node.user_id}`}
            </span>
            <span className="text-[12px] md:text-xs text-[#949E9E]">
              {node.invite_code}
            </span>
          </div>
          {level > 0 && (
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[12px] md:text-xs text-[#949E9E]">
                交易: ${node.total_bet || '0.00'}
              </span>
              <span className="text-[12px] md:text-xs text-[#949E9E]">
                下级: {node.referrals_count || 0}人
              </span>
            </div>
          )}
        </div>
        
        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors"
          >
            <ExpandIcon isExpanded={isExpanded} />
          </button>
        )}
      </div>
      
      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="ml-3 border-l border-[#3D3D3D] pl-3">
          {node.direct_referrals.map((child, index) => (
            <TreeNode
              key={child.user_id}
              node={child}
              level={level + 1}
              isLast={index === node.direct_referrals.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ReferralTreeCard = ({ onBack, onClose }) => {
  const { t } = useTranslation();
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取推荐树数据
  const fetchReferralTree = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await referralService.getMyReferralTree();
      if (result.success) {
        setTreeData(result.data.tree);
      }
    } catch (error) {
      console.error('获取推荐树失败:', error);
      setError(error.message || '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralTree();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10">
        <div className="text-[#e4e7e7] text-[14px] md:text-sm">
          {t('common.loading')}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10">
        <div className="text-red-400 text-[14px] md:text-sm mb-4">
          {error}
        </div>
        <button
          onClick={fetchReferralTree}
          className="px-4 py-2 bg-[#5671FB] text-white rounded-lg text-[12px] md:text-sm"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* 统计概览 */}
      {treeData?.stats && (
        <div className="bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl p-[16px] md:p-4 mb-[16px] md:mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-[18px] md:text-xl font-bold text-white">
                {treeData.stats.total_levels}
              </div>
              <div className="text-[12px] md:text-xs text-[#949E9E]">
                {t('wallet.total_levels')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[18px] md:text-xl font-bold text-white">
                {treeData.stats.total_referrals}
              </div>
              <div className="text-[12px] md:text-xs text-[#949E9E]">
                {t('wallet.total_referrals')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[18px] md:text-xl font-bold text-[#FFD700]">
                ${treeData.stats.total_volume}
              </div>
              <div className="text-[12px] md:text-xs text-[#949E9E]">
                {t('wallet.total_volume')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 推荐树 */}
      <div className="bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl p-[16px] md:p-4 flex-1">
        <div className="mb-4">
          <h3 className="text-[16px] md:text-lg font-semibold text-white">
            {t('wallet.referral_network')}
          </h3>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {treeData ? (
            <TreeNode node={treeData} level={0} />
          ) : (
            <div className="text-center py-8">
              <div className="text-[#949E9E] text-[14px] md:text-sm">
                {t('wallet.no_referrals')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralTreeCard;
