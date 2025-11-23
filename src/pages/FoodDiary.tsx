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
    if (!confirm('Bạn có chắc muốn xóa món ăn này không?')) return;

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

   