import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AuthCallback = () => {
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Đang xác thực...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      setMessage('Đăng nhập thất bại. Vui lòng thử lại.');
      return;
    }

    if (token) {
      login(token);
      api
        .get('/auth/me')
        .then((res) => {
          const userData = res.data.data;
          // Ensure isFirstLogin has a default value
          const userWithDefault = {
            ...userData,
            isFirstLogin: userData.isFirstLogin !== undefined ? userData.isFirstLogin : true,
          };
          updateUser(userWithDefault);
          // Navigate based on role and isFirstLogin
          if (userWithDefault.role === 'admin') {
            toast.success('Đăng nhập thành công!');
            navigate('/admin/dashboard', { replace: true });
          } else if (userWithDefault.isFirstLogin) {
            toast.success('Đăng nhập thành công! Vui lòng hoàn thiện thông tin.');
            navigate('/onboarding', { replace: true });
          } else {
            toast.success('Đăng nhập thành công!');
            navigate('/dashboard', { replace: true });
          }
        })
        .catch(() => {
          setMessage('Không thể lấy thông tin người dùng');
          toast.error('Không thể lấy thông tin người dùng');
        });
    } else {
      setMessage('Thiếu token xác thực.');
    }
  }, [login, updateUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-700">{message}</p>
    </div>
  );
};

export default AuthCallback;


