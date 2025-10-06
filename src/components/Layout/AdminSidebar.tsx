import { Apple, ChevronDown, ChevronRight, Dumbbell, LayoutDashboard, User, ClipboardList } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/admin/dashboard' },
    { icon: Apple, label: 'Quản lý món ăn', href: '/admin/nutrition/meals' },
    { icon: ClipboardList, label: 'Kế hoạch ngày', href: '/admin/nutrition/plans' },
    { icon: ClipboardList, label: 'Kế hoạch tuần', href: '/admin/nutrition/weekly-plans' },
    { icon: Dumbbell, label: 'Quản lý bài tập', href: '/admin/workouts/exercises' },
    { icon: User, label: 'Người dùng', href: '/admin/users' },
  ];

  const isMenuActive = (href: string, children?: { href: string }[]) => {
    if (location.pathname === href) return true;
    if (children) {
      return children.some(child => location.pathname === child.href);
    }
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/admin/dashboard" className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">GymNet</span>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

     
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuActive(item.href, item.children);
            
            return (
              <div key={item.href}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => setExpanded(expanded === item.href ? null : item.href)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {expanded === item.href ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expanded === item.href && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const childIsActive = location.pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={`block rounded-lg px-3 py-2 transition-all ${
                                childIsActive
                                  ? 'bg-primary-50 text-primary-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
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
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="mt-auto p-4 border-t sticky bottom-0 bg-white">
        <button
          onClick={() => {
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            } catch {}
            window.location.href = '/login';
          }}
          className="w-full px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

