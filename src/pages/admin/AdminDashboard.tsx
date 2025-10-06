import { Dumbbell, Users, Apple, ClipboardList, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

interface Overview {
  usersActive: number;
  exercises: number;
  meals: number;
  dailyPlans: number;
  weeklyPlans: number;
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 flex items-center justify-center">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="text-gray-600 text-sm">{label}</div>
    </div>
  </div>
);

interface AdminUser { _id: string; name: string; email: string; isActive: boolean }

const AdminDashboard = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const formatNum = (n: number) => new Intl.NumberFormat().format(n);
  const initials = (name: string) => (name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/overview');
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadUsers();
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    await api.put(`/admin/users/${id}/active`, { isActive });
    loadUsers();
    loadOverview();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Tổng quan</h2>
        <p className="text-gray-600 mt-1">Ảnh tình trạng hệ thống và người dùng</p>
      </div>
      {loading || !data ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <StatCard icon={Users} label="Người dùng active" value={formatNum(data.usersActive) as any} />
          <StatCard icon={Dumbbell} label="Bài tập" value={formatNum(data.exercises) as any} />
          <StatCard icon={Apple} label="Món ăn" value={formatNum(data.meals) as any} />
          <StatCard icon={ClipboardList} label="Kế hoạch ngày" value={formatNum(data.dailyPlans) as any} />
          <StatCard icon={ClipboardList} label="Kế hoạch tuần" value={formatNum(data.weeklyPlans) as any} />
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">Người dùng</h3>
          <a href="/admin/users" className="text-primary-600 text-sm hover:underline">Xem tất cả</a>
        </div>
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/60">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(loadingUsers ? [] : users.slice(0, 8)).map(u => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                      {initials(u.name)}
                    </span>
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.email}</td>
                  <td className="px-4 py-3">{u.isActive ? <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">Active</span> : <span className="px-2 py-1 text-xs rounded bg-red-50 text-red-700">Deactivated</span>}</td>
                  <td className="px-4 py-3 text-right">
                    {u.isActive ? (
                      <button onClick={() => toggleActive(u._id, false)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
                        <Power className="h-4 w-4" /> Vô hiệu hóa
                      </button>
                    ) : (
                      <button onClick={() => toggleActive(u._id, true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50">
                        <Power className="h-4 w-4" /> Kích hoạt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(!loadingUsers && users.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>Chưa có người dùng.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


