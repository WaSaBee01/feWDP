import { Apple, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

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

const Nutrition = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [search, setSearch] = useState('');


  useEffect(() => {
    loadMeals();
  }, [filterGoal]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterGoal !== 'all') params.goal = filterGoal;
      if (search) params.search = search;
      
      const response = await api.get('/meals', { params });
      setMeals(response.data.data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMeals();
  };

  const goalLabels: Record<string, string> = {
    weight_loss: 'Giảm cân',
    muscle_gain: 'Tăng cơ',
    healthy_lifestyle: 'Sống khỏe',
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Thư viện món ăn</h2>
        <p className="text-gray-600">Khám phá các món ăn phù hợp với mục tiêu của bạn</p>
      </div>


      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm kiếm món ăn..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Tất cả mục tiêu</option>
            <option value="weight_loss">Giảm cân</option>
            <option value="muscle_gain">Tăng cơ</option>
            <option value="healthy_lifestyle">Sống khỏe</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            Tìm kiếm
          </button>
        </div>
      </div>


      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy món ăn nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <button
              key={meal._id}
              onClick={() => setSelectedMeal(meal)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all text-left"
            >
              {meal.image && (
                <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{meal.name}</h3>
                  {meal.isTemplate && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">Mẫu</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">{goalLabels[meal.goal]}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
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
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedMeal.name}</h3>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedMeal.image && (
                <img src={selectedMeal.image} alt={selectedMeal.name} className="w-full h-64 object-cover rounded-lg mb-4" />
              )}

              <div className="mb-4">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded">
                  {goalLabels[selectedMeal.goal]}
                </span>
              </div>

              {selectedMeal.description && (
                <p className="text-gray-700 mb-6">{selectedMeal.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Calories</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedMeal.calories}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedMeal.carbs}g</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Protein</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedMeal.protein}g</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Fat</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedMeal.fat}g</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;

