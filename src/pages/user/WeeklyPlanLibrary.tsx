import { Edit2, Loader2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface Totals {
  caloriesIn: number;
  caloriesOut: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface WeeklyPlanItem {
  _id: string;
  name: string;
  description?: string;
  isCommon: boolean;
  totals?: Totals;
  days?: {
    monday?: string | DailyPlan;
    tuesday?: string | DailyPlan;
    wednesday?: string | DailyPlan;
    thursday?: string | DailyPlan;
    friday?: string | DailyPlan;
    saturday?: string | DailyPlan;
    sunday?: string | DailyPlan;
  };
}

interface DailyPlan { _id: string; name: string; totals?: { caloriesIn: number; carbs: number; protein: number; fat: number; caloriesOut: number } }
const days = [
  { key: 'monday', label: 'Thứ 2' },
  { key: 'tuesday', label: 'Thứ 3' },
  { key: 'wednesday', label: 'Thứ 4' },
  { key: 'thursday', label: 'Thứ 5' },
  { key: 'friday', label: 'Thứ 6' },
  { key: 'saturday', label: 'Thứ 7' },
  { key: 'sunday', label: 'Chủ nhật' },
];

const WeeklyPlanLibrary = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WeeklyPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterIsCommon, setFilterIsCommon] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WeeklyPlanItem | null>(null);
  const [viewingItem, setViewingItem] = useState<WeeklyPlanItem | null>(null);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [formData, setFormData] = useState({ name: '', description: '', days: {} as Record<string, string> });
  
  // AI Plan Generation states
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState<{
    name: string;
    description?: string;
    days: {
      monday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
      tuesday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
      wednesday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
      thursday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
      friday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
      saturday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
      sunday?: { name: string; description?: string; meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>; exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }> };
    };
  } | null>(null);
  const [acceptingAI, setAcceptingAI] = useState(false);

  const isPremium = user?.subscriptionStatus === 'premium' || 
    (user?.isVip && user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterIsCommon !== 'all') params.isCommon = filterIsCommon;
      const [wps, dps] = await Promise.all([
        api.get('/user/weekly-plans', { params }),
        api.get('/user/plans'),
      ]);
      setItems(wps.data.data);
      setDailyPlans(dps.data.data);
    } catch {
      toast.error('Không thể tải danh sách kế hoạch tuần. Hãy thử lại');
    } finally {
      setLoading(false);
    }
  }, [search, filterIsCommon]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string, isCommon: boolean) => {
    if (isCommon) {
      toast.error('Không thể xóa kế hoạch tuần dùng chung. Hãy thử lại');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa kế hoạch tuần này?')) return;
    try {
      await api.delete(`/user/weekly-plans/${id}`);
      toast.success('Xóa kế hoạch tuần thành công');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xóa kế hoạch tuần';
      toast.error(message);
    }
  };

  const stripHtml = (html?: string): string => (html ? html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '');

  const totalsPreview = useMemo(() => {
    const map = new Map(dailyPlans.map(p => [p._id, p]));
    return Object.values(formData.days).reduce((acc, id) => {
      const p = map.get(id);
      if (!p || !p.totals) return acc;
      return {
        caloriesIn: acc.caloriesIn + (p.totals.caloriesIn || 0),
        carbs: acc.carbs + (p.totals.carbs || 0),
        protein: acc.protein + (p.totals.protein || 0),
        fat: acc.fat + (p.totals.fat || 0),
        caloriesOut: acc.caloriesOut + (p.totals.caloriesOut || 0),
      };
    }, { caloriesIn: 0, carbs: 0, protein: 0, fat: 0, caloriesOut: 0 });
  }, [formData.days, dailyPlans]);

  const startCreate = () => { setShowForm(true); setEditing(null); setFormData({ name: '', description: '', days: {} }); };
  
  const startAICreate = () => {
    setShowAIDialog(true);
    setAiPrompt('');
    setAiGeneratedPlan(null);
  };

  const samplePrompts = [
    'Tạo kế hoạch tuần giảm cân với các bữa ăn ít carbs và bài tập đa dạng',
    'Kế hoạch tuần tăng cơ với nhiều protein, tập luyện cách ngày',
    'Kế hoạch tuần cân bằng dinh dưỡng và tập luyện vừa phải',
    'Kế hoạch tuần cho người bận rộn, dễ chuẩn bị và thực hiện',
  ];

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Bạn vui lòng nhập yêu cầu');
      return;
    }

    try {
      setGeneratingAI(true);
      // Increase timeout to 5 minutes for weekly plan AI generation (more complex)
      const res = await api.post('/user/weekly-plans/ai/generate', { prompt: aiPrompt }, {
        timeout: 300000, // 5 minutes
      });
      
      if (res.data.success && res.data.data) {
        setAiGeneratedPlan(res.data.data);
        toast.success('Tạo kế hoạch tuần thành công!');
      } else {
        toast.error('Không thể tạo kế hoạch với AI');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.');
      } else {
        const message = error.response?.data?.message || 'Không thể tạo kế hoạch với AI';
        toast.error(message);
      }
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAIAccept = async () => {
    if (!aiGeneratedPlan) return;

    try {
      setAcceptingAI(true);
      const res = await api.post('/user/weekly-plans/ai/accept', aiGeneratedPlan);
      
      if (res.data.success) {
        toast.success('Đã tạo kế hoạch tuần thành công!');
        setShowAIDialog(false);
        setAiPrompt('');
        setAiGeneratedPlan(null);
        load();
      } else {
        toast.error('Không thể tạo kế hoạch tuần');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tạo kế hoạch tuần';
      toast.error(message);
    } finally {
      setAcceptingAI(false);
    }
  };
  const startEdit = (wp: WeeklyPlanItem) => {
    if (wp.isCommon) {
      toast.error('Không thể chỉnh sửa kế hoạch tuần dùng chung');
      return;
    }
    const daysData = wp.days || {};
    const convertedDays: Record<string, string> = {};
    Object.keys(daysData).forEach((key) => {
      const dayValue = daysData[key as keyof typeof daysData];
      if (typeof dayValue === 'string') {
        convertedDays[key] = dayValue;
      } else if (typeof dayValue === 'object' && dayValue !== null && '_id' in dayValue) {
        convertedDays[key] = String((dayValue as DailyPlan)._id);
      }
    });
    setShowForm(true);
    setEditing(wp);
    setFormData({ name: wp.name, description: stripHtml(wp.description), days: convertedDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) { toast.error('Nhập tên kế hoạch tuần'); return; }
      const payload = { ...formData };
      if (editing) {
        await api.put(`/user/weekly-plans/${editing._id}`, payload);
        toast.success('Cập nhật kế hoạch tuần thành công');
      } else {
        await api.post('/user/weekly-plans', payload);
        toast.success('Tạo kế hoạch tuần thành công');
      }
      setShowForm(false); setEditing(null); setFormData({ name: '', description: '', days: {} });
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Thư viện kế hoạch tuần</h2>
        <p className="text-gray-600">Kế hoạch tuần dùng chung và của bạn</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Tìm kiếm kế hoạch tuần..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterIsCommon}
            onChange={(e) => setFilterIsCommon(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Tất cả</option>
            <option value="true">Dùng chung</option>
            <option value="false">Của tôi</option>
          </select>
          <button onClick={load} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
            Tìm kiếm
          </button>
          <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
            <Plus className="h-5 w-5" />
            Thêm kế hoạch tuần
          </button>
          {isPremium && (
            <button
              onClick={startAICreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              Tạo với AI
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h3 className="text-2xl font-bold">{editing ? 'Chỉnh sửa kế hoạch tuần' : 'Thêm kế hoạch tuần'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên kế hoạch tuần *</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={4} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {days.map(d => (
                  <div key={d.key} className="bg-gray-50 p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{d.label}</label>
                    <select value={formData.days[d.key] || ''} onChange={e => setFormData(prev => ({ ...prev, days: { ...prev.days, [d.key]: e.target.value } }))} className="w-full px-3 py-2 border rounded bg-white">
                      <option value="">Chọn daily plan</option>
                      {dailyPlans.map(p => (<option key={p._id} value={p._id}>{p.name}</option>))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Tổng quan (ước tính)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2"><div className="text-gray-600">Calo nạp</div><div className="font-semibold">{totalsPreview.caloriesIn}</div></div>
                  <div className="bg-gray-50 rounded p-2"><div className="text-gray-600">Calo tiêu thụ</div><div className="font-semibold">{totalsPreview.caloriesOut}</div></div>
                  <div className="bg-gray-50 rounded p-2"><div className="text-gray-600">Carbs</div><div className="font-semibold">{totalsPreview.carbs}g</div></div>
                  <div className="bg-gray-50 rounded p-2"><div className="text-gray-600">Protein</div><div className="font-semibold">{totalsPreview.protein}g</div></div>
                  <div className="bg-gray-50 rounded p-2 col-span-2"><div className="text-gray-600">Fat</div><div className="font-semibold">{totalsPreview.fat}g</div></div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">Chưa có kế hoạch tuần</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <div 
              key={p._id} 
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 ${p.isCommon ? 'cursor-pointer' : ''}`}
              onClick={async () => {
                if (p.isCommon) {
                  // Load lại weekly plan với đầy đủ thông tin
                  try {
                    const wpsRes = await api.get('/user/weekly-plans');
                    const allWps = wpsRes.data.data as WeeklyPlanItem[];
                    const wpData = allWps.find((item) => String(item._id) === String(p._id));
                    if (wpData) {
                      setViewingItem(wpData);
                    } else {
                      setViewingItem(p);
                    }
                  } catch {
                    setViewingItem(p);
                  }
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                {p.isCommon && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Dùng chung</span>}
              </div>
              {p.description && <p className="text-sm text-gray-600 line-clamp-2 mb-4">{stripHtml(p.description)}</p>}
                {p.totals && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg p-3 mb-4">
                    <div><span className="text-gray-500">Calo nạp:</span> <span className="font-semibold text-gray-900">{p.totals.caloriesIn}</span></div>
                    <div><span className="text-gray-500">Calo tiêu thụ:</span> <span className="font-semibold text-gray-900">{p.totals.caloriesOut}</span></div>
                    <div><span className="text-gray-500">Carbs:</span> <span className="font-semibold text-gray-900">{p.totals.carbs}g</span></div>
                    <div><span className="text-gray-500">Protein:</span> <span className="font-semibold text-gray-900">{p.totals.protein}g</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Fat:</span> <span className="font-semibold text-gray-900">{p.totals.fat}g</span></div>
                  </div>
                )}
              {!p.isCommon && (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => startEdit(p)} className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm flex items-center justify-center gap-1">
                    <Edit2 className="h-4 w-4" />
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(p._id, p.isCommon)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{viewingItem.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mt-2 inline-block">Dùng chung</span>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {viewingItem.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{stripHtml(viewingItem.description)}</p>
                  </div>
                </div>
              )}

              {viewingItem.days && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Kế hoạch theo ngày</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {days.map((d) => {
                      const dayPlanId = viewingItem.days?.[d.key as keyof typeof viewingItem.days];
                      let dayPlan: DailyPlan | undefined;
                      
                      if (dayPlanId) {
                        if (typeof dayPlanId === 'object' && dayPlanId !== null && '_id' in dayPlanId) {
                          dayPlan = dayPlanId as DailyPlan;
                        } else {
                          dayPlan = dailyPlans.find(p => p._id === String(dayPlanId));
                        }
                      }
                      
                      return (
                        <div key={d.key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">{d.label}</div>
                          {dayPlan ? (
                            <div className="text-gray-900">
                              <div className="font-semibold">{dayPlan.name}</div>
                              {dayPlan.totals && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {dayPlan.totals.caloriesIn} cal in • {dayPlan.totals.caloriesOut} cal out
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">Chưa có kế hoạch</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Weekly Plan Generation Dialog */}
      {showAIDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !generatingAI && !acceptingAI && setShowAIDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Tạo Kế Hoạch Tuần Với AI
              </h3>
              <button
                onClick={() => {
                  if (!generatingAI && !acceptingAI) {
                    setShowAIDialog(false);
                    setAiPrompt('');
                    setAiGeneratedPlan(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50"
                disabled={generatingAI || acceptingAI}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!aiGeneratedPlan ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhập yêu cầu của bạn
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ví dụ: Tạo kế hoạch tuần giảm cân với các bữa ăn ít carbs và bài tập đa dạng..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      disabled={generatingAI}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt mẫu (click để sử dụng)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {samplePrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiPrompt(prompt)}
                          className="text-left px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-purple-300 transition-all"
                          disabled={generatingAI}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAIDialog(false);
                        setAiPrompt('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={generatingAI}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={generatingAI || !aiPrompt.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingAI ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Tạo Kế Hoạch Tuần
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Kế hoạch tuần đã được tạo!</span>
                    </div>
                    <p className="text-sm text-green-700">Xem lại kế hoạch tuần bên dưới và nhấn "Chấp nhận" để lưu vào thư viện của bạn.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">{aiGeneratedPlan.name}</h4>
                    {aiGeneratedPlan.description && (
                      <p className="text-gray-600 text-sm mb-4">{aiGeneratedPlan.description}</p>
                    )}

                    <div className="space-y-3">
                      {days.map((d) => {
                        const dayData = aiGeneratedPlan.days[d.key as keyof typeof aiGeneratedPlan.days];
                        if (!dayData) return null;

                        return (
                          <div key={d.key} className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="font-medium text-gray-800 mb-2">{d.label}: {dayData.name}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Bữa ăn:</span>{' '}
                                <span className="font-medium">
                                  {dayData.meals.reduce((sum, m) => sum + m.meal.calories, 0)} cal
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {dayData.meals.length} bữa
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Bài tập:</span>{' '}
                                <span className="font-medium">
                                  {dayData.exercises.reduce((sum, e) => sum + e.exercise.caloriesBurned, 0)} cal
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {dayData.exercises.length} bài tập
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAiGeneratedPlan(null);
                        setAiPrompt('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={acceptingAI}
                    >
                      Tạo lại
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAIDialog(false);
                        setAiPrompt('');
                        setAiGeneratedPlan(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={acceptingAI}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAIAccept}
                      disabled={acceptingAI}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {acceptingAI ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        'Chấp nhận'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanLibrary;
