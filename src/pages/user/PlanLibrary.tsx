import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Edit2, Loader2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';


interface PlanItem {
  _id: string;
  name: string;
  description?: string;
  isCommon: boolean;
  meals?: Array<{ time: string; meal: string | { _id: string; [key: string]: unknown } }>; // meal có thể là object (populated) hoặc string (ID)
  exercises?: Array<{ time: string; exercise: string | { _id: string; [key: string]: unknown } }>; // exercise có thể là object (populated) hoặc string (ID)
  totals?: {
    caloriesIn: number;
    carbs: number;
    protein: number;
    fat: number;
    caloriesOut: number;
  };
}


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
      )}

      {/* AI Plan Generation Dialog */}
      {showAIDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !generatingAI && !acceptingAI && setShowAIDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Tạo Kế Hoạch Với AI
              </h3>
              <button
                onClick={() => {
                  if (!generatingAI && !acceptingAI) {
                    setShowAIDialog(false);
                    setAiPrompt('');
                    setAiGeneratedPlan(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50"
                disabled={generatingAI || acceptingAI}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!aiGeneratedPlan ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhập yêu cầu của bạn
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ví dụ: Tạo kế hoạch giảm cân với các bữa ăn ít carbs và bài tập cardio..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      disabled={generatingAI}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt mẫu (click để sử dụng)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {samplePrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiPrompt(prompt)}
                          className="text-left px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-purple-300 transition-all"
                          disabled={generatingAI}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAIDialog(false);
                        setAiPrompt('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={generatingAI}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={generatingAI || !aiPrompt.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingAI ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Tạo Kế Hoạch
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Kế hoạch đã được tạo!</span>
                    </div>
                    <p className="text-sm text-green-700">Xem lại kế hoạch bên dưới và nhấn "Chấp nhận" để lưu vào thư viện của bạn.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">{aiGeneratedPlan.name}</h4>
                    {aiGeneratedPlan.description && (
                      <p className="text-gray-600 text-sm mb-4">{aiGeneratedPlan.description}</p>
                    )}

                    {aiGeneratedPlan.meals && aiGeneratedPlan.meals.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-800 mb-2">Bữa ăn:</h5>
                        <div className="space-y-2">
                          {aiGeneratedPlan.meals.map((item, idx) => (
                            <div key={idx} className="bg-white rounded p-2 text-sm">
                              <span className="font-medium">{item.time}</span> - {item.meal.name} ({item.meal.calories} cal)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiGeneratedPlan.exercises && aiGeneratedPlan.exercises.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-800 mb-2">Bài tập:</h5>
                        <div className="space-y-2">
                          {aiGeneratedPlan.exercises.map((item, idx) => (
                            <div key={idx} className="bg-white rounded p-2 text-sm">
                              <span className="font-medium">{item.time}</span> - {item.exercise.name} ({item.exercise.caloriesBurned} cal, {item.exercise.durationMinutes} phút)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Tổng calo nạp:</span>{' '}
                          <span className="font-semibold">
                            {aiGeneratedPlan.meals.reduce((sum, m) => sum + m.meal.calories, 0)} cal
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tổng calo tiêu thụ:</span>{' '}
                          <span className="font-semibold">
                            {aiGeneratedPlan.exercises.reduce((sum, e) => sum + e.exercise.caloriesBurned, 0)} cal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAiGeneratedPlan(null);
                        setAiPrompt('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={acceptingAI}
                    >
                      Tạo lại
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAIDialog(false);
                        setAiPrompt('');
                        setAiGeneratedPlan(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={acceptingAI}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAIAccept}
                      disabled={acceptingAI}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {acceptingAI ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        'Chấp nhận'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanLibrary;
