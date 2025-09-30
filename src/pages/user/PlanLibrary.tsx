import { Edit2, Loader2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface PlanItem {
  _id: string;
  name: string;
  description?: string;
  isCommon: boolean;
  meals?: Array<{ time: string; meal: string | { _id: string; [key: string]: unknown } }>; // meal có thể là object (populated) hoặc string (ID)
  exercises?: Array<{ time: string; exercise: string | { _id: string; [key: string]: unknown } }>; // exercise có thể là object (populated) hoặc string (ID)
  totals?: {
    caloriesIn: number;
    carbs: number;
    protein: number;
    fat: number;
    caloriesOut: number;
  };
}

interface Meal { _id: string; name: string; calories: number; carbs: number; protein: number; fat: number }
interface Exercise { _id: string; name: string; caloriesBurned: number }
interface PlanItemMeal { time: string; meal: string }
interface PlanItemExercise { time: string; exercise: string }

const PlanLibrary = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterIsCommon, setFilterIsCommon] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PlanItem | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meals: [] as PlanItemMeal[],
    exercises: [] as PlanItemExercise[],
  });
  
  // AI Plan Generation states
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState<{
    name: string;
    description?: string;
    meals: Array<{ time: string; meal: { name: string; description?: string; calories: number; carbs: number; protein: number; fat: number; weightGrams: number } }>;
    exercises: Array<{ time: string; exercise: { name: string; description?: string; durationMinutes: number; caloriesBurned: number; difficulty: string } }>;
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
      const [plansRes, mealsRes, exRes] = await Promise.all([
        api.get('/user/plans', { params }),
        api.get('/user/meals'),
        api.get('/user/exercises'),
      ]);
      setItems(plansRes.data.data);
      setMeals(mealsRes.data.data);
      setExercises(exRes.data.data);
    } catch {
      toast.error('Không thể tải danh sách kế hoạch. Vui long thử lại.');
    } finally {
      setLoading(false);
    }
  }, [search, filterIsCommon]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string, isCommon: boolean) => {
    if (isCommon) {
      toast.error('Không thể xóa kế hoạch này');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;
    try {
      await api.delete(`/user/plans/${id}`);
      toast.success('Xóa kế hoạch thành công');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xóa kế hoạch';
      toast.error(message);
    }
  };

  const stripHtml = (html?: string): string => (html ? html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '');

  const totalsPreview = useMemo(() => {
    let caloriesIn = 0, carbs = 0, protein = 0, fat = 0, caloriesOut = 0;
    const mealMap = new Map(meals.map(m => [m._id, m]));
    const exMap = new Map(exercises.map(e => [e._id, e]));
    formData.meals.forEach(m => {
      const meal = mealMap.get(m.meal);
      if (meal) { caloriesIn += meal.calories; carbs += meal.carbs; protein += meal.protein; fat += meal.fat; }
    });
    formData.exercises.forEach(e => {
      const ex = exMap.get(e.exercise);
      if (ex) caloriesOut += ex.caloriesBurned;
    });
    return { caloriesIn, carbs, protein, fat, caloriesOut };
  }, [formData.meals, formData.exercises, meals, exercises]);

  const addMealRow = () => setFormData(prev => ({ ...prev, meals: [...prev.meals, { time: '', meal: '' }] }));
  const addExerciseRow = () => setFormData(prev => ({ ...prev, exercises: [...prev.exercises, { time: '', exercise: '' }] }));
  const removeMealRow = (idx: number) => setFormData(prev => ({ ...prev, meals: prev.meals.filter((_, i) => i !== idx) }));
  const removeExerciseRow = (idx: number) => setFormData(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }));

  const startCreate = () => { setShowForm(true); setEditing(null); setFormData({ name: '', description: '', meals: [], exercises: [] }); };
  
  const startAICreate = () => {
    setShowAIDialog(true);
    setAiPrompt('');
    setAiGeneratedPlan(null);
  };

  const samplePrompts = [
    'Tạo kế hoạch giảm cân với ít carbs, nhiều protein',
    'Kế hoạch tăng cơ với các bữa ăn giàu protein và bài tập cardio nhẹ',
    'Kế hoạch dinh dưỡng lành mạnh cho người bận rộn, dễ chuẩn bị',
    'Kế hoạch tập luyện và ăn uống để giữ dáng, cân bằng calo',
  ];

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Bạn vui lòng nhập yêu cầu');
      return;
    }

    try {
      setGeneratingAI(true);
      // Increase timeout to 3 minutes for AI generation
      const res = await api.post('/user/plans/ai/generate', { prompt: aiPrompt }, {
        timeout: 180000, // 3 minutes
      });
      
      if (res.data.success && res.data.data) {
        setAiGeneratedPlan(res.data.data);
        toast.success('Tạo kế hoạch thành công!');
      } else {
        toast.error('Không thể tạo kế hoạch với AI. Hãy thử lại');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.');
      } else {
        const message = error.response?.data?.message || 'Không thể tạo kế hoạch với AI. Hãy thử lại';
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
      const res = await api.post('/user/plans/ai/accept', aiGeneratedPlan);
      
      if (res.data.success) {
        toast.success('Đã tạo kế hoạch thành công!');
        setShowAIDialog(false);
        setAiPrompt('');
        setAiGeneratedPlan(null);
        load();
      } else {
        toast.error('Không thể tạo kế hoạch');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tạo kế hoạch';
      toast.error(message);
    } finally {
      setAcceptingAI(false);
    }
  };
  const startEdit = async (pl: PlanItem) => {
    if (pl.isCommon) { toast.error('Không thể chỉnh sửa kế hoạch dùng chung'); return; }
    
    try {
      // Đảm bảo meals và exercises list đã được load
      if (meals.length === 0 || exercises.length === 0) {
        const [mealsRes, exRes] = await Promise.all([
          api.get('/user/meals'),
          api.get('/user/exercises'),
        ]);
        setMeals(mealsRes.data.data);
        setExercises(exRes.data.data);
      }
      
      // Tìm plan trong items array (đã được populate từ API)
      let planData = items.find((item) => item._id === pl._id);
      
      // Nếu không tìm thấy, load lại từ API
      if (!planData) {
        const plansRes = await api.get('/user/plans');
        const allPlans = plansRes.data.data as PlanItem[];
        planData = allPlans.find((item) => String(item._id) === String(pl._id));
        
        if (!planData) {
          toast.error('Không tìm thấy dữ liệu kế hoạch');
          return;
        }
      }
      
      // Chuyển đổi meals từ object (populated) sang ID string
      const convertedMeals: PlanItemMeal[] = (planData.meals || []).map((item) => {
        let mealId = '';
        const mealValue = item.meal;
        if (typeof mealValue === 'object' && mealValue !== null) {
          // Meal đã được populate - lấy _id hoặc id
          const mealObj = mealValue as { _id?: unknown; id?: unknown; [key: string]: unknown };
          if (mealObj._id) {
            mealId = String(mealObj._id);
          } else if (mealObj.id) {
            mealId = String(mealObj.id);
          }
        } else if (typeof mealValue === 'string') {
          // Meal là string ID
          mealId = mealValue;
        }
        return {
          time: item.time || '',
          meal: mealId,
        };
      });
      
      // Chuyển đổi exercises từ object (populated) sang ID string
      const convertedExercises: PlanItemExercise[] = (planData.exercises || []).map((item) => {
        let exerciseId = '';
        const exerciseValue = item.exercise;
        if (typeof exerciseValue === 'object' && exerciseValue !== null) {
          // Exercise đã được populate - lấy _id hoặc id
          const exerciseObj = exerciseValue as { _id?: unknown; id?: unknown; [key: string]: unknown };
          if (exerciseObj._id) {
            exerciseId = String(exerciseObj._id);
          } else if (exerciseObj.id) {
            exerciseId = String(exerciseObj.id);
          }
        } else if (typeof exerciseValue === 'string') {
          // Exercise là string ID
          exerciseId = exerciseValue;
        }
        return {
          time: item.time || '',
          exercise: exerciseId,
        };
      });
      
      setShowForm(true);
      setEditing(pl);
      setFormData({
        name: planData.name || pl.name,
        description: stripHtml(planData.description || pl.description || ''),
        meals: convertedMeals.length > 0 ? convertedMeals : [{ time: '', meal: '' }],
        exercises: convertedExercises.length > 0 ? convertedExercises : [{ time: '', exercise: '' }],
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải dữ liệu kế hoạch';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) { toast.error('Nhập tên kế hoạch'); return; }
      const payload = { ...formData };
      if (editing) {
        await api.put(`/user/plans/${editing._id}`, payload);
        toast.success('Cập nhật kế hoạch thành công');
      } else {
        await api.post('/user/plans', payload);
        toast.success('Tạo kế hoạch thành công');
      }
      setShowForm(false); setEditing(null); setFormData({ name: '', description: '', meals: [], exercises: [] });
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Thư viện kế hoạch ngày</h2>
        <p className="text-gray-600">Kế hoạch dùng chung và kế hoạch bạn đã tạo</p>
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
              placeholder="Tìm kiếm kế hoạch..."
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
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            Thêm kế hoạch
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
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h3 className="text-2xl font-bold">{editing ? 'Chỉnh sửa kế hoạch' : 'Thêm kế hoạch mới'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên kế hoạch *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={4} />
                </div>

                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Bữa ăn theo khung giờ</h4>
                    <button type="button" onClick={addMealRow} className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded hover:bg-primary-100">+ Thêm bữa</button>
                  </div>
                  <div className="space-y-3">
                    {formData.meals.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input type="time" value={row.time} onChange={(e) => setFormData(prev => ({ ...prev, meals: prev.meals.map((r, i) => i === idx ? { ...r, time: e.target.value } : r) }))} className="col-span-3 md:col-span-2 px-3 py-2 border rounded" />
                        <select value={String(row.meal || '')} onChange={(e) => setFormData(prev => ({ ...prev, meals: prev.meals.map((r, i) => i === idx ? { ...r, meal: e.target.value } : r) }))} className="col-span-8 md:col-span-9 px-3 py-2 border rounded">
                          <option value="">Chọn món ăn</option>
                          {meals.map(m => (<option key={m._id} value={String(m._id)}>{m.name} — {m.calories} cal</option>))}
                        </select>
                        <button type="button" onClick={() => removeMealRow(idx)} className="col-span-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">X</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Bài tập theo khung giờ</h4>
                    <button type="button" onClick={addExerciseRow} className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded hover:bg-primary-100">+ Thêm bài tập</button>
                  </div>
                  <div className="space-y-3">
                    {formData.exercises.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input type="time" value={row.time} onChange={(e) => setFormData(prev => ({ ...prev, exercises: prev.exercises.map((r, i) => i === idx ? { ...r, time: e.target.value } : r) }))} className="col-span-3 md:col-span-2 px-3 py-2 border rounded" />
                        <select value={String(row.exercise || '')} onChange={(e) => setFormData(prev => ({ ...prev, exercises: prev.exercises.map((r, i) => i === idx ? { ...r, exercise: e.target.value } : r) }))} className="col-span-8 md:col-span-9 px-3 py-2 border rounded">
                          <option value="">Chọn bài tập</option>
                          {exercises.map(ex => (<option key={ex._id} value={String(ex._id)}>{ex.name} — {ex.caloriesBurned} cal</option>))}
                        </select>
                        <button type="button" onClick={() => removeExerciseRow(idx)} className="col-span-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">X</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="col-span-12 lg:col-span-4">
                <div className="sticky top-6 space-y-4">
                  <div className="bg-white border rounded-lg shadow-sm p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Tổng quan</h4>
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
                </div>
              </aside>
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
          <p className="text-gray-600">Chưa có kế hoạch</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <div 
              key={p._id} 
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 ${p.isCommon ? 'cursor-pointer' : ''}`}
              onClick={async () => {
                if (p.isCommon) {
                  // Load lại plan với đầy đủ thông tin
                  try {
                    const plansRes = await api.get('/user/plans');
                    const allPlans = plansRes.data.data as PlanItem[];
                    const planData = allPlans.find((item) => String(item._id) === String(p._id));
                    if (planData) {
                      setViewingItem(planData);
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
              {p.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{stripHtml(p.description)}</p>}
              {p.totals && (
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Calo in:</span> <span className="font-medium">{p.totals.caloriesIn}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Calo out:</span> <span className="font-medium">{p.totals.caloriesOut}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Protein:</span> <span className="font-medium">{p.totals.protein}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span> <span className="font-medium">{p.totals.carbs}g</span>
                  </div>
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

              {viewingItem.meals && viewingItem.meals.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Bữa ăn theo khung giờ</h4>
                  <div className="space-y-2">
                    {viewingItem.meals.map((mealItem, idx) => {
                      let meal: Meal | undefined;
                      if (typeof mealItem.meal === 'object' && mealItem.meal !== null) {
                        const mealObj = mealItem.meal as unknown as Meal;
                        if ('name' in mealObj && 'calories' in mealObj) {
                          meal = mealObj;
                        }
                      } else {
                        meal = meals.find(m => m._id === String(mealItem.meal));
                      }
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700 min-w-[80px]">{mealItem.time || '--:--'}</span>
                          <span className="text-gray-900 flex-1">
                            {meal ? `${meal.name} — ${meal.calories} cal` : 'Không xác định'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingItem.exercises && viewingItem.exercises.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Bài tập theo khung giờ</h4>
                  <div className="space-y-2">
                    {viewingItem.exercises.map((exItem, idx) => {
                      let exercise: Exercise | undefined;
                      if (typeof exItem.exercise === 'object' && exItem.exercise !== null) {
                        const exObj = exItem.exercise as unknown as Exercise;
                        if ('name' in exObj && 'caloriesBurned' in exObj) {
                          exercise = exObj;
                        }
                      } else {
                        exercise = exercises.find(e => e._id === String(exItem.exercise));
                      }
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700 min-w-[80px]">{exItem.time || '--:--'}</span>
                          <span className="text-gray-900 flex-1">
                            {exercise ? `${exercise.name} — ${exercise.caloriesBurned} cal` : 'Không xác định'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingItem.totals && (
                <div className="bg-white border rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Tổng quan</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-600">Calo nạp</div>
                      <div className="font-semibold">{viewingItem.totals.caloriesIn}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-600">Calo tiêu thụ</div>
                      <div className="font-semibold">{viewingItem.totals.caloriesOut}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-600">Carbs</div>
                      <div className="font-semibold">{viewingItem.totals.carbs}g</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-600">Protein</div>
                      <div className="font-semibold">{viewingItem.totals.protein}g</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 col-span-2">
                      <div className="text-gray-600">Fat</div>
                      <div className="font-semibold">{viewingItem.totals.fat}g</div>
                    </div>
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

      {/* AI Plan Generation Dialog */}
      {showAIDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !generatingAI && !acceptingAI && setShowAIDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Tạo Kế Hoạch Với AI
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
                      placeholder="Ví dụ: Tạo kế hoạch giảm cân với các bữa ăn ít carbs và bài tập cardio..."
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
                          Tạo Kế Hoạch
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
                      <span className="font-semibold text-green-900">Kế hoạch đã được tạo!</span>
                    </div>
                    <p className="text-sm text-green-700">Xem lại kế hoạch bên dưới và nhấn "Chấp nhận" để lưu vào thư viện của bạn.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">{aiGeneratedPlan.name}</h4>
                    {aiGeneratedPlan.description && (
                      <p className="text-gray-600 text-sm mb-4">{aiGeneratedPlan.description}</p>
                    )}

                    {aiGeneratedPlan.meals && aiGeneratedPlan.meals.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-800 mb-2">Bữa ăn:</h5>
                        <div className="space-y-2">
                          {aiGeneratedPlan.meals.map((item, idx) => (
                            <div key={idx} className="bg-white rounded p-2 text-sm">
                              <span className="font-medium">{item.time}</span> - {item.meal.name} ({item.meal.calories} cal)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiGeneratedPlan.exercises && aiGeneratedPlan.exercises.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-800 mb-2">Bài tập:</h5>
                        <div className="space-y-2">
                          {aiGeneratedPlan.exercises.map((item, idx) => (
                            <div key={idx} className="bg-white rounded p-2 text-sm">
                              <span className="font-medium">{item.time}</span> - {item.exercise.name} ({item.exercise.caloriesBurned} cal, {item.exercise.durationMinutes} phút)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Tổng calo nạp:</span>{' '}
                          <span className="font-semibold">
                            {aiGeneratedPlan.meals.reduce((sum, m) => sum + m.meal.calories, 0)} cal
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tổng calo tiêu thụ:</span>{' '}
                          <span className="font-semibold">
                            {aiGeneratedPlan.exercises.reduce((sum, e) => sum + e.exercise.caloriesBurned, 0)} cal
                          </span>
                        </div>
                      </div>
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

export default PlanLibrary;
