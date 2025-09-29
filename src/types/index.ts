// User types
export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  avatar?: string;
  isFirstLogin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Survey types
export interface UserSurvey {
  id: string;
  userId: string;
  goal: 'weight_loss' | 'muscle_gain' | 'healthy_lifestyle';
  weight: number;
  height: number;
  bmi: number;
  workoutDays: number;
  workoutDuration: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SelectOption {
  value: string;
  label: string;
}
