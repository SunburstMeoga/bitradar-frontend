import { useLocation, useNavigate } from 'react-router-dom';

// 导入图标
import tradeIcon from '../../assets/icons/trade.png';
import tradeActiveIcon from '../../assets/icons/trade-active.png';
import historyIcon from '../../assets/icons/history.png';
import historyActiveIcon from '../../assets/icons/history-active.png';
import accountIcon from '../../assets/icons/account.png';
import accountActiveIcon from '../../assets/icons/account-active.png';

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 导航项配置
  const navItems = [
    {
      key: 'trade',
      label: 'Trade',
      path: '/',
      icon: tradeIcon,
      activeIcon: tradeActiveIcon,
    },
    {
      key: 'history',
      label: 'History',
      path: '/history',
      icon: historyIcon,
      activeIcon: historyActiveIcon,
    },
    {
      key: 'account',
      label: 'Account',
      path: '/account',
      icon: accountIcon,
      activeIcon: accountActiveIcon,
    },
  ];

  // 判断是否为当前路径
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 处理导航点击
  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <footer className="fixed bottom-0 left-0 w-full z-[100]" style={{ backgroundColor: '#1f1f1f' }}>
      <div className="flex px-[8vw] py-[12vw]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div
              key={item.key}
              className="flex-1 h-[42vw] flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-all"
              onClick={() => handleNavClick(item.path)}
            >
              <div className="flex items-center justify-center mb-[2vw]">
                <img
                  src={active ? item.activeIcon : item.icon}
                  alt={item.label}
                  className="w-[24vw] h-[24vw] object-contain"
                />
              </div>
              <div
                className={`text-[11vw] font-medium text-center leading-none ${
                  active ? 'text-[#c5ff33]' : 'text-[#8f8f8f]'
                }`}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};

export default Footer;
