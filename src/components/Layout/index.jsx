import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import ResponsiveContainer from './ResponsiveContainer';
import ScrollToTop from '../ScrollToTop';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#121212' }}>
      <ScrollToTop />
      <ResponsiveContainer>
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </ResponsiveContainer>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#2a2a2a',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            padding: '8px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;
