import { Dumbbell, Utensils, X } from "lucide-react";

interface Meal {
  _id: string;
  name: string;
  calories: number;
}

interface Exercise {
  _id: string;
  name: string;
  caloriesBurned: number;
}

interface EditDayModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  editMeals: Array<{ time: string; mealId: string; completed: boolean }>;
  editExercises: Array<{
    time: string;
    exerciseId: string;
    completed: boolean;
  }>;
  editNotes: string;
  extendedMeals: Meal[];
  exercises: Exercise[];
  onMealsChange: (
    meals: Array<{ time: string; mealId: string; completed: boolean }>
  ) => void;
  onExercisesChange: (
    exercises: Array<{ time: string; exerciseId: string; completed: boolean }>
  ) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
}

const EditDayModal = ({
  isOpen,
  selectedDate,
  onClose,
  editMeals,
  editExercises,
  editNotes,
  extendedMeals,
  exercises,
  onMealsChange,
  onExercisesChange,
  onNotesChange,
  onSave,
}: EditDayModalProps) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };
  const addExerciseRow = () => {
    onExercisesChange([
      ...editExercises,
      { time: "", exerciseId: "", completed: false },
    ]);
  };

  const addMealRow = () => {
    onMealsChange([...editMeals, { time: "", mealId: "", completed: false }]);
  };

  const removeMealRow = (idx: number) => {
    onMealsChange(editMeals.filter((_, i) => i !== idx));
  };

  const removeExerciseRow = (idx: number) => {
    onExercisesChange(editExercises.filter((_, i) => i !== idx));
  };

  if (!isOpen || !selectedDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateOnly = new Date(selectedDate);
  selectedDateOnly.setHours(0, 0, 0, 0);
  const isPastDate = selectedDateOnly < today;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">
              Chọn lại ngày {formatDate(selectedDate)}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {isPastDate && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ Không thể chỉnh sửa progress cho ngày trong quá khứ. Vui lòng
                chọn bây giờ hoặc những ngày trong tương lai.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Meals */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Bữa ăn
                </h4>
                <button
                  onClick={addMealRow}
                  className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded hover:bg-primary-100"
                >
                  + Thêm bữa
                </button>
              </div>
              <div className="space-y-3">
                {editMeals.map((meal, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <input
                      type="time"
                      value={meal.time}
                      onChange={(e) =>
                        onMealsChange(
                          editMeals.map((m, i) =>
                            i === idx ? { ...m, time: e.target.value } : m
                          )
                        )
                      }
                      className="col-span-3 px-3 py-2 border rounded"
                    />
                    <select
                      value={meal.mealId || ""}
                      onChange={(e) => {
                        onMealsChange(
                          editMeals.map((m, i) =>
                            i === idx ? { ...m, mealId: e.target.value } : m
                          )
                        );
                      }}
                      className="col-span-8 px-3 py-2 border rounded"
                    >
                      <option value="">Chọn món ăn</option>
                      {extendedMeals.map((m) => (
                        <option key={m._id} value={String(m._id)}>
                          {m.name} — {m.calories} cal
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeMealRow(idx)}
                      className="col-span-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercises */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Bài tập
                </h4>
                <button
                  onClick={addExerciseRow}
                  className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded hover:bg-primary-100"
                >
                  + Thêm bài tập
                </button>
              </div>
              <div className="space-y-3">
                {editExercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <input
                      type="time"
                      value={ex.time}
                      onChange={(e) =>
                        onExercisesChange(
                          editExercises.map((ex, i) =>
                            i === idx ? { ...ex, time: e.target.value } : ex
                          )
                        )
                      }
                      className="col-span-3 px-3 py-2 border rounded"
                    />
                    <select
                      value={ex.exerciseId}
                      onChange={(e) =>
                        onExercisesChange(
                          editExercises.map((ex, i) =>
                            i === idx
                              ? { ...ex, exerciseId: e.target.value }
                              : ex
                          )
                        )
                      }
                      className="col-span-8 px-3 py-2 border rounded"
                    >
                      <option value="">Chọn bài tập</option>
                      {exercises.map((e) => (
                        <option key={e._id} value={String(e._id)}>
                          {e.name} — {e.caloriesBurned} cal
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeExerciseRow(idx)}
                      className="col-span-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Hãy thêm ghi chú cho ngày này..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={onSave}
                disabled={isPastDate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDayModal;
