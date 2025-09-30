import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ApplyPlanModal, DayCard, EditDayModal, ExerciseDetailModal, MealDetailModal } from '../components/Progress';
import api from '../services/api';

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

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  caloriesBurned: number;
  videoUrl?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
}

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
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


const Progress = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showApplyPlan, setShowApplyPlan] = useState(false);
  const [showEditDay, setShowEditDay] = useState(false);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);


  const [editMeals, setEditMeals] = useState<Array<{ time: string; mealId: string; completed: boolean }>>([]);
  const [editExercises, setEditExercises] = useState<Array<{ time: string; exerciseId: string; completed: boolean }>>([]);
  const [editNotes, setEditNotes] = useState('');


  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedExerciseDate, setSelectedExerciseDate] = useState<Date | null>(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);

  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(date.setDate(diff));
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStart]);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const start = new Date(weekStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const res = await api.get('/progress', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      setEntries(res.data.data);
    } catch {
      toast.error('Không thể tải tiến trình !');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  const loadPlansAndLibrary = useCallback(async () => {
    try {
      const [dailyRes, weeklyRes, mealsRes, exRes] = await Promise.all([
        api.get('/user/plans'),
        api.get('/user/weekly-plans'),
        api.get('/user/meals'),
        api.get('/user/exercises'),
      ]);
      setDailyPlans(dailyRes.data.data);
      setWeeklyPlans(weeklyRes.data.data);
      setMeals(mealsRes.data.data);
      setExercises(exRes.data.data);
    } catch {
      toast.error('Không thể tải dữ liệu!');
    }
  }, []);

  useEffect(() => {
    loadProgress();
    loadPlansAndLibrary();
  }, [loadProgress, loadPlansAndLibrary]);



  useEffect(() => {
    if (showEditDay && selectedDate && meals.length > 0 && editMeals.length > 0) {
      const entry = getEntryForDate(selectedDate);
      if (entry) {
        const needsUpdate = editMeals.some((editMeal) => {
          if (!editMeal.mealId) return true;
          return !meals.some((m) => String(m._id) === editMeal.mealId);
        });
        
        if (needsUpdate) {
          // Update editMeals with correct IDs now that meals list is available
          const updatedMeals = editMeals.map((editMeal) => {
            // If mealId is empty or not found in meals list, try to find it
            if (!editMeal.mealId || !meals.some((m) => String(m._id) === editMeal.mealId)) {
              // Find the corresponding meal from entry
              const entryMeal = entry.meals.find((em) => em.time === editMeal.time);
              if (entryMeal) {
                let mealIdValue = '';
                if (typeof entryMeal.mealId === 'object' && entryMeal.mealId !== null && '_id' in entryMeal.mealId) {
                  mealIdValue = String(entryMeal.mealId._id);
                } else if (entryMeal.mealId) {
                  mealIdValue = String(entryMeal.mealId);
                }
                
                // Verify it exists in meals list
                if (mealIdValue && meals.some((m) => String(m._id) === mealIdValue)) {
                  return { ...editMeal, mealId: mealIdValue };
                }
                
                // Try matching by name if ID doesn't match
                if (typeof entryMeal.mealId === 'object' && entryMeal.mealId !== null && 'name' in entryMeal.mealId) {
                  const foundMeal = meals.find((m) => m.name === (entryMeal.mealId as Meal).name);
                  if (foundMeal) {
                    return { ...editMeal, mealId: String(foundMeal._id) };
                  }
                }
              }
            }
            return editMeal;
          });
          
          setEditMeals(updatedMeals);
        }
      }
    }
  }, [meals.length, showEditDay, selectedDate]);

  const getDateKey = (date: Date): string => {
    const localYear = date.getFullYear();
    const localMonth = date.getMonth();
    const localDay = date.getDate();
    const utcDate = new Date(Date.UTC(localYear, localMonth, localDay, 0, 0, 0, 0));
    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEntryForDate = (date: Date): ProgressEntry | undefined => {
    // Frontend date is a local date object representing a calendar day
    // Backend stores dates as UTC midnight (e.g., 2025-10-05T00:00:00.000Z)
    // We compare calendar dates via the normalized key to avoid timezone drift
    const dateStr = getDateKey(date);
    
    return entries.find((e) => {
      let entryDateStr: string;
      if (typeof e.date === 'string') {
        // If it's a string, extract the date part
        entryDateStr = e.date.split('T')[0];
      } else {
        // Backend stores dates as UTC, extract UTC date components
        const entryDate = new Date(e.date);
        const entryYear = entryDate.getUTCFullYear();
        const entryMonth = String(entryDate.getUTCMonth() + 1).padStart(2, '0');
        const entryDay = String(entryDate.getUTCDate()).padStart(2, '0');
        entryDateStr = `${entryYear}-${entryMonth}-${entryDay}`;
      }
      return entryDateStr === dateStr;
    });
  };

  // Extended meals list that includes meals from entry if they're not in user's meals list
  const extendedMeals = useMemo(() => {
    const mealsMap = new Map<string, Meal>();
    
    // Add all meals from user library
    meals.forEach((meal) => {
      mealsMap.set(String(meal._id), meal);
    });
    
    // Add meals from selected entry if they're not already in the map
    if (showEditDay && selectedDate) {
      // Find entry directly without calling function to avoid dependency issues
      const dateStr = getDateKey(selectedDate);
      
      const entry = entries.find((e) => {
        let entryDateStr: string;
        if (typeof e.date === 'string') {
          entryDateStr = e.date.split('T')[0];
        } else {
          // Backend stores dates as UTC, extract UTC date components
          const entryDate = new Date(e.date);
          const entryYear = entryDate.getUTCFullYear();
          const entryMonth = String(entryDate.getUTCMonth() + 1).padStart(2, '0');
          const entryDay = String(entryDate.getUTCDate()).padStart(2, '0');
          entryDateStr = `${entryYear}-${entryMonth}-${entryDay}`;
        }
        return entryDateStr === dateStr;
      });
      
      if (entry) {
        entry.meals.forEach((m) => {
          if (typeof m.mealId === 'object' && m.mealId !== null) {
            const mealObj = m.mealId as Meal;
            const mealId = String(mealObj._id);
            if (!mealsMap.has(mealId)) {
              mealsMap.set(mealId, mealObj);
            }
          }
        });
      }
    }
    
    return Array.from(mealsMap.values());
  }, [meals, showEditDay, selectedDate, entries]);


  const handleEditDay = (date: Date) => {
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    if (selectedDateOnly < today) {
      toast.error('Không thể chỉnh sửa progress cho ngày trong quá khứ');
      return;
    }

    const entry = getEntryForDate(date);
    if (entry) {
      const mappedMeals = entry.meals.map((m) => {
        // Extract mealId - handle both populated object and string/ObjectId
        let mealIdValue = '';
        
        // Simple extraction: if it's an object with _id, get _id; otherwise use the value directly
        if (typeof m.mealId === 'object' && m.mealId !== null) {
          // It's a populated Meal object
          const mealObj = m.mealId as Meal;
          
          if (mealObj._id) {
            // Direct string conversion - should work for both string and ObjectId
            mealIdValue = String(mealObj._id);
          }
        } else if (m.mealId) {
          // It's a string or ObjectId
          mealIdValue = String(m.mealId);
        }
        
        // Verify the ID exists in meals list, but keep the original ID if not found
        // (meal might be from a plan/public meals not in user library)
        if (mealIdValue && meals.length > 0) {
          const foundMeal = meals.find((meal) => {
            const mealIdStr = String(meal._id);
            return mealIdStr === mealIdValue;
          });
          
          if (!foundMeal) {
            // Try to find by matching the populated object's name as fallback
            if (typeof m.mealId === 'object' && m.mealId !== null && 'name' in m.mealId) {
              const foundByName = meals.find((meal) => meal.name === (m.mealId as Meal).name);
              if (foundByName) {
                mealIdValue = String(foundByName._id);
              }
            }
          }
        }
        
        return {
          time: m.time,
          mealId: mealIdValue,
          completed: m.completed,
        };
      });
      setEditMeals(mappedMeals);
      setEditExercises(
        entry.exercises.map((e) => {
          // Extract exerciseId - handle both populated object and string/ObjectId
          let exerciseIdValue = '';
          
          if (typeof e.exerciseId === 'object' && e.exerciseId !== null) {
            // It's a populated Exercise object - extract _id
            const exerciseObj = e.exerciseId as Exercise;
            if (exerciseObj._id) {
              exerciseIdValue = String(exerciseObj._id);
            }
          } else if (e.exerciseId) {
            // It's a string or ObjectId - convert to string
            exerciseIdValue = String(e.exerciseId);
          }
          
          // Verify the ID exists in exercises list and update if needed
          if (exerciseIdValue && exercises.length > 0) {
            // Check if ID exists in exercises list
            const existsInExercises = exercises.some((ex) => String(ex._id) === exerciseIdValue);
            
            if (!existsInExercises) {
              // If not found, try to find by matching the populated object's name
              if (typeof e.exerciseId === 'object' && e.exerciseId !== null && 'name' in e.exerciseId) {
                const foundExercise = exercises.find((ex) => ex.name === (e.exerciseId as Exercise).name);
                if (foundExercise) {
                  exerciseIdValue = String(foundExercise._id);
                }
              }
            }
          }
          
          return {
            time: e.time,
            exerciseId: exerciseIdValue,
            completed: e.completed,
          };
        })
      );
      setEditNotes(entry.notes || '');
    } else {
      setEditMeals([]);
      setEditExercises([]);
      setEditNotes('');
    }
    setSelectedDate(date);
    setShowEditDay(true);
  };

  const handleSaveDay = async () => {
    if (!selectedDate) return;
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    if (selectedDateOnly < today) {
      toast.error('Không thể lưu progress cho ngày trong quá khứ');
      return;
    }

    try {
      const dateStr = getDateKey(selectedDate);
      await api.post('/progress', {
        date: dateStr,
        meals: editMeals,
        exercises: editExercises,
        notes: editNotes,
      });
      toast.success('Đã lưu tiến trình');
      setShowEditDay(false);
      setSelectedDate(null);
      loadProgress();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const handleToggleCompletion = async (date: Date, type: 'meal' | 'exercise', index: number) => {
    const dateStr = getDateKey(date);
    
    const entry = getEntryForDate(date);
    
    // Check if entry exists and has the item
    if (!entry) {
      toast.error('Vui lòng thêm món ăn/bài tập cho ngày này trước');
      return;
    }
    
    if (type === 'meal' && (!entry.meals || !entry.meals[index])) {
      toast.error('Không tìm thấy món ăn');
      return;
    }
    
    if (type === 'exercise' && (!entry.exercises || !entry.exercises[index])) {
      toast.error('Không tìm thấy bài tập');
      return;
    }
    
    // Kiểm tra xem đã đến giờ chưa (chỉ kiểm tra khi đang check, không kiểm tra khi uncheck)
    const item = type === 'meal' ? entry.meals[index] : entry.exercises[index];
    if (!item.completed && !canToggleCompletion(date, item.time)) {
      toast.error('Chưa đến giờ! Bạn chỉ có thể đánh dấu hoàn thành sau khi đến giờ đã lên lịch.');
      return;
    }
    
    try {
      // Optimistic update - update UI immediately
      setEntries((prev) => {
        return prev.map((e) => {
          let entryDateStr: string;
          if (typeof e.date === 'string') {
            entryDateStr = e.date.split('T')[0];
          } else {
            // Backend stores dates as UTC, extract UTC date components
            const entryDate = new Date(e.date);
            const entryYear = entryDate.getUTCFullYear();
            const entryMonth = String(entryDate.getUTCMonth() + 1).padStart(2, '0');
            const entryDay = String(entryDate.getUTCDate()).padStart(2, '0');
            entryDateStr = `${entryYear}-${entryMonth}-${entryDay}`;
          }
          if (entryDateStr === dateStr) {
            const updated = { ...e };
            if (type === 'meal' && updated.meals && updated.meals[index]) {
              updated.meals = [...updated.meals];
              updated.meals[index] = { ...updated.meals[index], completed: !updated.meals[index].completed };
            } else if (type === 'exercise' && updated.exercises && updated.exercises[index]) {
              updated.exercises = [...updated.exercises];
              updated.exercises[index] = { ...updated.exercises[index], completed: !updated.exercises[index].completed };
            }
            return updated;
          }
          return e;
        });
      });
      
      const res = await api.post('/progress/toggle-completion', {
        date: dateStr,
        type,
        index,
      });
      
      // Update with server response
      if (res.data.success && res.data.data) {
        const updatedEntry = res.data.data;
        setEntries((prev) => {
          const existingIndex = prev.findIndex((e) => {
            let entryDateStr: string;
            if (typeof e.date === 'string') {
              entryDateStr = e.date.split('T')[0];
            } else {
              // Backend stores dates as UTC, extract UTC date components
              const entryDate = new Date(e.date);
              const entryYear = entryDate.getUTCFullYear();
              const entryMonth = String(entryDate.getUTCMonth() + 1).padStart(2, '0');
              const entryDay = String(entryDate.getUTCDate()).padStart(2, '0');
              entryDateStr = `${entryYear}-${entryMonth}-${entryDay}`;
            }
            return entryDateStr === dateStr;
          });
          
          if (existingIndex >= 0) {
            const newEntries = [...prev];
            newEntries[existingIndex] = updatedEntry;
            return newEntries;
          } else {
            return [...prev, updatedEntry];
          }
        });
      } else {
        // Reload if response format is unexpected
        loadProgress();
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể cập nhật';
      toast.error(message);
      // Reload on error to sync with server
      loadProgress();
    }
  };


  const prevWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };


  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDayComplete = (entry: ProgressEntry | undefined): boolean => {
    if (!entry) return false;
    const hasMeals = entry.meals.length > 0;
    const hasExercises = entry.exercises.length > 0;
    
    if (!hasMeals && !hasExercises) return false;
    
    const allMealsComplete = !hasMeals || entry.meals.every((m) => m.completed);
    const allExercisesComplete = !hasExercises || entry.exercises.every((e) => e.completed);
    
    return allMealsComplete && allExercisesComplete;
  };


  // Kiểm tra xem đã đến giờ của meal/exercise chưa
  const canToggleCompletion = (date: Date, time: string): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Allow past days (already happened)
    if (entryDate < today) {
      return true;
    }

    // Block future days entirely
    if (entryDate > today) {
      return false;
    }

    // Same day: require valid time and current time >= scheduled time
    if (!time) {
      return false;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    return now >= scheduledTime;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tiến trình</h2>
        <p className="text-gray-600">Theo dõi và quản lý tiến trình hàng ngày của bạn</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goToToday} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Hôm nay
            </button>
            <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="ml-4 font-medium text-gray-700">
              {weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <button
            onClick={() => setShowApplyPlan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            Áp dụng kế hoạch
          </button>
        </div>
      </div>

      {/* Calendar Week View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((date, idx) => {
            const entry = getEntryForDate(date);
            const isCurrentDay = isToday(date);
            const isComplete = isDayComplete(entry);
            return (
              <DayCard
                key={idx}
                date={date}
                entry={entry}
                meals={meals}
                exercises={exercises}
                isCurrentDay={isCurrentDay}
                isComplete={isComplete}
                canToggleCompletion={canToggleCompletion}
                onEdit={handleEditDay}
                onToggleCompletion={handleToggleCompletion}
                onMealClick={(meal) => setSelectedMeal(meal as Meal)}
                onExerciseClick={(exercise, date, index) => {
                  setSelectedExercise(exercise as Exercise);
                  setSelectedExerciseDate(date);
                  setSelectedExerciseIndex(index);
                }}
              />
            );
          })}
        </div>
      )}

      <ApplyPlanModal
        isOpen={showApplyPlan}
        onClose={() => setShowApplyPlan(false)}
        dailyPlans={dailyPlans}
        weeklyPlans={weeklyPlans}
        onSuccess={loadProgress}
      />

      <EditDayModal
        isOpen={showEditDay}
        selectedDate={selectedDate}
        onClose={() => setShowEditDay(false)}
        editMeals={editMeals}
        editExercises={editExercises}
        editNotes={editNotes}
        extendedMeals={extendedMeals}
        exercises={exercises}
        onMealsChange={setEditMeals}
        onExercisesChange={setEditExercises}
        onNotesChange={setEditNotes}
        onSave={handleSaveDay}
      />

      <MealDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />

      <ExerciseDetailModal 
        exercise={selectedExercise} 
        date={selectedExerciseDate}
        exerciseIndex={selectedExerciseIndex}
        onClose={() => {
          setSelectedExercise(null);
          setSelectedExerciseDate(null);
          setSelectedExerciseIndex(null);
        }}
        onExerciseCompleted={loadProgress}
      />
    </div>
  );
};

export default Progress;

