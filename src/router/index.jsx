import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import History from '../pages/History';
import Account from '../pages/Account';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
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
    path: '*',
    element: <NotFound />,
  },
]);
