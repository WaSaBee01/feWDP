import { CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PricingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Token không hợp lệ');
      navigate('/pricing');
      return;
    }

    const handlePaymentSuccess = async () => {
      try {
        const res = await api.post('/payment/vip/success', { token });
        
        if (res.data.success) {
          // Update user info from backend to get latest VIP status
          try {
            const userRes = await api.get('/auth/me');
            if (userRes.data.success && userRes.data.data) {
              // Update user in context and localStorage
              updateUser(userRes.data.data);
              console.log('User data updated:', userRes.data.data);
            }
          } catch (userErr) {
            console.error('Không thể lấy dữ liệu người dùng:', userErr);
            // Still show success even if user fetch fails
          }
          
          setSuccess(true);
          toast.success('Nâng cấp thành công! Chúc mừng bạn đã trở thành thành viên VIP!');
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          throw new Error('Thanh toán không thành công');
        }
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xác thực thanh toán';
        toast.error(message);
        navigate('/pricing');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang xác thực thanh toán...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thanh Toán Thành Công!</h1>
          <p className="text-gray-600 mb-6">
            Chúc mừng bạn đã trở thành thành viên VIP của PerFit. Bạn có thể sử dụng tất cả tính năng AI ngay bây giờ!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              Đang chuyển hướng đến trang chủ...
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-700 transition-all"
          >
            Đi Đến Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PricingSuccess;

