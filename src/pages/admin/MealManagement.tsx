import { Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Ingredient {
  name: string;
  weightGram: number;
}

interface Meal {
  _id: string;
  name: string;
  description?: string;
  ingredients?: Ingredient[];
  image?: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weightGrams: number;
}

const MealManagement = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [search, setSearch] = useState('');
  // goal filter removed

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: [] as Ingredient[],
    image: '',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
    weightGrams: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);

  type AxiosErrorLike = { response?: { data?: { message?: string } } };

  const handleSelectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }
    
    // Kiểm tra kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      event.target.value = '';
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/user/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success && res.data.data?.url) {
        setFormData((prev) => ({ ...prev, image: res.data.data.url }));
        toast.success('Đã tải ảnh lên thành công');
      } else {
        toast.error('Không thể tải ảnh lên');
      }
    } catch (err: unknown) {
      const message = (err as AxiosErrorLike).response?.data?.message || 'Không thể tải ảnh lên';
      toast.error(message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const loadMeals = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { isCommon: 'true' };
      if (search) params.search = search;
      
      const response = await api.get('/admin/meals', { params });
      setMeals(response.data.data);
    } catch {
      toast.error('Không thể tải danh sách món ăn');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const handleCalculateNutrition = useCallback(async () => {
    if (calculatingNutrition) return;

    const validName = formData.name.trim();
    if (!validName) {
      toast.error('Nhập tên món ăn trước khi tính chỉ số');
      return;
    }

    const normalizedIngredients = formData.ingredients
      .map((ing) => ({
        name: ing.name.trim(),
        weightGram: typeof ing.weightGram === 'string' ? Number(ing.weightGram) : ing.weightGram,
      }))
      .filter((ing) => ing.name && !Number.isNaN(ing.weightGram) && ing.weightGram > 0);

    if (normalizedIngredients.length === 0) {
      toast.error('Cần ít nhất 1 thành phần hợp lệ để tính chỉ số');
      return;
    }

    const totalWeight = normalizedIngredients.reduce((sum, ing) => sum + ing.weightGram, 0);
    if (totalWeight <= 0) {
      toast.error('Tổng khối lượng thành phần phải lớn hơn 0');
      return;
    }

    try {
      setCalculatingNutrition(true);
      const res = await api.post('/admin/meals/ai/calculate-nutrition', {
        mealName: validName,
        ingredients: normalizedIngredients.map((ing) => ({ name: ing.name, weightGram: ing.weightGram })),
        weightGrams: totalWeight,
      });

      if (res.data.success && res.data.data) {
        const nutrition = res.data.data;
        setFormData((prev) => ({
          ...prev,
          calories: nutrition.calories.toString(),
          carbs: nutrition.carbs.toString(),
          protein: nutrition.protein.toString(),
          fat: nutrition.fat.toString(),
          weightGrams: totalWeight.toString(),
        }));
        toast.success('Đã tính chỉ số dinh dưỡng');
      } else {
        toast.error('Không thể tính chỉ số dinh dưỡng');
      }
    } catch (err) {
      console.error('Error calculating nutrition:', err);
      toast.error('AI không thể tính chỉ số. Vui lòng thử lại');
    } finally {
      setCalculatingNutrition(false);
    }
  }, [calculatingNutrition, formData.ingredients, formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        calories: Number(formData.calories),
        carbs: Number(formData.carbs),
        protein: Number(formData.protein),
        fat: Number(formData.fat),
        weightGrams: Number(formData.weightGrams),
      };
      
      if (editingMeal) {
        await api.put(`/admin/meals/${editingMeal._id}`, payload);
        toast.success('Cập nhật món ăn thành công');
      } else {
        await api.post('/admin/meals', payload);
        toast.success('Tạo món ăn thành công');
      }
      
      setShowForm(false);
      setEditingMeal(null);
      resetForm();
      loadMeals();
    } catch (err: unknown) {
      const message = (err as AxiosErrorLike).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      description: meal.description || '',
      ingredients: meal.ingredients || [],
      image: meal.image || '',
      calories: meal.calories.toString(),
      carbs: meal.carbs.toString(),
      protein: meal.protein.toString(),
      fat: meal.fat.toString(),
      weightGrams: meal.weightGrams.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa món ăn này?')) return;
    
    try {
      await api.delete(`/admin/meals/${id}`);
      toast.success('Xóa món ăn thành công');
      loadMeals();
    } catch {
      toast.error('Không thể xóa món ăn');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ingredients: [],
      image: '',
      calories: '',
      carbs: '',
      protein: '',
      fat: '',
      weightGrams: '',
    });
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', weightGram: 0 }],
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (index: number, field: 'name' | 'weightGram', value: string | number) => {
    setFormData((prev) => {
      const updatedIngredients = prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      );
      
      // Tự động tính tổng khối lượng từ ingredients
      const totalWeight = updatedIngredients.reduce((sum, ing) => {
        const weight = typeof ing.weightGram === 'string' ? Number(ing.weightGram) : ing.weightGram;
        return sum + (isNaN(weight) ? 0 : weight);
      }, 0);
      
      return {
        ...prev,
        ingredients: updatedIngredients,
        weightGrams: totalWeight > 0 ? totalWeight.toString() : prev.weightGrams,
      };
    });
  };

  // goal labels removed

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý món ăn</h2>
        <p className="text-gray-600">Quản lý thư viện món ăn cho người dùng</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm món ăn..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* goal filter removed */}

          <button
            onClick={() => {
              setShowForm(true);
              setEditingMeal(null);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            Thêm món ăn
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">
                {editingMeal ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Thành phần
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Thêm thành phần
                    </button>
                  </label>
                  {formData.ingredients.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Chưa có thành phần nào. Nhấn "Thêm thành phần" để thêm.</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={ing.name}
                            onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                            placeholder="Tên thành phần..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={ing.weightGram}
                            onChange={(e) => updateIngredient(idx, 'weightGram', e.target.value)}
                            placeholder="Khối lượng (g)"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => removeIngredient(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCalculateNutrition}
                  disabled={calculatingNutrition}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                    calculatingNutrition ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {calculatingNutrition && (
                    <div className="h-4 w-4 border-2 border-white border-b-transparent rounded-full animate-spin"></div>
                  )}
                  {calculatingNutrition ? 'Đang tính...' : 'Tính chỉ số dinh dưỡng'}
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khối lượng tổng (g) *
                    {calculatingNutrition && (
                      <span className="ml-2 text-xs text-primary-600 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                        Đang tính toán...
                      </span>
                    )}
                    {formData.ingredients.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">(Tự động tính từ thành phần hợp lệ)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weightGrams}
                    onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formData.ingredients.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    required
                    min="0"
                    disabled={formData.ingredients.length > 0}
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
                    Hình ảnh
                  </label>
                  <label className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 ${
                    uploadingImage 
                      ? 'cursor-not-allowed opacity-50 bg-gray-100' 
                      : 'cursor-pointer hover:bg-gray-50'
                  }`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleSelectImage}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? 'Đang tải lên...' : 'Chọn ảnh...'}
                  </label>
                  {formData.image && (
                    <div className="mt-3">
                      <img src={formData.image} alt="Preview" className="h-32 rounded-md object-cover border" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories *
                    </label>
                    <input
                      type="number"
                      step="0.01"
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
                      step="0.01"
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
                      step="0.01"
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
                      step="0.01"
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                </div>
                {/* goal and template fields removed */}

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
          <p className="text-gray-600">Chưa có món ăn nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <div key={meal._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
              {meal.image && (
                <img src={meal.image} alt={meal.name} className="w-full h-40 object-cover rounded-t-lg" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{meal.name}</h3>
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{meal.calories} cal</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-4">
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="text-gray-600">Carbs</div><div className="font-semibold">{meal.carbs}g</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="text-gray-600">Protein</div><div className="font-semibold">{meal.protein}g</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="text-gray-600">Fat</div><div className="font-semibold">{meal.fat}g</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="text-gray-600">Khối lượng</div><div className="font-semibold">{meal.weightGrams}g</div></div>
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

export default MealManagement;

