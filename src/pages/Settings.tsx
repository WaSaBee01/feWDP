import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [goal, setGoal] = useState<'weight_loss' | 'muscle_gain' | 'healthy_lifestyle'>('healthy_lifestyle');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [workoutDays, setWorkoutDays] = useState(3);
  const [workoutDuration, setWorkoutDuration] = useState(60);
  const [age, setAge] = useState<number | ''>('');
  const [allergies, setAllergies] = useState<string>('');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [gender, setGender] = useState<'male' | 'female'>('male');


  // Load existing survey data
  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const response = await api.get('/survey');
        const data = response.data.data;
        
        setGoal(data.goal);
        setWeight(data.weight.toString());
        setHeight(data.height.toString());
        setWorkoutDays(data.workoutDays);
        setWorkoutDuration(data.workoutDuration);
        setFitnessLevel(data.fitnessLevel);
        if (data.gender) setGender(data.gender);
        if (data.age) setAge(data.age);
        if (Array.isArray(data.allergies)) setAllergies(data.allergies.join(', '));
        if (data.dailyCalories) setBmr(data.dailyCalories);
      } catch (err) {
        console.log('No survey data found');
      }
    };

    loadSurvey();
  }, []);

  useEffect(() => {
    if (weight && height) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);
      
      if (weightNum > 0 && heightNum > 0) {
        const heightInMeters = heightNum / 100;
        const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
        setBmi(parseFloat(calculatedBmi.toFixed(1)));
      } else {
        setBmi(null);
      }
    } else {
      setBmi(null);
    }
  }, [weight, height]);

  useEffect(() => {
    const weightNum = parseFloat(weight || '0');
    const heightNum = parseFloat(height || '0');
    const ageNum = typeof age === 'number' ? age : parseFloat(String(age || '0'));
    if (weightNum > 0 && heightNum > 0 && ageNum > 0) {
      const base = 10 * weightNum + 6.25 * heightNum - 5 * ageNum;
      const value = gender === 'male' ? base + 5 : base - 161;
      setBmr(Math.round(value));
    } else {
      setBmr(null);
    }
  }, [gender, weight, height, age]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/survey', {
        goal,
        weight: parseFloat(weight),
        height: parseFloat(height),
        workoutDays,
        workoutDuration,
        fitnessLevel,
        gender,
        age: typeof age === 'number' ? age : parseFloat(String(age)),
        allergies: allergies
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });

      setSuccess('Update Successful!');
      toast.success('Update information success!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || ' Vui lòng thử lại.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getBMICategory = (bmiValue: number): string => {
    if (bmiValue < 18.5) return 'Thiếu cân';
    if (bmiValue < 25) return 'Bình thường';
    if (bmiValue < 30) return 'Thừa cân';
    return 'Béo phì';
  };

  const getBMIColor = (bmiValue: number): string => {
    if (bmiValue < 18.5) return 'text-yellow-600';
    if (bmiValue < 25) return 'text-green-600';
    if (bmiValue < 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt</h2>
        <p className="text-gray-600">Quản lý thông tin và mục tiêu của bạn</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}


      <div className="card mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin cá nhân</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="input-field bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Mục tiêu & Thể trạng</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Mục tiêu của bạn
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'weight_loss', label: 'Giảm cân', icon: '📉' },
                { value: 'muscle_gain', label: 'Tăng cơ', icon: '💪' },
                { value: 'healthy_lifestyle', label: 'Sống khỏe', icon: '🌿' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGoal(option.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    goal === option.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl block mb-2">{option.icon}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gender/Age */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setGender('male')} className={`px-4 py-2 rounded-lg border-2 ${gender==='male' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>Nam</button>
                <button type="button" onClick={() => setGender('female')} className={`px-4 py-2 rounded-lg border-2 ${gender==='female' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>Nữ</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tuổi</label>
              <input type="number" value={age} onChange={(e)=> setAge(e.target.value ? parseInt(e.target.value) : '')} className="input-field" min={10} max={100} />
            </div>
          </div>

          {/* Body measurements */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cân nặng (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-field"
                required
                min="20"
                max="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chiều cao (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="input-field"
                required
                min="100"
                max="250"
              />
            </div>
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Chỉ số BMI của bạn</p>
                <p className={`text-4xl font-bold ${getBMIColor(bmi)}`}>{bmi}</p>
                <p className={`text-sm font-medium ${getBMIColor(bmi)} mt-1`}>
                  {getBMICategory(bmi)}
                </p>
              </div>
            </div>
          )}

          {/* BMI & BMR */}
          {(bmi || bmr) && (
            <div className="grid grid-cols-2 gap-4">
              {bmi && (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">BMI</p>
                  <p className={`text-3xl font-bold ${getBMIColor(bmi)}`}>{bmi}</p>
                  <p className={`text-xs font-medium ${getBMIColor(bmi)} mt-1`}>{getBMICategory(bmi)}</p>
                </div>
              )}
              {bmr && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-700 mb-1">BMR (ước tính kcal/ngày)</p>
                  <p className="text-3xl font-bold text-blue-700">{bmr}</p>
                  <p className="text-xs text-blue-600 mt-1">Mifflin–St Jeor</p>
                </div>
              )}
            </div>
          )}

          {/* Workout preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số ngày tập mỗi tuần
            </label>
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setWorkoutDays(day)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    workoutDays === day
                      ? 'border-primary-600 bg-primary-50 font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian mỗi buổi tập (phút)
            </label>
            <input
              type="number"
              value={workoutDuration}
              onChange={(e) => setWorkoutDuration(parseInt(e.target.value))}
              className="input-field"
              required
              min="15"
              max="300"
              step="15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Cường độ tập luyện
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'beginner', label: 'Mới bắt đầu', icon: '🌱' },
                { value: 'intermediate', label: 'Có kinh nghiệm', icon: '🔥' },
                { value: 'advanced', label: 'Chuyên nghiệp', icon: '💪' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFitnessLevel(option.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    fitnessLevel === option.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl block mb-2">{option.icon}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dị ứng thực phẩm (ngăn cách bởi dấu phẩy)</label>
            <input type="text" value={allergies} onChange={(e)=> setAllergies(e.target.value)} className="input-field" placeholder="VD: peanut, shrimp" />
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !weight || !height}
              className="btn-primary px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

