import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyPlan {
  _id: string;
  name: string;
}

interface WeeklyPlan {
  _id: string;
  name: string;
}

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  onSuccess: () => void;
}

const ApplyPlanModal = ({ isOpen, onClose, dailyPlans, weeklyPlans, onSuccess }: ApplyPlanModalProps) => {
  const [applyPlanType, setApplyPlanType] = useState<'daily' | 'weekly'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleApplyPlan = async () => {
    try {
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn kế hoạch');
        return;
      }

      if (applyPlanType === 'daily') {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày');
          return;
        }
        
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho ngày trong quá khứ');
          return;
        }
        await api.post('/progress/apply-daily', {
          planId: selectedPlanId,
          startDate: applyStartDate,
          endDate: applyStartDate, // Use same date for start and end
        });
        toast.success('Đã áp dụng kế hoạch ngày');
      } else {
        if (!applyStartDate) {
          toast.error('Vui lòng chọn ngày bắt đầu');
          return;
        }
        // Validate date is not in the past
        const selectedDate = new Date(applyStartDate + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedDate < todayDate) {
          toast.error('Không thể áp dụng kế hoạch cho tuần trong quá khứ');
          return;
        }

        await api.post('/progress/apply-weekly', {
          weeklyPlanId: selectedPlanId,
          weekStartDate: applyStartDate,
        });
        toast.success('Đã áp dụng kế hoạch tuần');
      }
      setSelectedPlanId('');
      setApplyStartDate('');
      setApplyEndDate('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Áp dụng kế hoạch</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại kế hoạch</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setApplyPlanType('daily')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'daily'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch ngày
                </button>
                <button
                  onClick={() => setApplyPlanType('weekly')}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    applyPlanType === 'weekly'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kế hoạch tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn {applyPlanType === 'daily' ? 'kế hoạch ngày' : 'kế hoạch tuần'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">--- Chọn kế hoạch ---</option>
                {(applyPlanType === 'daily' ? dailyPlans : weeklyPlans).map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {applyPlanType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                    setApplyEndDate(''); // Clear end date when changing start date
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ có thể chọn ngày hôm nay hoặc ngày trong tương lai
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={applyStartDate}
                  min={todayStr}
                  onChange={(e) => {
                    setApplyStartDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Kế hoạch sẽ chạy liên tục 7 ngày kể từ ngày bạn chọn (Thứ 2 tương ứng ngày bắt đầu).</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button onClick={handleApplyPlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPlanModal;

