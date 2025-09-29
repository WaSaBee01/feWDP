import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'GymNet' }) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>

          <nav className="hidden md:flex space-x-6">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tổng quan</Link>
            <Link to="/nutrition" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Dinh dưỡng</Link>
            <Link to="/workouts" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Luyện tập</Link>
            <Link to="/progress" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tiến trình</Link>
            <Link to="/settings" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Cài đặt</Link>
          </nav>

          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn-secondary">Đăng nhập</Link>
                <Link to="/login" className="btn-primary">Đăng ký</Link>
              </>
            ) : (
              <button onClick={logout} className="btn-secondary">Đăng xuất</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
