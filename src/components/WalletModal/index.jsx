import { useState, useRef, useEffect } from 'react';
import { useWeb3Store } from '../../store';
import SlideModal from '../SlideModal';
import SendCard from '../SendCard';
import ActivityCard from '../ActivityCard';
import WalletCard from '../WalletCard';



const WalletModal = ({ isOpen, onClose }) => {
  const { account } = useWeb3Store();
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 0: 钱包卡片, 1: Send卡片, 2: Activity卡片
  const cardRefs = useRef([]);

  // 处理卡片切换
  const handleCardChange = (index) => {
    setCurrentCardIndex(index);
  };

  // 返回到钱包卡片
  const handleBackToWallet = () => {
    setCurrentCardIndex(0);
  };

  // 将cardRefs传递给SlideModal
  useEffect(() => {
    // 这里可以添加额外的逻辑，如果需要的话
  }, [currentCardIndex]);

  if (!account) return null;

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      currentIndex={currentCardIndex}
      onIndexChange={handleCardChange}
      totalCards={3}
      cardRefs={cardRefs}
    >
      {/* 钱包卡片 */}
      <div
        ref={el => cardRefs.current[0] = el}
        className="w-full flex-shrink-0"
      >
        <WalletCard
          onClose={onClose}
          onSendClick={() => setCurrentCardIndex(1)}
          onActivityClick={() => setCurrentCardIndex(2)}
        />
      </div>

      {/* Send卡片 */}
      <div
        ref={el => cardRefs.current[1] = el}
        className="w-full flex-shrink-0"
      >
        <SendCard
          onBack={handleBackToWallet}
          onClose={onClose}
        />
      </div>

      {/* Activity卡片 */}
      <div
        ref={el => cardRefs.current[2] = el}
        className="w-full flex-shrink-0"
      >
        <ActivityCard
          onBack={handleBackToWallet}
          onClose={onClose}
        />
      </div>
    </SlideModal>
  );
};

export default WalletModal;
