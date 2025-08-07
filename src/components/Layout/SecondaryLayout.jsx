import { Toaster } from 'react-hot-toast';
import SecondaryHeader from './SecondaryHeader';

const SecondaryLayout = ({ title, onBack, children }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#121212' }}>
      <SecondaryHeader title={title} onBack={onBack} />
      <main className="flex-1">
        {children}
      </main>
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

export default SecondaryLayout;
