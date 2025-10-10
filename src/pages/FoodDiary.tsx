import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
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

interface FoodEntry {
  _id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealId?: Meal;
  customMeal?: {
    name: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

interface DiaryData {
  entries: FoodEntry[];
  totals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

const FoodDiary = () => {
  const [diaryData, setDiaryData] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    mealId: '',
    customMeal: {
      name: '',
      calories: '',
      carbs: '',
      protein: '',
      fat: '',
    },
    isCustom: false,
  });

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Sáng',
    lunch: 'Trưa',
    dinner: 'Tối',
    snack: 'Snack',
  };

  useEffect(() => {
    loadDiary();
    loadAllMeals();
    loadSurveyTarget();
  }, [currentDate]);

  const loadDiary = async () => {
    try {
      setLoading(true);
      const dateStr = currentDate.toISOString().split('T')[0];
      const response = await api.get(`/food-diary/${dateStr}`);
      setDiaryData(response.data.data);
    } catch (error: any) {
      // Diary might not exist for this date, that's okay
      setDiaryData({ entries: [], totals: { calories: 0, carbs: 0, protein: 0, fat: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const loadAllMeals = async () => {
    try {
      const response = await api.get('/meals');
      setAllMeals(response.data.data);
    } catch (error) {
      console.error('Failed to load meals');
    }
  };

  const loadSurveyTarget = async () => {
    try {
      const response = await api.get('/survey');
      const survey = response.data?.data;
      // Xác định mục tiêu calo đơn giản theo goal
      // Có thể tinh chỉnh sau theo BMR/TDEE khi có dữ liệu chi tiết
      const goal: 'weight_loss' | 'muscle_gain' | 'healthy_lifestyle' = survey?.goal;
      const targetByGoal: Record<string, number> = {
        weight_loss: 1800,
        muscle_gain: 2600,
        healthy_lifestyle: 2200,
      };
      setTargetCalories(targetByGoal[goal] || 2200);
    } catch (_) {
      // Không có survey => dùng mặc định
      setTargetCalories(2200);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleAddEntry = () => {
    setFormData({
      mealType: selectedMealType,
      mealId: '',
      customMeal: {
        name: '',
        calories: '',
        carbs: '',
        protein: '',
        fat: '',
      },
      isCustom: false,
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (formData.isCustom) {
        await api.post('/food-diary/entry', {
          date: dateStr,
          mealType: formData.mealType,
          customMeal: {
            name: formData.customMeal.name,
            calories: parseFloat(formData.customMeal.calories),
            carbs: parseFloat(formData.customMeal.carbs),
            protein: parseFloat(formData.customMeal.protein),
            fat: parseFloat(formData.customMeal.fat),
          },
        });
      } else {
        await api.post('/food-diary/entry', {
          date: dateStr,
          mealType: formData.mealType,
          mealId: formData.mealId,
        });
      }

      toast.success('Đã thêm món ăn thành công');
      setShowAddForm(false);
      loadDiary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa món ăn này?')) return;

    try {
      await api.delete(`/food-diary/entry/${id}`);
      toast.success('Xóa món ăn thành công');
      loadDiary();
    } catch (error: any) {
      toast.error('Không thể xóa món ăn');
    }
  };

  const getEntriesByMealType = (mealType: string) => {
    if (!diaryData) return [];
    return diaryData.entries.filter(entry => entry.mealType === mealType);
  };

  const getMealName = (entry: FoodEntry) => {
    if (entry.mealId && typeof entry.mealId === 'object') {
      return entry.mealId.name;
    }
    return entry.customMeal?.name || 'Unknown';
  };

  const getMealNutrition = (entry: FoodEntry) => {
    if (entry.mealId && typeof entry.mealId === 'object') {
      return entry.mealId;
    }
    return entry.customMeal;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Nhật ký ăn uống</h2>
        <p className="text-gray-600">Theo dõi dinh dưỡng hàng ngày của bạn</p>
      </div>

      {/* Date selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm text-primary-600 hover:text-primary-700 mt-1"
            >
              Hôm nay
            </button>
          </div>
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Daily summary */}
      {diaryData && (
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <h3 className="text-xl font-bold mb-4">Tổng quan ngày</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm opacity-90">Calories</div>
              <div className="text-3xl font-bold">{diaryData.totals.calories}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Carbs</div>
              <div className="text-3xl font-bold">{diaryData.totals.carbs}g</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Protein</div>
              <div className="text-3xl font-bold">{diaryData.totals.protein}g</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Fat</div>
              <div className="text-3xl font-bold">{diaryData.totals.fat}g</div>
            </div>
          </div>
          {typeof targetCalories === 'number' && targetCalories > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm opacity-90 mb-2">
                <span>Mục tiêu: {targetCalories} cal</span>
                <span>
                  {Math.min(100, Math.round((diaryData.totals.calories / targetCalories) * 100))}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    diaryData.totals.calories <= targetCalories ? 'bg-white' : 'bg-red-300'
                  }`}
                  style={{ width: `${Math.min(100, (diaryData.totals.calories / targetCalories) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add button */}
      <div className="mb-6">
        <div className="flex gap-2">
          {mealTypes.map((mealType) => (
            <button
              key={mealType}
              onClick={() => {
                setSelectedMealType(mealType as any);
                handleAddEntry();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              {mealTypeLabels[mealType]}
            </button>
          ))}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">Thêm món ăn - {mealTypeLabels[formData.mealType]}</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={formData.isCustom}
                    onChange={(e) => setFormData({ ...formData, isCustom: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Thêm món ăn tùy chỉnh
                  </label>
                </div>

                {formData.isCustom ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên món ăn *
                      </label>
                      <input
                        type="text"
                        value={formData.customMeal.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          customMeal: { ...formData.customMeal, name: e.target.value },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calories *
                        </label>
                        <input
                          type="number"
                          value={formData.customMeal.calories}
                          onChange={(e) => setFormData({
                            ...formData,
                            customMeal: { ...formData.customMeal, calories: e.target.value },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          value={formData.customMeal.carbs}
                          onChange={(e) => setFormData({
                            ...formData,
                            customMeal: { ...formData.customMeal, carbs: e.target.value },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          value={formData.customMeal.protein}
                          onChange={(e) => setFormData({
                            ...formData,
                            customMeal: { ...formData.customMeal, protein: e.target.value },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fat (g)
                        </label>
                        <input
                          type="number"
                          value={formData.customMeal.fat}
                          onChange={(e) => setFormData({
                            ...formData,
                            customMeal: { ...formData.customMeal, fat: e.target.value },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn món ăn *
                    </label>
                    <select
                      value={formData.mealId}
                      onChange={(e) => setFormData({ ...formData, mealId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={!formData.isCustom}
                    >
                      <option value="">Chọn món từ thư viện...</option>
                      {allMeals.map(meal => (
                        <option key={meal._id} value={meal._id}>
                          {meal.name} ({meal.calories} cal)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Thêm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Meals by type */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mealTypes.map((mealType) => {
            const entries = getEntriesByMealType(mealType);
            return (
              <div key={mealType} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">{mealTypeLabels[mealType]}</h3>
                </div>
                <div className="p-4">
                  {entries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có món ăn nào
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entries.map((entry) => {
                        const nutrition = getMealNutrition(entry);
                        return (
                          <div key={entry._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{getMealName(entry)}</div>
                              {nutrition && (
                                <div className="text-sm text-gray-600">
                                  {nutrition.calories} cal | {nutrition.carbs}g C | {nutrition.protein}g P | {nutrition.fat}g F
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(entry._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FoodDiary;

