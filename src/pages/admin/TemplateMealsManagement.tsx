import { Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Meal {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  goal: 'weight_loss' | 'muscle_gain' | 'healthy_lifestyle';
  isTemplate: boolean;
}

const TemplateMealsManagement = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<'weight_loss' | 'muscle_gain' | 'healthy_lifestyle'>('healthy_lifestyle');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
    goal: 'healthy_lifestyle' as 'weight_loss' | 'muscle_gain' | 'healthy_lifestyle',
    isTemplate: true,
  });

  const goalLabels: Record<string, string> = {
    weight_loss: 'Giảm cân',
    muscle_gain: 'Tăng cơ',
    healthy_lifestyle: 'Sống khỏe',
  };

  useEffect(() => {
    loadTemplateMeals();
  }, [selectedGoal]);

  const loadTemplateMeals = async () => {
    try {
      setLoading(true);
      const params: any = {
        isTemplate: true,
        goal: selectedGoal,
        isCommon: 'true',
      };
      if (search) params.search = search;
      
      const response = await api.get('/admin/meals', { params });
      setMeals(response.data.data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách món ăn mẫu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMeal) {
        await api.put(`/admin/meals/${editingMeal._id}`, formData);
        toast.success('Cập nhật món ăn mẫu thành công');
      } else {
        await api.post('/admin/meals', formData);
        toast.success('Tạo món ăn mẫu thành công');
      }
      
      setShowForm(false);
      setEditingMeal(null);
      resetForm();
      loadTemplateMeals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      description: meal.description || '',
      image: meal.image || '',
      calories: meal.calories.toString(),
      carbs: meal.carbs.toString(),
      protein: meal.protein.toString(),
      fat: meal.fat.toString(),
      goal: meal.goal,
      isTemplate: true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa món ăn mẫu này?')) return;
    
    try {
      await api.delete(`/admin/meals/${id}`);
      toast.success('Xóa món ăn mẫu thành công');
      loadTemplateMeals();
    } catch (error: any) {
      toast.error('Không thể xóa món ăn mẫu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      calories: '',
      carbs: '',
      protein: '',
      fat: '',
      goal: selectedGoal,
      isTemplate: true,
    });
  };

  const handleCreateForGoal = (goal: 'weight_loss' | 'muscle_gain' | 'healthy_lifestyle') => {
    setSelectedGoal(goal);
    setFormData({
      name: '',
      description: '',
      image: '',
      calories: '',
      carbs: '',
      protein: '',
      fat: '',
      goal: goal,
      isTemplate: true,
    });
    setEditingMeal(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý thực đơn mẫu</h2>
        <p className="text-gray-600">Tạo và quản lý các thực đơn mẫu theo mục tiêu</p>
      </div>

      {/* Goal tabs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(goalLabels).map(([goal, label]) => (
          <button
            key={goal}
            onClick={() => {
              setSelectedGoal(goal as any);
              setSearch('');
            }}
            className={`p-6 rounded-lg border-2 transition-all ${
              selectedGoal === goal
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 mb-1">{label}</div>
            <div className="text-sm text-gray-600">
              {meals.length} món ăn mẫu
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                loadTemplateMeals();
              }}
              placeholder="Tìm kiếm món ăn..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => handleCreateForGoal(selectedGoal)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            Thêm mẫu cho {goalLabels[selectedGoal]}
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">
                {editingMeal ? 'Chỉnh sửa món ăn mẫu' : `Tạo món ăn mẫu - ${goalLabels[formData.goal]}`}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-primary-800">
                    <strong>Note :</strong> Món ăn này sẽ hiển thị cho tất cả người dùng có mục tiêu <strong>{goalLabels[formData.goal]}</strong> trong thư viện món ăn.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên món ăn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL hình ảnh
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories *
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carbs (g) *
                    </label>
                    <input
                      type="number"
                      value={formData.carbs}
                      onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Protein (g) *
                    </label>
                    <input
                      type="number"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fat (g) *
                    </label>
                    <input
                      type="number"
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isTemplate}
                      onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      disabled
                    />
                    <span className="ml-2">Món ăn mẫu (luôn bật cho trang này)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMeal(null);
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
                    {editingMeal ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Meals List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">Chưa có món ăn mẫu nào cho mục tiêu <strong>{goalLabels[selectedGoal]}</strong></p>
          <button
            onClick={() => handleCreateForGoal(selectedGoal)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Thêm món ăn mẫu đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <div key={meal._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
              {meal.image && (
                <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{meal.name}</h3>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">Mẫu</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Calo:</span> <span className="font-medium">{meal.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span> <span className="font-medium">{meal.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Protein:</span> <span className="font-medium">{meal.protein}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fat:</span> <span className="font-medium">{meal.fat}g</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(meal)}
                    className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(meal._id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateMealsManagement;

