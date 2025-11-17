import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register
  const { login: setToken, updateUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError('');
    
    // Redirect to Google OAuth
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      console.log("🚀 ~ handleEmailLogin ~ response:", response)

      const { user, token } = response.data.data;
      setToken(token);
      updateUser(user);

      toast.success('Đăng nhập thành công!');
      
      // Check role first
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.isFirstLogin) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

 

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">500+</div>
            <div className="text-xs text-gray-600 mt-1">Bài tập</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">1000+</div>
            <div className="text-xs text-gray-600 mt-1">Thành viên</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">24/7</div>
            <div className="text-xs text-gray-600 mt-1">Hỗ trợ</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;