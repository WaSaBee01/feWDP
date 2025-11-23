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


     