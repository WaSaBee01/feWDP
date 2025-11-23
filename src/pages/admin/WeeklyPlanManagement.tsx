import { ContentState, convertFromHTML, convertToRaw, Editor, EditorState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import draftToHtml from 'draftjs-to-html';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan { _id: string; name: string; totals: { caloriesIn: number; carbs: number; protein: number; fat: number; caloriesOut: number } }
interface WeeklyPlan {
  _id: string;
  name: string;
  description?: string;
  days: Record<string, string>;
  totals: DailyPlan['totals'];
}

const days = [
  { key: 'monday', label: 'Thứ 2' },
  { key: 'tuesday', label: 'Thứ 3' },
  { key: 'wednesday', label: 'Thứ 4' },
  { key: 'thursday', label: 'Thứ 5' },
  { key: 'friday', label: 'Thứ 6' },
  { key: 'saturday', label: 'Thứ 7' },
  { key: 'sunday', label: 'Chủ nhật' },
];

const WeeklyPlanManagement = () => {
  const [items, setItems] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WeeklyPlan | null>(null);
  const [formData, setFormData] = useState({ name: '', days: {} as Record<string, string>, goal: 'healthy_lifestyle' as 'healthy_lifestyle' | 'weight_loss' | 'muscle_gain' });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => { loadAll(); }, [search]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { isCommon: 'true' };
      if (search) params.search = search;
      const [wps, dps] = await Promise.all([
        api.get('/admin/weekly-plans', { params }),
        api.get('/admin/plans', { params: { isCommon: 'true' } }),
      ]);
      setItems(wps.data.data);
      setDailyPlans(dps.data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally { setLoading(false); }
  };

  const totalsPreview = useMemo(() => {
    const map = new Map(dailyPlans.map(p => [p._id, p]));
    return Object.values(formData.days).reduce((acc, id) => {
      const p = map.get(id);
      if (!p) return acc;
      return {
        caloriesIn: acc.caloriesIn + p.totals.caloriesIn,
        carbs: acc.carbs + p.totals.carbs,
        protein: acc.protein + p.totals.protein,
        fat: acc.fat + p.totals.fat,
        caloriesOut: acc.caloriesOut + p.totals.caloriesOut,
      };
    }, { caloriesIn: 0, carbs: 0, protein: 0, fat: 0, caloriesOut: 0 });
  }, [formData.days, dailyPlans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) { toast.error('Nhập tên kế hoạch tuần'); return; }
      const description = draftToHtml(convertToRaw(editorState.getCurrentContent()));
      const payload = { ...formData, description };
      if (editing) {
        await api.put(`/admin/weekly-plans/${editing._id}`, payload);
        toast.success('Cập nhật kế hoạch tuần thành công');
      } else {
        await api.post('/admin/weekly-plans', payload);
        toast.success('Tạo kế hoạch tuần thành công');
      }
      setShowForm(false); setEditing(null); setFormData({ name: '', days: {}, goal: 'healthy_lifestyle' }); setEditorState(EditorState.createEmpty()); loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const startCreate = () => { setShowForm(true); setEditing(null); setFormData({ name: '', days: {}, goal: 'healthy_lifestyle' }); setEditorState(EditorState.createEmpty()); };
  const startEdit = (wp: WeeklyPlan) => {
    setShowForm(true);
    setEditing(wp);
    
    // Convert days from populated objects to string IDs
    const daysData = (wp as any).days || {};
    const convertedDays: Record<string, string> = {};
    Object.keys(daysData).forEach((key) => {
      const dayValue = daysData[key];
      if (typeof dayValue === 'string') {
        convertedDays[key] = dayValue;
      } else if (typeof dayValue === 'object' && dayValue !== null && '_id' in dayValue) {
        convertedDays[key] = String(dayValue._id);
      }
    });
    
    setFormData({ name: wp.name, days: convertedDays, goal: (wp as any).goal || 'healthy_lifestyle' });
    if ((wp as any).description) {
      const blocks = convertFromHTML((wp as any).description);
      const content = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
      setEditorState(EditorState.createWithContent(content));
    } else { setEditorState(EditorState.createEmpty()); }
  };
  const remove = async (id: string) => { if (!confirm('Xóa kế hoạch tuần này?')) return; await api.delete(`/admin/weekly-plans/${id}`); toast.success('Đã xóa'); loadAll(); };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Kế hoạch tuần (Weekly Plan)</h2>
        <p className="text-gray-600">Gom các kế hoạch ngày vào từng ngày trong tuần</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kế hoạch tuần..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"><Plus className="h-5 w-5" /> Thêm weekly plan</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h3 className="text-2xl font-bold">{editing ? 'Chỉnh sửa weekly plan' : 'Thêm weekly plan'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên weekly plan *</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mục tiêu</label>
                <select value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })} className="w-full px-3 py-2 border rounded bg-white">
                  <option value="healthy_lifestyle">Sống khỏe</option>
                  <option value="weight_loss">Giảm cân</option>
                  <option value="muscle_gain">Tăng cơ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <div className="min-h-[200px] px-3 py-2 border rounded bg-white">
                  <Editor editorState={editorState} onChange={setEditorState} placeholder="Nhập mô tả..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {days.map(d => (
                  <div key={d.key} className="bg-gray-50 p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{d.label}</label>
                    <select value={formData.days[d.key] || ''} onChange={e => setFormData(prev => ({ ...prev, days: { ...prev.days, [d.key]: e.target.value } }))} className="w-full px-3 py-2 border rounded bg-white">
                      <option value="">Chọn daily plan</option>
                      {dailyPlans.map(p => (
                        <option key={p._id} value={p._id}>{p.name} — {p.totals.caloriesIn} cal</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                <div><span className="text-gray-600">Calo nạp:</span> <span className="font-medium">{totalsPreview.caloriesIn}</span></div>
                <div><span className="text-gray-600">Carbs:</span> <span className="font-medium">{totalsPreview.carbs}g</span></div>
                <div><span className="text-gray-600">Protein:</span> <span className="font-medium">{totalsPreview.protein}g</span></div>
                <div><span className="text-gray-600">Fat:</span> <span className="font-medium">{totalsPreview.fat}g</span></div>
                <div><span className="text-gray-600">Calo tiêu thụ:</span> <span className="font-medium">{totalsPreview.caloriesOut}</span></div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div><p className="mt-4 text-gray-600">Đang tải...</p></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-600">Chưa có weekly plan nào</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(wp => (
            <div key={wp._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{wp.name}</h3>
                  <div className="flex gap-2 items-center">
                    <span className="px-2 py-1 text-xs rounded bg-primary-50 text-primary-700">{(wp as any).goal === 'weight_loss' ? 'Giảm cân' : (wp as any).goal === 'muscle_gain' ? 'Tăng cơ' : 'Sống khỏe'}</span>
                    <button onClick={() => startEdit(wp)} className="text-primary-600 text-sm">Sửa</button>
                    <button onClick={() => remove(wp._id)} className="text-red-600 text-sm">Xóa</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div><span className="text-gray-600">Calo nạp:</span> <span className="font-medium">{wp.totals.caloriesIn}</span></div>
                  <div><span className="text-gray-600">Calo tiêu thụ:</span> <span className="font-medium">{wp.totals.caloriesOut}</span></div>
                  <div><span className="text-gray-600">Carbs:</span> <span className="font-medium">{wp.totals.carbs}g</span></div>
                  <div><span className="text-gray-600">Protein:</span> <span className="font-medium">{wp.totals.protein}g</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanManagement;


