import React from 'react';
import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'GymNet', 
  showSidebar = true 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar cố định toàn màn hình như Vuexy */}
      {showSidebar && <Sidebar />}

      {/* Nội dung dịch sang phải 64px (w-64) */}
      <div className="ml-64 min-h-screen flex flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
