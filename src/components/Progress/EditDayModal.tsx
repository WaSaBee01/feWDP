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

 