import { createBrowserRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import SecondaryLayout from '../components/Layout/SecondaryLayout';
import Trade from '../pages/Trade';
import Home from '../pages/Home';
import History from '../pages/History';
import Account from '../pages/Account';
import NetworkDetails from '../pages/NetworkDetails';
import Exchange from '../pages/Exchange';
import Withdraw from '../pages/Withdraw';
import TransactionHistory from '../pages/TransactionHistory';
import ActiveOrders from '../pages/ActiveOrders';
import OrderDetail from '../pages/OrderDetail';
import TestActiveOrders from '../pages/TestActiveOrders';
import TestLayout from '../pages/TestLayout';
import NotFound from '../pages/NotFound';
import PageTitleTest from '../components/PageTitleTest';


// 创建一个包装组件来提供标题
const NetworkDetailsWrapper = () => {
  const { t } = useTranslation();
  return (
    <SecondaryLayout title={t('network_details.title')}>
      <NetworkDetails />
    </SecondaryLayout>
  );
};

// 兑换页面包装组件
const ExchangeWrapper = () => {
  const { t } = useTranslation();
  return (
    <SecondaryLayout title={t('exchange.title')}>
      <Exchange />
    </SecondaryLayout>
  );
};

// 提现页面包装组件
const WithdrawWrapper = () => {
  return (
    <SecondaryLayout title="提现">
      <Withdraw />
    </SecondaryLayout>
  );
};

// 交易记录页面包装组件
const TransactionHistoryWrapper = () => {
  const { t } = useTranslation();
  return (
    <SecondaryLayout title={t('transaction_history.title')}>
      <TransactionHistory />
    </SecondaryLayout>
  );
};

// 活跃订单页面包装组件
const ActiveOrdersWrapper = () => {
  const { t } = useTranslation();
  return (
    <SecondaryLayout title={t('active_orders.title')}>
      <ActiveOrders />
    </SecondaryLayout>
  );
};

// 订单详情页面包装组件
const OrderDetailWrapper = () => {
  const { t } = useTranslation();
  return (
    <SecondaryLayout title={t('order_detail.title')}>
      <OrderDetail />
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
      {
        path: 'test-layout',
        element: <TestLayout />,
      },
    ],
  },
  {
    path: '/network-details',
    element: <NetworkDetailsWrapper />,
  },
  {
    path: '/exchange',
    element: <ExchangeWrapper />,
  },
  {
    path: '/withdraw',
    element: <WithdrawWrapper />,
  },
  {
    path: '/transaction-history',
    element: <TransactionHistoryWrapper />,
  },
  {
    path: '/active-orders',
    element: <ActiveOrdersWrapper />,
  },
  {
    path: '/order/:id',
    element: <OrderDetailWrapper />,
  },
  {
    path: '/test-page-titles',
    element: <PageTitleTest />,
  },
  {
    path: '/test-active-orders',
    element: <TestActiveOrders />,
  },

  {
    path: '*',
    element: <NotFound />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
