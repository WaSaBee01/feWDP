import { Apple, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Ingredient {
  name: string;
  weightGram: number;
}

interface MealItem {
  _id: string;
  name: string;
  description?: string;
  ingredients?: Ingredient[];
  image?: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weightGrams: number;
  isCommon: boolean;
}

const MealLibrary = () => {
  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterIsCommon, setFilterIsCommon] = useState<string>('all'); // all, true, false
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [viewingItem, setViewingItem] = useState<MealItem | null>(null);

 
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    {editingItem ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Không có món ăn</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div 
              key={it._id} 
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all ${it.isCommon ? 'cursor-pointer' : ''}`}
              onClick={() => it.isCommon && setViewingItem(it)}
            >
              {it.image && <img src={it.image} alt={it.name} className="w-full h-40 object-cover rounded-t-lg" />}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{it.name}</h3>
                  {it.isCommon && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Dùng chung</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Calo:</span> <span className="font-medium">{it.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span> <span className="font-medium">{it.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Protein:</span> <span className="font-medium">{it.protein}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fat:</span> <span className="font-medium">{it.fat}g</span>
                  </div>
                </div>
                {!it.isCommon && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(it)}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm flex items-center justify-center gap-1"
                    >
                      <Edit2 className="h-4 w-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(it._id, it.isCommon)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{viewingItem.name}</h3>
                <button
                  onClick={() => setViewingItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Dùng chung</span>
                </div>

                {viewingItem.image && (
                  <div>
                    <img src={viewingItem.image} alt={viewingItem.name} className="w-full h-64 object-cover rounded-lg border" />
                  </div>
                )}

                {viewingItem.ingredients && viewingItem.ingredients.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thành phần</label>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="space-y-2">
                        {viewingItem.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{ing.name}</span>
                            <span className="font-medium text-gray-900">{ing.weightGram}g</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {viewingItem.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{viewingItem.description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Calories</div>
                    <div className="text-lg font-semibold">{viewingItem.calories} cal</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Khối lượng</div>
                    <div className="text-lg font-semibold">{viewingItem.weightGrams}g</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Carbs</div>
                    <div className="text-lg font-semibold">{viewingItem.carbs}g</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Protein</div>
                    <div className="text-lg font-semibold">{viewingItem.protein}g</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Fat</div>
                    <div className="text-lg font-semibold">{viewingItem.fat}g</div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={() => setViewingItem(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealLibrary;
