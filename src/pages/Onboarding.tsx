import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [goal, setGoal] = useState<'weight_loss' | 'muscle_gain' | 'healthy_lifestyle'>('healthy_lifestyle');
  const [workoutDays, setWorkoutDays] = useState(3);
  const [workoutDuration, setWorkoutDuration] = useState(60);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number | ''>('');
  const [allergies, setAllergies] = useState<string>('');

  const [bmr, setBmr] = useState<number | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);



  useEffect(() => {
    if (weight && height) {
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      
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
    const heightNum = parseFloat(height || '0');
    const weightNum = parseFloat(weight || '0');
    const ageNum = typeof age === 'number' ? age : parseFloat(String(age || '0'));
    if (weightNum > 0 && heightNum > 0 && ageNum > 0) {
      const base = 10 * weightNum + 6.25 * heightNum - 5 * ageNum;
      const value = gender === 'male' ? base + 5 : base - 161;
      setBmr(Math.round(value));
    } else {
      setBmr(null);
    }
  }, [gender, weight, height, age]);


  useEffect(() => {
    if (user && !user.isFirstLogin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/survey', {
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


      if (user) {
        updateUser({ ...user, isFirstLogin: false });
      }

      toast.success('Chào mừng đến với PerFit');
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể lưu khảo sát. Vui lòng thử lại.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

    const getBMIColor = (bmiValue: number): string => {
    if (bmiValue < 18.5) return 'text-yellow-600';
    if (bmiValue < 25) return 'text-green-600';
    if (bmiValue < 30) return 'text-orange-600';
    return 'text-red-600';
  };
  const getBMICategory = (bmiValue: number): string => {
    if (bmiValue < 18.5) return 'Thiếu cân';
    if (bmiValue < 25) return 'Bình thường';
    if (bmiValue < 30) return 'Thừa cân';
    return 'Béo phì';
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Bước {currentStep} / 3</span>
            <span>{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>


        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Khảo sát bắt đầu
            </h2>
            <p className="text-gray-600">
              Giúp chúng tôi hiểu mục tiêu của bạn
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Mục tiêu của bạn là gì?
                  </label>
                  <div className="grid grid-cols-1 gap-4">
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
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{option.icon}</span>
                          <span className="font-medium text-gray-900">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setGender('male')} className={`px-4 py-2 rounded-lg border-2 ${gender==='male' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>Nam</button>
                    <button type="button" onClick={() => setGender('female')} className={`px-4 py-2 rounded-lg border-2 ${gender==='female' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>Nữ</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tuổi</label>
                  <input type="number" value={age} onChange={(e)=> setAge(e.target.value ? parseInt(e.target.value) : '')} placeholder="VD: 28" className="input-field" min={10} max={100} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="VD: 70"
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
                    placeholder="VD: 175"
                    className="input-field"
                    required
                    min="100"
                    max="250"
                  />
                </div>

                {/* BMI Display */}
                {bmi && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Chỉ số BMI của bạn</p>
                      <p className={`text-4xl font-bold ${getBMIColor(bmi)}`}>
                        {bmi}
                      </p>
                      <p className={`text-sm font-medium ${getBMIColor(bmi)} mt-1`}>
                        {getBMICategory(bmi)}
                      </p>
                    </div>
                  </div>
                )}

                {/* BMR Display */}
                {bmr && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-blue-700 mb-1">Ước tính calo duy trì (BMR)</p>
                      <p className="text-3xl font-bold text-blue-700">{bmr} kcal/ngày</p>
                      <p className="text-xs text-blue-600 mt-1">Công thức Mifflin–St Jeor</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Workout & Fitness */}
            {currentStep === 3 && (
              <div className="space-y-6">
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
                  <div className="grid grid-cols-1 gap-4">
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
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{option.icon}</span>
                          <span className="font-medium text-gray-900">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dị ứng thực phẩm (ngăn cách bởi dấu phẩy)</label>
                  <input type="text" value={allergies} onChange={(e)=> setAllergies(e.target.value)} placeholder="VD: peanut, shrimp" className="input-field" />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Quay lại
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    nextStep();
                  }}
                  className="btn-primary px-6 py-2"
                >
                  Tiếp theo
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !weight || !height}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang lưu...' : 'Hoàn thành'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Skip button */}
        <div className="text-center mt-4">
          <button
            onClick={() => {
              if (user) {
                updateUser({ ...user, isFirstLogin: false });
              }
              navigate('/dashboard');
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Bỏ qua khảo sát
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

