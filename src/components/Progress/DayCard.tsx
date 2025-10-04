import { CheckCircle2, Dumbbell, Edit2, Utensils } from 'lucide-react';

interface Meal {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weightGrams?: number;
}

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  caloriesBurned: number;
  videoUrl?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
}

interface ProgressMeal {
  time: string;
  mealId: Meal | string;
  completed: boolean;
}

interface ProgressExercise {
  time: string;
  exerciseId: Exercise | string;
  completed: boolean;
}

interface ProgressEntry {
  _id: string;
  date: string;
  meals: ProgressMeal[];
  exercises: ProgressExercise[];
  notes?: string;
}

interface DayCardProps {
  date: Date;
  entry: ProgressEntry | undefined;
  meals: Meal[];
  exercises: Exercise[];
  isCurrentDay: boolean;
  isComplete: boolean;
  canToggleCompletion: (date: Date, time: string) => boolean;
  onEdit: (date: Date) => void;
  onToggleCompletion: (date: Date, type: 'meal' | 'exercise', index: number) => void;
  onMealClick: (meal: Meal) => void;
  onExerciseClick: (exercise: Exercise, date: Date, index: number) => void;
}

const DayCard = ({
  date,
  entry,
  meals,
  exercises,
  isCurrentDay,
  isComplete,
  canToggleCompletion,
  onEdit,
  onToggleCompletion,
  onMealClick,
  onExerciseClick,
}: DayCardProps) => {
  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const isPastDate = dateOnly < today;

  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-lg transition-all overflow-hidden ${
        isCurrentDay ? 'ring-2 ring-primary-500' : ''
      } ${isComplete ? 'border-2 border-green-500 bg-green-50' : ''}`}
    >
      {/* Date Header */}
      <div className={`p-2 border-b ${
        isComplete 
          ? 'bg-green-100 border-green-300' 
          : isCurrentDay 
            ? 'bg-primary-50' 
            : 'bg-gray-50'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">{date.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
            <div className={`text-lg font-bold ${
              isComplete 
                ? 'text-green-700' 
                : isCurrentDay 
                  ? 'text-primary-700' 
                  : 'text-gray-900'
            }`}>
              {date.getDate()}
              {isComplete && (
                <span className="ml-1 text-green-600">✓</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onEdit(date)}
            disabled={isPastDate}
            className={`p-1.5 rounded text-gray-600 ${
              isPastDate 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={isPastDate ? 'Không thể chỉnh sửa ngày trong quá khứ' : 'Chỉnh sửa ngày'}
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-2.5 max-h-[500px] overflow-y-auto">
        {/* Meals */}
        {entry && entry.meals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-orange-100 rounded-lg">
                <Utensils className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-gray-800">Bữa ăn</span>
              {entry.meals.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {entry.meals.filter((m) => m.completed).length}/{entry.meals.length}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {entry.meals.map((meal, mealIdx) => {
                let mealData: Meal | undefined = undefined;
                if (typeof meal.mealId === 'object' && meal.mealId !== null) {
                  mealData = meal.mealId as Meal;
                } else {
                  const mealIdStr = String(meal.mealId);
                  mealData = meals.find((m) => String(m._id) === mealIdStr);
                }
                const canToggle = canToggleCompletion(date, meal.time);
                return (
                  mealData && (
                    <div
                      key={mealIdx}
                      className={`group relative flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 ${
                        meal.completed
                          ? 'bg-gradient-to-br from-green-50 via-green-50/80 to-emerald-50 border border-green-300/50 shadow-md shadow-green-100/30'
                          : canToggle
                            ? 'bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 shadow-sm'
                            : 'bg-gradient-to-br from-white to-gray-50/30 border border-gray-200/50 opacity-60'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompletion(date, 'meal', mealIdx);
                        }}
                        disabled={!canToggle && !meal.completed}
                        className={`flex-shrink-0 transition-all duration-200 ${
                          meal.completed
                            ? 'hover:scale-110 cursor-pointer'
                            : canToggle
                              ? 'hover:scale-110 hover:bg-green-50 rounded-full p-1 cursor-pointer'
                              : 'cursor-not-allowed opacity-50'
                        }`}
                        type="button"
                        title={
                          meal.completed
                            ? 'Đánh dấu chưa hoàn thành'
                            : canToggle
                              ? 'Đánh dấu đã hoàn thành'
                              : 'Chưa đến giờ! Bạn chỉ có thể đánh dấu sau khi đến giờ đã lên lịch.'
                        }
                      >
                        <div className={`p-1 rounded-full transition-all ${
                          meal.completed 
                            ? 'bg-green-500' 
                            : canToggle
                              ? 'bg-gray-200 group-hover:bg-green-100'
                              : 'bg-gray-200'
                        }`}>
                          <CheckCircle2
                            className={`h-4 w-4 transition-all ${
                              meal.completed
                                ? 'text-white fill-white'
                                : canToggle
                                  ? 'text-gray-400 group-hover:text-green-500'
                                  : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMealClick(mealData);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`font-semibold text-sm transition-colors ${
                              meal.completed
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900 group-hover:text-orange-600'
                            }`}
                          >
                            {mealData.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                            <span className={`text-xs font-medium ${
                              meal.completed ? 'text-gray-400 line-through' : 'text-gray-600'
                            }`}>
                              {meal.time}
                            </span>
                          </div>
                          {!meal.completed && (
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                              <span className="text-xs font-medium text-orange-600">{mealData.calories} cal</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          </div>
        )}

        {/* Exercises */}
        {entry && entry.exercises.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-blue-100 rounded-lg">
                <Dumbbell className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-gray-800">Bài tập</span>
              {entry.exercises.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {entry.exercises.filter((e) => e.completed).length}/{entry.exercises.length}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {entry.exercises.map((ex, exIdx) => {
                let exData: Exercise | undefined = undefined;
                if (typeof ex.exerciseId === 'object' && ex.exerciseId !== null) {
                  exData = ex.exerciseId as Exercise;
                } else {
                  const exerciseIdStr = String(ex.exerciseId);
                  exData = exercises.find((e) => String(e._id) === exerciseIdStr);
                }
                const canToggle = canToggleCompletion(date, ex.time);
                return (
                  exData && (
                    <div
                      key={exIdx}
                      className={`group relative flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 ${
                        ex.completed
                          ? 'bg-gradient-to-br from-green-50 via-green-50/80 to-emerald-50 border border-green-300/50 shadow-md shadow-green-100/30'
                          : canToggle
                            ? 'bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 shadow-sm'
                            : 'bg-gradient-to-br from-white to-gray-50/30 border border-gray-200/50 opacity-60'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompletion(date, 'exercise', exIdx);
                        }}
                        disabled={!canToggle && !ex.completed}
                        className={`flex-shrink-0 transition-all duration-200 ${
                          ex.completed
                            ? 'hover:scale-110 cursor-pointer'
                            : canToggle
                              ? 'hover:scale-110 hover:bg-green-50 rounded-full p-1 cursor-pointer'
                              : 'cursor-not-allowed opacity-50'
                        }`}
                        type="button"
                        title={
                          ex.completed
                            ? 'Đánh dấu chưa hoàn thành'
                            : canToggle
                              ? 'Đánh dấu đã hoàn thành'
                              : 'Chưa đến giờ! Bạn chỉ có thể đánh dấu sau khi đến giờ đã lên lịch.'
                        }
                      >
                        <div className={`p-1 rounded-full transition-all ${
                          ex.completed 
                            ? 'bg-green-500' 
                            : canToggle
                              ? 'bg-gray-200 group-hover:bg-green-100'
                              : 'bg-gray-200'
                        }`}>
                          <CheckCircle2
                            className={`h-4 w-4 transition-all ${
                              ex.completed
                                ? 'text-white fill-white'
                                : canToggle
                                  ? 'text-gray-400 group-hover:text-green-500'
                                  : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExerciseClick(exData, date, exIdx);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`font-semibold text-sm transition-colors ${
                              ex.completed
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900 group-hover:text-blue-600'
                            }`}
                          >
                            {exData.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                            <span className={`text-xs font-medium ${
                              ex.completed ? 'text-gray-400 line-through' : 'text-gray-600'
                            }`}>
                              {ex.time}
                            </span>
                          </div>
                          {!ex.completed && (
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                              <span className="text-xs font-medium text-blue-600">{exData.caloriesBurned} cal</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          </div>
        )}

        {(!entry || (entry.meals.length === 0 && entry.exercises.length === 0)) && (
          <div className="text-center text-gray-400 text-xs py-8">Chưa có dữ liệu</div>
        )}
      </div>
    </div>
  );
};

export default DayCard;

