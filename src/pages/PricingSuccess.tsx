import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Pricing = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

 // Làm mới dữ liệu người dùng khi thành phần được gắn kết để lấy trạng thái đăng ký mới nhất
  useEffect(() => {
    const refreshUserData = async () => {
      if (user) {
        try {
          const userRes = await api.get('/auth/me');
          if (userRes.data.success && userRes.data.data) {
            updateUser(userRes.data.data);
          }
        } catch (err) {
          console.error('Không làm mới được dữ liệu người dùng:', err);
        }
      }
    };
    refreshUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi gắn kết

  const features = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI Tạo Món Ăn',
      description: 'Sử dụng AI để tạo món ăn phù hợp với sở thích, dị ứng và mục tiêu của bạn',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'AI Tạo Kế Hoạch',
      description: 'Tự động tạo kế hoạch dinh dưỡng và luyện tập cá nhân hóa với AI',
    },
    {
      icon: <Check className="h-5 w-5" />,
      title: 'Truy Cập Không Giới Hạn',
      description: 'Sử dụng tất cả tính năng premium không giới hạn',
    },
    {
      icon: <Check className="h-5 w-5" />,
      title: 'Hỗ Trợ Ưu Tiên',
      description: 'Được hỗ trợ ưu tiên từ đội ngũ chuyên nghiệp',
    },
  ];

  const plans = [
    {
      type: 'monthly',
      name: 'Gói Tháng',
      price: 99000,
      period: 'tháng',
      description: 'Thanh toán theo tháng, linh hoạt',
      popular: false,
    },
    {
      type: 'yearly',
      name: 'Gói Năm',
      price: 950400,
      period: 'năm',
      description: 'Tiết kiệm 20% so với gói tháng',
      popular: true,
      savings: 'Tiết kiệm 237.600đ',
    },
  ];

  const handleUpgrade = async (type: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để nâng cấp!');
      navigate('/login');
      return;
    }

    // Cho phép nâng cấp ngay cả khi người dùng đã có VIP (for renewal/extending)
    // Phần phụ trợ sẽ xử lý việc gia hạn ngày hết hạn
    try {
      setLoading(type);
      const res = await api.post('/payment/vip/checkout', { type });
      
      if (res.data.success && res.data.data?.paymentLink) {
        // Chuyển hướng đến trang thanh toán PayOS
        window.location.href = res.data.data.paymentLink;
      } else {
        toast.error('Không thể tạo link thanh toán! Vui lòng thử lại sau.');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tạo thanh toán';
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const isVip = user?.isVip && 
    user?.vipExpiresAt && 
    new Date(user.vipExpiresAt) > new Date();

  const isPremium = user?.subscriptionStatus === 'premium' || isVip;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return 0;
    const expiresAt = new Date(dateString);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nâng Cấp Lên Gói VIP
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trải nghiệm đầy đủ tính năng AI để tối ưu hóa hành trình sức khỏe của bạn
          </p>
          
          {/* Current Plan Info */}
          {user && (isPremium || isVip) && (user.vipExpiresAt || user.subscriptionExpiresAt) && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-orange-600" />
                  <span className="text-lg font-semibold text-orange-900">Gói Hiện Tại: Premium</span>
                </div>
                {user.vipExpiresAt && (
                  <>
                    <p className="text-sm text-orange-700 mb-1">
                      Hết hạn: {formatDate(user.vipExpiresAt)}
                    </p>
                    {getDaysRemaining(user.vipExpiresAt) > 0 && (
                      <p className="text-xs text-orange-600 font-medium">
                        Còn lại: {getDaysRemaining(user.vipExpiresAt)} {getDaysRemaining(user.vipExpiresAt) === 1 ? 'ngày' : 'ngày'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Cards - Always show to allow upgrade/renewal */}
        <div className="max-w-5xl mx-auto">
          {isVip && user?.vipExpiresAt && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Check className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold text-green-900">Bạn đã có gói VIP</span>
              </div>
              <p className="text-gray-700 mb-2">
                Gói của bạn hết hạn vào: <span className="font-semibold text-green-700">{formatDate(user.vipExpiresAt)}</span>
              </p>
              {getDaysRemaining(user.vipExpiresAt) > 0 && (
                <p className="text-sm text-green-600 mb-3">
                  Còn lại: {getDaysRemaining(user.vipExpiresAt)} {getDaysRemaining(user.vipExpiresAt) === 1 ? 'ngày' : 'ngày'}
                </p>
              )}
              <p className="text-sm text-gray-600">
                Bạn có thể gia hạn gói ngay bây giờ để tiếp tục sử dụng dịch vụ và không bị gián đoạn
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.type}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden relative ${
                  plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    ⭐ Phổ Biến Nhất
                  </div>
                )}
                <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
                      <span className="text-gray-600 ml-2">đ/{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <p className="text-sm text-green-600 font-semibold">{plan.savings}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    {isVip && user?.vipExpiresAt && (
                      <p className="text-xs text-orange-600 font-medium mt-2">
                        Gia hạn sẽ được cộng dồn vào ngày hết hạn hiện tại
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan.type as 'monthly' | 'yearly')}
                    disabled={loading === plan.type}
                    className={`w-full font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {loading === plan.type ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        <span>{isVip ? 'Gia Hạn Gói' : 'Chọn Gói Này'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <div className="font-semibold text-gray-900 mb-1">Thanh Toán An Toàn</div>
                <div className="text-sm text-gray-600">Được bảo vệ bởi PayOS</div>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-semibold text-gray-900 mb-1">Hủy Bất Cứ Lúc Nào</div>
                <div className="text-sm text-gray-600">Không ràng buộc dài hạn</div>
              </div>
              <div>
                <div className="text-3xl mb-2">💬</div>
                <div className="font-semibold text-gray-900 mb-1">Hỗ Trợ 24/7</div>
                <div className="text-sm text-gray-600">Đội ngũ luôn sẵn sàng</div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <p className="text-gray-600">
            Có câu hỏi? Liên hệ chúng tôi tại{' '}
            <a href="mailto:support@gymnet.com" className="text-primary-600 hover:underline">
              support@gymnet.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;