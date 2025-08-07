import { createBrowserRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import SecondaryLayout from '../components/Layout/SecondaryLayout';
import Trade from '../pages/Trade';
import Home from '../pages/Home';
import History from '../pages/History';
import Account from '../pages/Account';
import NetworkDetails from '../pages/NetworkDetails';
import NotFound from '../pages/NotFound';

// 创建一个包装组件来提供标题
const NetworkDetailsWrapper = () => {
  const { t } = useTranslation();
  return (
    <SecondaryLayout title={t('network_details.title')}>
      <NetworkDetails />
    </SecondaryLayout>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Trade />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'account',
        element: <Account />,
      },
    ],
  },
  {
    path: '/network-details',
    element: <NetworkDetailsWrapper />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
