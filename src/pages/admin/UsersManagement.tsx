import { Power, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${id}/active`, { isActive });
      toast.success(isActive ? 'Đã kích hoạt' : 'Đã vô hiệu hóa');
      load();
    } catch {
      toast.error('Update failed !');
    }
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Người dùng</h2>
        <p className="text-gray-600">Quản lý tài khoản người dùng (role user)</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc email" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div><p className="mt-4 text-gray-600">Đang tải...</p></div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="p-4">Tên</th>
                <th className="p-4">Email</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-700">{u.email}</td>
                  <td className="p-4">
                    {u.isActive ? <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">Active</span> : <span className="px-2 py-1 text-xs rounded bg-red-50 text-red-700">Deactivated</span>}
                  </td>
                  <td className="p-4 text-right">
                    {u.isActive ? (
                      <button onClick={() => toggleActive(u._id, false)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50">
                        <Power className="h-4 w-4" /> Vô hiệu hóa
                      </button>
                    ) : (
                      <button onClick={() => toggleActive(u._id, true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-green-200 text-green-700 hover:bg-green-50">
                        <Power className="h-4 w-4" /> Kích hoạt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;


