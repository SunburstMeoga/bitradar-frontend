import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import networkService from '../../services/networkService';
import toast from 'react-hot-toast';

const ReferralBindModal = ({ isOpen, onClose, walletAddress }) => {
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  // 处理绑定推荐关系
  const handleBind = async () => {
    if (!referralCode.trim()) {
      toast.error('请输入推荐码');
      return;
    }

    if (!walletAddress) {
      toast.error('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      
      const response = await networkService.bindReferral({
        referral_code: referralCode.trim(),
        wallet_address: walletAddress
      });

      if (response.success) {
        toast.success(t('network_details.referral_bind.success'));
        setReferralCode('');
        onClose();
      } else {
        throw new Error(response.message || '绑定失败');
      }
    } catch (error) {
      console.error('绑定推荐关系失败:', error);
      toast.error(error.message || t('network_details.referral_bind.failed'));
    } finally {
      setLoading(false);
    }
  };

  // 处理关闭模态框
  const handleClose = () => {
    if (!loading) {
      setReferralCode('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-[16vw] md:px-4">
      <div 
        className="bg-gray-800 rounded-[12vw] md:rounded-xl p-[20vw] md:p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex justify-between items-center mb-[20vw] md:mb-5">
          <h2 className="text-white text-size-[18vw] md:text-xl font-semibold">
            {t('network_details.referral_bind.title')}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 钱包地址显示 */}
        <div className="mb-[16vw] md:mb-4">
          <label className="block text-[#8f8f8f] text-size-[14vw] md:text-sm mb-[8vw] md:mb-2">
            {t('network_details.referral_bind.wallet_address')}
          </label>
          <div className="bg-gray-700 rounded-[8vw] md:rounded-lg px-[12vw] md:px-3 py-[10vw] md:py-2.5 text-white text-size-[14vw] md:text-sm break-all">
            {walletAddress || '未连接'}
          </div>
        </div>

        {/* 推荐码输入 */}
        <div className="mb-[20vw] md:mb-5">
          <label className="block text-[#8f8f8f] text-size-[14vw] md:text-sm mb-[8vw] md:mb-2">
            {t('network_details.referral_bind.referral_code')}
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="请输入推荐码"
            disabled={loading}
            className="w-full bg-gray-700 border border-gray-600 rounded-[8vw] md:rounded-lg px-[12vw] md:px-3 py-[10vw] md:py-2.5 text-white text-size-[14vw] md:text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* 按钮组 */}
        <div className="flex gap-[12vw] md:gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-gray-600 text-white rounded-[8vw] md:rounded-lg py-[12vw] md:py-3 text-size-[16vw] md:text-base font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleBind}
            disabled={loading || !referralCode.trim() || !walletAddress}
            className="flex-1 bg-blue-600 text-white rounded-[8vw] md:rounded-lg py-[12vw] md:py-3 text-size-[16vw] md:text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                绑定中...
              </>
            ) : (
              t('network_details.referral_bind.bind')
            )}
          </button>
        </div>

        {/* 说明文字 */}
        <div className="mt-[16vw] md:mt-4 text-[#8f8f8f] text-size-[12vw] md:text-xs">
          <p>• 推荐码绑定后不可更改</p>
          <p>• 请确保推荐码正确无误</p>
          <p>• 绑定成功后将建立推荐关系</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralBindModal;
