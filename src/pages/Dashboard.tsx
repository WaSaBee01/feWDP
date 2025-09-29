import { Activity, Calendar, Flame, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface DailyBreakdown {
  date: string;
  dayName: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  mealsCompleted: number;
  mealsTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
}

interface WeeklyStats {
  startDate: string;
  endDate: string;
  dailyCaloriesTarget: number;
  weeklyCaloriesTarget: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  caloriesRemaining: number;
  dailyBreakdown: DailyBreakdown[];
  goal: string;
}

interface MonthlyStats {
  startDate: string;
  endDate: string;
  month: string;
  dailyCaloriesTarget: number;
  monthlyCaloriesTarget: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  caloriesRemaining: number;
  weeklyBreakdown: Array<{
    week: string;
    startDate: string;
    endDate: string;
    caloriesConsumed: number;
    caloriesBurned: number;
    caloriesTarget: number;
    mealsCompleted: number;
    mealsTotal: number;
    exercisesCompleted: number;
    exercisesTotal: number;
    daysWithData: number;
  }>;
  goal: string;
}

const Dashboard = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  // Calculate week start (Monday) - same logic as Progress.tsx
  const weekStart = useMemo(() => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(date);
    monday.setDate(diff);
    // Format as YYYY-MM-DD in local timezone (same as Progress.tsx)
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      if (period === 'week') {
        // Pass weekStart to match Progress.tsx logic
        const res = await api.get('/statistics/weekly', {
          params: { weekStart },
        });
        setWeeklyStats(res.data.data);
        setMonthlyStats(null);
      } else {
        const res = await api.get('/statistics/monthly');
        setMonthlyStats(res.data.data);
        setWeeklyStats(null);
      }
    } catch {
      toast.error('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  }, [period, weekStart]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'weight_loss':
        return 'Giảm cân';
      case 'muscle_gain':
        return 'Tăng cơ';
      case 'healthy_lifestyle':
        return 'Sống khỏe';
      default:
        return 'Sống khỏe';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  };

  const stats = period === 'week' ? weeklyStats : monthlyStats;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tổng quan</h2>
        <p className="text-gray-600">Theo dõi tiến trình và thống kê sức khỏe của bạn</p>
      </div>

      {/* Period Toggle */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Xem theo:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                period === 'week'
                  ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Tuần
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                period === 'month'
                  ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Tháng
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Goal and Target */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-600">Mục tiêu</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{getGoalLabel(stats.goal)}</h3>
                <p className="text-gray-600 mt-1">
                  Lượng calo tiêu thụ hàng ngày: <span className="font-semibold">{stats.dailyCaloriesTarget} cal</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">
                  {period === 'week' ? stats.weeklyCaloriesTarget?.toLocaleString() : stats.monthlyCaloriesTarget?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">cal {period === 'week' ? 'tuần' : 'tháng'}</div>
              </div>
            </div>
          </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calories Consumed */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Calories nạp vào</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.caloriesConsumed.toLocaleString()}</div>
              <div className="text-sm text-gray-500">cal</div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Mục tiêu:</span>
                  <span className="font-semibold">
                    {period === 'week' ? stats.weeklyCaloriesTarget?.toLocaleString() : stats.monthlyCaloriesTarget?.toLocaleString()} cal
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          ((stats.caloriesConsumed / (period === 'week' ? stats.weeklyCaloriesTarget : stats.monthlyCaloriesTarget)) * 100),
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calories Burned */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Calories đốt cháy</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.caloriesBurned.toLocaleString()}</div>
              <div className="text-sm text-gray-500">cal</div>
            </div>

            {/* Net Calories */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    {stats.netCalories >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600">Calories thực tế</span>
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 ${stats.netCalories >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.netCalories >= 0 ? '+' : ''}
                {stats.netCalories.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">cal</div>
              {stats.caloriesRemaining !== undefined && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Còn lại:</span>
                    <span className={`font-semibold ${stats.caloriesRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.caloriesRemaining >= 0 ? '+' : ''}
                      {stats.caloriesRemaining.toLocaleString()} cal
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily/Weekly Breakdown */}
          {period === 'week' && weeklyStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết theo ngày</h3>
              <div className="space-y-3">
                {weeklyStats.dailyBreakdown.map((day, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{day.dayName}</div>
                        <div className="text-xs text-gray-500">{formatDateShort(day.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${day.netCalories >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {day.netCalories >= 0 ? '+' : ''}
                          {day.netCalories} cal
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Nạp vào</div>
                        <div className="font-semibold text-orange-600">{day.caloriesConsumed} cal</div>
                        {day.mealsTotal > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {day.mealsCompleted}/{day.mealsTotal} bữa ăn
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Đốt cháy</div>
                        <div className="font-semibold text-blue-600">{day.caloriesBurned} cal</div>
                        {day.exercisesTotal > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {day.exercisesCompleted}/{day.exercisesTotal} bài tập
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {period === 'month' && monthlyStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết theo tuần</h3>
              <div className="space-y-3">
                {monthlyStats.weeklyBreakdown.map((week, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{week.week}</div>
                        <div className="text-xs text-gray-500">
                          {formatDateShort(week.startDate)} - {formatDateShort(week.endDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${week.caloriesConsumed - week.caloriesBurned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {week.caloriesConsumed - week.caloriesBurned >= 0 ? '+' : ''}
                          {(week.caloriesConsumed - week.caloriesBurned).toLocaleString()} cal
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Nạp vào</div>
                        <div className="font-semibold text-orange-600">{week.caloriesConsumed.toLocaleString()} cal</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Đốt cháy</div>
                        <div className="font-semibold text-blue-600">{week.caloriesBurned.toLocaleString()} cal</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Mục tiêu</div>
                        <div className="font-semibold text-gray-900">{week.caloriesTarget.toLocaleString()} cal</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          {week.mealsCompleted}/{week.mealsTotal} bữa ăn
                        </span>
                        <span>
                          {week.exercisesCompleted}/{week.exercisesTotal} bài tập
                        </span>
                        <span>{week.daysWithData} ngày có dữ liệu</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">Chưa có dữ liệu để hiển thị thống kê</p>
          <p className="text-sm text-gray-500 mt-2">Hãy bắt đầu theo dõi tiến trình của bạn!</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

