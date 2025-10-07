import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Meal {
  _id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface DayMeals {
  day: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
}

interface MealPlan {
  _id: string;
  weekStartDate: string;
  meals: DayMeals[];
}

const MealPlans = () => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels: Record<string, string> = {
    monday: 'Thứ 2',
    tuesday: 'Thứ 3',
    wednesday: 'Thứ 4',
    thursday: 'Thứ 5',
    friday: 'Thứ 6',
    saturday: 'Thứ 7',
    sunday: 'Chủ nhật',
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Sáng',
    lunch: 'Trưa',
    dinner: 'Tối',
    snack: 'Snack',
  };

  const [formData, setFormData] = useState({
    weekStartDate: '',
    meals: days.map(day => ({ day, breakfast: '', lunch: '', dinner: '', snack: '' })),
  });

  useEffect(() => {
    loadMealPlans();
    loadAllMeals();
  }, []);
 const loadAllMeals = async () => {
    try {
      const response = await api.get('/meals');
      setAllMeals(response.data.data);
    } catch (error) {
      console.error('Failed to load meals');
    }
  };
  const loadMealPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/meal-plans');
      setMealPlans(response.data.data);
    } catch (error: any) {
      toast.error('Không thể tải kế hoạch ăn uống. ');
    } finally {
      setLoading(false);
    }
  };

 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const mealsData = formData.meals.map(day => ({
        day: day.day,
        breakfast: day.breakfast || undefined,
        lunch: day.lunch || undefined,
        dinner: day.dinner || undefined,
        snack: day.snack || undefined,
      }));

      if (editingPlan) {
        await api.put(`/meal-plans/${editingPlan._id}`, {
          ...formData,
          meals: mealsData,
        });
        toast.success('Đã cập nhật kế hoạch thành công!');
      } else {
        await api.post('/meal-plans', {
          ...formData,
          meals: mealsData,
        });
        toast.success('Tạo kế hoạch thành công !');
      }

      setShowForm(false);
      resetForm();
      loadMealPlans();
      setEditingPlan(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra');
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;

    try {
      await api.delete(`/meal-plans/${id}`);
      toast.success('Xóa kế hoạch thành công');
      loadMealPlans();
    } catch (error: any) {
      toast.error('Không thể xóa kế hoạch! Hãy thử lại.');
    }
  };
  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      weekStartDate: new Date(plan.weekStartDate).toISOString().split('T')[0],
      meals: days.map((day, idx) => {
        const dayMeal = plan.meals[idx];
        return {
          day,
          breakfast: dayMeal?.breakfast?._id || '',
          lunch: dayMeal?.lunch?._id || '',
          dinner: dayMeal?.dinner?._id || '',
          snack: dayMeal?.snack?._id || '',
        };
      }),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      weekStartDate: '',
      meals: days.map(day => ({ day, breakfast: '', lunch: '', dinner: '', snack: '' })),
    });
  };

  const calculateDayTotals = (dayMeals: any) => {
    let calories = 0, carbs = 0, protein = 0, fat = 0;

    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
      const meal = dayMeals[mealType];
      if (meal && typeof meal === 'object') {
        calories += meal.calories || 0;
        carbs += meal.carbs || 0;
        protein += meal.protein || 0;
        fat += meal.fat || 0;
      }
    });

    return { calories, carbs, protein, fat };
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Kế hoạch ăn uống của bạn</h2>
        <p className="text-gray-600">Quản lý thực đơn hàng tuần của bạn</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
        >
          <Plus className="h-5 w-5" />
          Tạo kế hoạch mới
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">
                {editingPlan ? 'Chỉnh sửa kế hoạch' : 'Tạo kế hoạch mới'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuần bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Lên Menu cho từng ngày</h4>
                  {days.map((day) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">{dayLabels[day]}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {mealTypes.map((mealType) => (
                          <div key={mealType}>
                            <label className="block text-xs text-gray-600 mb-1">
                              {mealTypeLabels[mealType]}
                            </label>
                            <select
                              value={formData.meals.find(m => m.day === day)?.[mealType as keyof typeof formData.meals[0]] || ''}
                              onChange={(e) => {
                                const newMeals = [...formData.meals];
                                const dayIndex = newMeals.findIndex(m => m.day === day);
                                if (dayIndex !== -1) {
                                  newMeals[dayIndex] = { ...newMeals[dayIndex], [mealType]: e.target.value };
                                  setFormData({ ...formData, meals: newMeals });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            >
                              <option value="">Chọn món....</option>
                              {allMeals.map(meal => (
                                <option key={meal._id} value={meal._id}>
                                  {meal.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPlan(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingPlan ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : mealPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Chưa có kế hoạch nào !</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Hãy tạo kế hoạch đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {mealPlans.map((plan) => {
            const weekStart = new Date(plan.weekStartDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            return (
              <div key={plan._id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Tuần: {weekStart.toLocaleDateString('vi-VN')} - {weekEnd.toLocaleDateString('vi-VN')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tạo lúc: {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(plan._id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {days.map((day) => {
                    const dayMeals = plan.meals.find((m: any) => m.day === day);
                    if (!dayMeals) return null;
                    const totals = calculateDayTotals(dayMeals);

                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold text-gray-900">{dayLabels[day]}</h5>
                          <div className="text-xs text-gray-600">
                            Tổng: {totals.calories} cal | {totals.carbs}C {totals.protein}P {totals.fat}F
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {mealTypes.map((mealType) => {
                            const meal = dayMeals[mealType];
                            return (
                              <div key={mealType} className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-600 mb-1">
                                  {mealTypeLabels[mealType]}
                                </div>
                                {meal && typeof meal === 'object' ? (
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">{meal.name}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {meal.calories} cal
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 italic">Chưa chọn</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MealPlans;

