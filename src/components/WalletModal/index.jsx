import { useState } from 'react';
import { useWeb3Store } from '../../store';
import SlideModal from '../SlideModal';
import SendCard from '../SendCard';
import ActivityCard from '../ActivityCard';
import WalletCard from '../WalletCard';
import SelectTokenCard from '../SelectTokenCard';

const WalletModal = ({ isOpen, onClose }) => {
  const { account } = useWeb3Store();
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 0: 钱包卡片, 1: Send卡片, 2: Activity卡片, 3: SelectToken卡片

  // 处理卡片切换
  const handleCardChange = (index) => {
    setCurrentCardIndex(index);
  };

  // 返回到钱包卡片
  const handleBackToWallet = () => {
    setCurrentCardIndex(0);
  };

  // 跳转到SelectToken卡片
  const handleSelectToken = () => {
    setCurrentCardIndex(3);
  };

  // 从SelectToken返回到Send卡片
  const handleBackToSend = () => {
    setCurrentCardIndex(1);
  };

  // 处理关闭弹窗
  const handleClose = () => {
    setCurrentCardIndex(0); // 重置到第一个卡片
    onClose();
  };

  if (!account) return null;

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={handleClose}
      currentIndex={currentCardIndex}
      onIndexChange={handleCardChange}
      totalCards={4}
    >
      {/* 钱包卡片 */}
      <WalletCard
        onClose={handleClose}
        onSendClick={() => setCurrentCardIndex(1)}
        onActivityClick={() => setCurrentCardIndex(2)}
      />

      {/* Send卡片 */}
      <SendCard
        onBack={handleBackToWallet}
        onClose={handleClose}
        onSelectToken={handleSelectToken}
      />

      {/* Activity卡片 */}
      <ActivityCard
        onBack={handleBackToWallet}
        onClose={handleClose}
      />

      {/* SelectToken卡片 */}
      <SelectTokenCard
        onBack={handleBackToSend}
        onClose={handleClose}
      />
    </SlideModal>
  );
};

export default WalletModal;
