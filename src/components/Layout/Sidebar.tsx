import { Activity, CalendarDays, CalendarRange, Crown, Dumbbell, LayoutDashboard, Settings, User, Utensils } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  highlight?: boolean;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isVipActive = user?.isVip && user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();

  // Main menu items
  const mainMenuItems: MenuItem[] = [
    { icon: Activity, label: 'Tiến trình', href: '/progress' },
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/dashboard' },
    { icon: Utensils, label: 'Thư viện món ăn', href: '/nutrition' },
    { icon: CalendarDays, label: 'Kế hoạch ngày', href: '/nutrition/plans' },
    { icon: CalendarRange, label: 'Kế hoạch tuần', href: '/nutrition/weekly-plans' },
    // { icon: NotebookText, label: 'Nhật ký ăn uống', href: '/nutrition/diary' },
    { icon: Dumbbell, label: 'Luyện tập', href: '/workouts' },
  ];

  // VIP menu item
  const vipMenuItem: MenuItem = {
    icon: Crown,
    label: 'Nâng Cấp VIP',
    href: '/pricing',
    highlight: !isVipActive,
  };

  // Settings menu item
  const settingsMenuItem: MenuItem = { icon: Settings, label: 'Cài đặt', href: '/settings' };

  const isMenuActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">GymNet</span>
        </Link>
      </div>

      {/* Menu */}
      <div className="p-4 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider before settings/VIP for non-VIP users */}
          {!isVipActive && <div className="my-2 border-t border-gray-200"></div>}

          {/* VIP menu item for non-VIP users (with highlight) */}
          {!isVipActive && (() => {
            const Icon = vipMenuItem.icon;
            const isActive = isMenuActive(vipMenuItem.href);
            
            return (
              <Link
                to={vipMenuItem.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 font-medium border border-orange-200'
                    : 'text-orange-600 hover:bg-orange-50 hover:text-orange-700 border border-transparent hover:border-orange-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{vipMenuItem.label}</span>
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                  NEW
                </span>
              </Link>
            );
          })()}

          {/* Settings */}
          {(() => {
            const Icon = settingsMenuItem.icon;
            const isActive = isMenuActive(settingsMenuItem.href);
            
            return (
              <Link
                to={settingsMenuItem.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{settingsMenuItem.label}</span>
              </Link>
            );
          })()}

          {/* VIP status section for VIP users */}
          {isVipActive && user?.vipExpiresAt && (() => {
            const expiresAt = new Date(user.vipExpiresAt);
            const now = new Date();
            const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <>
                <div className="my-2 border-t border-gray-200"></div>
                <div className="px-3 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-900">Gói VIP của bạn</span>
                  </div>
                  <div className="text-xs text-orange-700 mb-1">
                    Hết hạn: {expiresAt.toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  {daysRemaining > 0 && (
                    <div className="text-xs text-orange-600 font-medium mb-2">
                      Còn lại: {daysRemaining} {daysRemaining === 1 ? 'ngày' : 'ngày'}
                    </div>
                  )}
                  <Link
                    to={vipMenuItem.href}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium underline inline-block"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              </>
            );
          })()}
        </nav>
      </div>

      {/* User Info at bottom */}
      {user && (
        <div className="mt-auto border-t border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {user.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {user.subscriptionStatus === 'premium' || isVipActive ? (
                  <>
                    <Crown className="h-3 w-3 text-orange-500 flex-shrink-0" />
                    <span className="text-xs text-orange-600 font-medium">Premium</span>
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 font-medium">Free</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
