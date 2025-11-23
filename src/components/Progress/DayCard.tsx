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
          <div className="text-center text-gray-400 text-xs py-8">Không có dữ liệu</div>
        )}
      </div>
    </div>
  );
};

export default DayCard;

