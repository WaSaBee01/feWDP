import { ContentState, Editor, EditorState, convertFromHTML, convertToRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import draftToHtml from 'draftjs-to-html';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Meal { _id: string; name: string; calories: number; carbs: number; protein: number; fat: number }
interface Exercise { _id: string; name: string; caloriesBurned: number }
interface PlanItemMeal { time: string; meal: string }
interface PlanItemExercise { time: string; exercise: string }
interface Plan {
  _id: string;
  name: string;
  description?: string;
  meals?: Array<{ time: string; meal: string | { _id: string; [key: string]: unknown } }>; // meal có thể là object (populated) hoặc string (ID)
  exercises?: Array<{ time: string; exercise: string | { _id: string; [key: string]: unknown } }>; // exercise có thể là object (populated) hoặc string (ID)
  totals: { caloriesIn: number; carbs: number; protein: number; fat: number; caloriesOut: number };
}

const PlanManagement = () => {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [search, setSearch] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meals: [] as PlanItemMeal[],
    exercises: [] as PlanItemExercise[],
    goal: 'healthy_lifestyle' as 'healthy_lifestyle' | 'weight_loss' | 'muscle_gain',
  });

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { isCommon: 'true' };
      if (search) params.search = search;
      const [plansRes, mealsRes, exRes] = await Promise.all([
        api.get('/admin/plans', { params }),
        api.get('/admin/meals', { params: { isCommon: 'true' } }),
        api.get('/admin/exercises', { params: { isCommon: 'true' } }),
      ]);
      setItems(plansRes.data.data);
      setMeals(mealsRes.data.data);
      setExercises(exRes.data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadAll();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) { toast.error('Nhập tên plan'); return; }
      const description = draftToHtml(convertToRaw(editorState.getCurrentContent()))
      const payload = { ...formData, description };
      if (editing) {
        await api.put(`/admin/plans/${editing._id}`, payload);
        toast.success('Cập nhật plan thành công');
      } else {
        await api.post('/admin/plans', payload);
        toast.success('Tạo plan thành công');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', description: '', meals: [], exercises: [], goal: 'healthy_lifestyle' });
      setEditorState(EditorState.createEmpty());
      loadAll();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const addMealRow = () => setFormData(prev => ({ ...prev, meals: [...prev.meals, { time: '', meal: '' }] }));
  const addExerciseRow = () => setFormData(prev => ({ ...prev, exercises: [...prev.exercises, { time: '', exercise: '' }] }));

  const removeMealRow = (idx: number) => setFormData(prev => ({ ...prev, meals: prev.meals.filter((_, i) => i !== idx) }));
  const removeExerciseRow = (idx: number) => setFormData(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }));

  const handleEdit = async (pl: Plan) => {
    try {
      // Đảm bảo meals và exercises list đã được load
      if (meals.length === 0 || exercises.length === 0) {
        const [mealsRes, exRes] = await Promise.all([
          api.get('/admin/meals', { params: { isCommon: 'true' } }),
          api.get('/admin/exercises', { params: { isCommon: 'true' } }),
        ]);
        setMeals(mealsRes.data.data);
        setExercises(exRes.data.data);
      }
      
      // Tìm plan trong items array (đã được populate từ API)
      let planData = items.find((item) => item._id === pl._id);
      
      // Nếu không tìm thấy, load lại từ API
      if (!planData) {
        const plansRes = await api.get('/admin/plans', { params: { isCommon: 'true' } });
        const allPlans = plansRes.data.data as Plan[];
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
          // Meal đã được populate - lấy _id
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
          // Exercise đã được populate - lấy _id
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
      
      setEditing(pl);
      setFormData({
        name: planData.name || pl.name,
        description: planData.description || pl.description || '',
        meals: convertedMeals.length > 0 ? convertedMeals : [{ time: '', meal: '' }],
        exercises: convertedExercises.length > 0 ? convertedExercises : [{ time: '', exercise: '' }],
        goal: (planData as { goal?: string }).goal || 'healthy_lifestyle',
      } as typeof formData);
      
      if (planData.description) {
        const blocks = convertFromHTML(planData.description);
        const content = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
        setEditorState(EditorState.createWithContent(content));
      } else {
        setEditorState(EditorState.createEmpty());
      }
      setShowForm(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải dữ liệu kế hoạch';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa plan này?')) return;
    try { await api.delete(`/admin/plans/${id}`); toast.success('Đã xóa'); loadAll(); } catch { toast.error('Không thể xóa'); }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Kế hoạch ngày (Daily Plan)</h2>
        <p className="text-gray-600">Tạo kế hoạch trong ngày gồm bữa ăn và bài tập</p>
      </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kế hoạch..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', description: '', meals: [], exercises: [], goal: 'healthy_lifestyle' }); setEditorState(EditorState.createEmpty()); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
            <Plus className="h-5 w-5" /> Thêm plan
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h3 className="text-2xl font-bold">{editing ? 'Chỉnh sửa plan' : 'Thêm plan mới'}</h3>
              <p className="text-sm text-gray-500 mt-1">Thiết lập mô tả, bữa ăn và bài tập theo khung giờ.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên plan *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mục tiêu</label>
                  <select value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value as 'healthy_lifestyle' | 'weight_loss' | 'muscle_gain' })} className="w-full px-3 py-2 border rounded bg-white">
                    <option value="healthy_lifestyle">Sống khỏe</option>
                    <option value="weight_loss">Giảm cân</option>
                    <option value="muscle_gain">Tăng cơ</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <div className="min-h-[220px] px-3 py-2 bg-white border rounded">
                    <Editor editorState={editorState} onChange={setEditorState} placeholder="Nhập mô tả..." />
                  </div>
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
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div><p className="mt-4 text-gray-600">Đang tải...</p></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-600">Chưa có plan nào</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((pl) => (
            <div key={pl._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{pl.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div><span className="text-gray-600">Calo nạp:</span> <span className="font-medium">{pl.totals.caloriesIn}</span></div>
                  <div><span className="text-gray-600">Calo tiêu thụ:</span> <span className="font-medium">{pl.totals.caloriesOut}</span></div>
                  <div><span className="text-gray-600">Carbs:</span> <span className="font-medium">{pl.totals.carbs}g</span></div>
                  <div><span className="text-gray-600">Protein:</span> <span className="font-medium">{pl.totals.protein}g</span></div>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => handleEdit(pl)} className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">Chỉnh sửa</button>
                  <button onClick={() => handleDelete(pl._id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="h-4 w-4" /></button>
                  <span className="ml-auto px-2 py-1 text-xs rounded bg-primary-50 text-primary-700">
                    {(pl as { goal?: string }).goal === 'weight_loss' ? 'Giảm cân' : (pl as { goal?: string }).goal === 'muscle_gain' ? 'Tăng cơ' : 'Sống khỏe'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanManagement;


