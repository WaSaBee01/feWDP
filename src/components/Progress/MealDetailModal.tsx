import { X } from 'lucide-react';

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
  weightGrams?: number;
}

interface MealDetailModalProps {
  meal: Meal | null;
  onClose: () => void;
}

const MealDetailModal = ({ meal, onClose }: MealDetailModalProps) => {
  if (!meal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">{meal.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {meal.image && (
            <div className="mb-4">
              <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}

          {meal.ingredients && meal.ingredients.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Thành phần</div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="space-y-2">
                  {meal.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{ing.name}</span>
                      <span className="font-medium text-gray-900">{ing.weightGram}g</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {meal.description && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">Mô tả</div>
              <p className="text-gray-600">{meal.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Calories</div>
              <div className="text-2xl font-bold text-gray-900">{meal.calories}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Carbs</div>
              <div className="text-2xl font-bold text-gray-900">{meal.carbs}g</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Protein</div>
              <div className="text-2xl font-bold text-gray-900">{meal.protein}g</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Fat</div>
              <div className="text-2xl font-bold text-gray-900">{meal.fat}g</div>
            </div>
          </div>

          {meal.weightGrams && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Khối lượng</div>
              <div className="text-xl font-bold text-gray-900">{meal.weightGrams}g</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealDetailModal;

