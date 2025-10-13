import { MessageCircle, Reply } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  caloriesBurned: number;
  videoUrl?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
}

interface CommentUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CommentReply {
  _id: string;
  content: string;
  userId: CommentUser;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: CommentUser;
  createdAt: string;
  updatedAt: string;
  replies: CommentReply[];
}

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  date: Date | null;
  exerciseIndex: number | null;
  onClose: () => void;
  onExerciseCompleted?: () => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*[&?]v=([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
};

const formatCommentDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

interface YouTubePlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YouTubePlayerConfig {
  videoId: string;
  events: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
  };
}

interface YouTubeAPI {
  Player: new (elementId: string, config: YouTubePlayerConfig) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ExerciseDetailModal = ({ exercise, date, exerciseIndex, onClose, onExerciseCompleted }: ExerciseDetailModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const hasAutoCompletedRef = useRef(false);
  const { user } = useAuth();

  const loadComments = useCallback(async (exerciseId: string) => {
    try {
      setLoadingComments(true);
      const res = await api.get(`/user/exercises/${exerciseId}/comments`);
      setComments(res.data.data || []);
    } catch (err: unknown) {
      console.error('Error loading comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*[&?]v=([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Auto-complete exercise when 80% watched
  const handleAutoComplete = useCallback(async () => {
    if (!date || exerciseIndex === null || hasAutoCompletedRef.current) return;

    hasAutoCompletedRef.current = true;

    try {
      // Format date as YYYY-MM-DD for API call
      const localYear = date.getFullYear();
      const localMonth = date.getMonth();
      const localDay = date.getDate();
      const utcDate = new Date(Date.UTC(localYear, localMonth, localDay, 0, 0, 0, 0));
      const year = utcDate.getUTCFullYear();
      const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Check if exercise is already completed
      const res = await api.get('/progress', {
        params: {
          startDate: dateStr,
          endDate: dateStr,
        },
      });

      const entries = res.data.data || [];
      const entry = entries.find((e: { date: string | Date; exercises?: Array<{ completed: boolean }> }) => {
        let entryDateStr: string;
        if (typeof e.date === 'string') {
          entryDateStr = e.date.split('T')[0];
        } else {
          const entryDate = new Date(e.date);
          const entryYear = entryDate.getUTCFullYear();
          const entryMonth = String(entryDate.getUTCMonth() + 1).padStart(2, '0');
          const entryDay = String(entryDate.getUTCDate()).padStart(2, '0');
          entryDateStr = `${entryYear}-${entryMonth}-${entryDay}`;
        }
        return entryDateStr === dateStr;
      });

      if (entry && entry.exercises && entry.exercises[exerciseIndex]) {
        // Only mark as completed if not already completed
        if (!entry.exercises[exerciseIndex].completed) {
          await api.post('/progress/toggle-completion', {
            date: dateStr,
            type: 'exercise',
            index: exerciseIndex,
          });
          toast.success('Đã tự động tick bài tập hoàn thành!');
          if (onExerciseCompleted) {
            onExerciseCompleted();
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error auto-completing exercise:', err);
      hasAutoCompletedRef.current = false; 
    }
  }, [date, exerciseIndex, onExerciseCompleted]);

  
  useEffect(() => {
    if (!exercise?.videoUrl || !date || exerciseIndex === null) {
      return;
    }

    hasAutoCompletedRef.current = false;

    const videoId = getYouTubeVideoId(exercise.videoUrl);
    if (!videoId) return;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        const playerId = `youtube-player-${exercise._id}`;
        try {
          new window.YT.Player(playerId, {
            videoId: videoId,
            events: {
              onReady: (event) => {
                playerRef.current = event.target;
              },
              onStateChange: (event) => {
                const player = event.target;
                
               
                if (window.YT && event.data === window.YT.PlayerState.PLAYING && !hasAutoCompletedRef.current) {
                  
                  if (progressIntervalRef.current !== null) {
                    clearInterval(progressIntervalRef.current);
                  }

               
                  progressIntervalRef.current = window.setInterval(() => {
                    if (player && player.getCurrentTime && player.getDuration) {
                      try {
                        const currentTime = player.getCurrentTime();
                        const duration = player.getDuration();
                        
                        if (duration > 0 && currentTime > 0) {
                          const progress = (currentTime / duration) * 100;
                          
                          // Auto-complete when reaching 80%
                          if (progress >= 80 && !hasAutoCompletedRef.current) {
                            if (progressIntervalRef.current !== null) {
                              clearInterval(progressIntervalRef.current);
                              progressIntervalRef.current = null;
                            }
                            handleAutoComplete();
                          }
                        }
                      } catch (err) {
                        console.error('Error checking video progress:', err);
                      }
                    }
                  }, 1000); // Check every second
                } 
                // Stop tracking when video is paused or ended
                else if (window.YT && (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED)) {
                  if (progressIntervalRef.current !== null) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                  }
                }
              },
            },
          });
        } catch (err) {
          console.error('Error initializing YouTube players:', err);
        }
      } else {
        setTimeout(initPlayer, 100);
      }
    };

    let retryCount = 0;
    const maxRetries = 50; 
    
    const checkAndInit = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkAndInit, 100);
      } else {
       
        window.onYouTubeIframeAPIReady = initPlayer;
      }
    };

    checkAndInit();

    return () => {
      if (progressIntervalRef.current !== null) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Cleanup player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying player:', err);
        }
        playerRef.current = null;
      }
      
      hasAutoCompletedRef.current = false;
    };
  }, [exercise?.videoUrl, exercise?._id, date, exerciseIndex, handleAutoComplete]);

  useEffect(() => {
    if (exercise) {
      loadComments(exercise._id);
    } else {
      setComments([]);
      setCommentContent('');
      setReplyingTo(null);
      setReplyContent({});
    }
  }, [exercise, loadComments]);

  const handleSubmitComment = async (exerciseId: string) => {
    if (!commentContent.trim()) {
      toast.error('Vui lòng nhập nội dung comment');
      return;
    }
    try {
      const res = await api.post(`/user/exercises/${exerciseId}/comments`, {
        content: commentContent.trim(),
      });
      setComments((prev) => [...prev, res.data.data]);
      setCommentContent('');
      toast.success('Đã thêm comment thành công');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể thêm comment';
      toast.error(message);
    }
  };

  const handleSubmitReply = async (exerciseId: string, parentCommentId: string) => {
    const replyText = replyContent[parentCommentId];
    if (!replyText || !replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    try {
      const res = await api.post(`/user/exercises/${exerciseId}/comments`, {
        content: replyText.trim(),
        parentCommentId,
      });
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: [...comment.replies, res.data.data],
            };
          }
          return comment;
        })
      );
      setReplyContent((prev) => {
        const newContent = { ...prev };
        delete newContent[parentCommentId];
        return newContent;
      });
      setReplyingTo(null);
      toast.success('Đã thêm phản hồi thành công');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể thêm phản hồi';
      toast.error(message);
    }
  };

  const handleDeleteComment = async (exerciseId: string, commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa comment này?')) return;
    try {
      await api.delete(`/user/exercises/${exerciseId}/comments/${commentId}`);
      setComments((prev) => {
        const commentIndex = prev.findIndex((c) => c._id === commentId);
        if (commentIndex !== -1) {
          return prev.filter((c) => c._id !== commentId);
        }
        return prev.map((comment) => ({
          ...comment,
          replies: comment.replies.filter((r) => r._id !== commentId),
        }));
      });
      toast.success('Đã xóa comment thành công');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xóa comment';
      toast.error(message);
    }
  };

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header với nút đóng */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900">{exercise.name}</h3>
            {exercise.difficulty && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded capitalize">
                {exercise.difficulty === 'basic' ? 'Cơ bản' : exercise.difficulty === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        {/* Content area: Video bên trái, Comments bên phải */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row gap-4 p-4">
            {/* Left side: Video và thông tin */}
            <div className="flex-1 lg:max-w-[65%] space-y-4">
              {/* Video */}
              {exercise.videoUrl && getYouTubeEmbedUrl(exercise.videoUrl) ? (
                <div>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    {date !== null && exerciseIndex !== null ? (
                      <div
                        id={`youtube-player-${exercise._id}`}
                        className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
                      />
                    ) : (
                      <iframe
                        src={getYouTubeEmbedUrl(exercise.videoUrl) || ''}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
                      />
                    )}
                  </div>
                  {date !== null && exerciseIndex !== null && (
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      💡 Bài tập sẽ tự động được đánh dấu hoàn thành khi bạn xem được 80% thời lượng video
                    </div>
                  )}
                  <a 
                    href={exercise.videoUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-primary-600 hover:underline inline-flex items-center gap-2 mt-2 text-sm"
                  >
                    Xem trên YouTube →
                  </a>
                </div>
              ) : exercise.videoUrl ? (
                <div>
                  <a 
                    href={exercise.videoUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-primary-600 hover:underline inline-flex items-center gap-2"
                  >
                    Xem video trên YouTube →
                  </a>
                </div>
              ) : null}

              {/* Description */}
              {exercise.description && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mô tả</h4>
                  <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exercise.description }} />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Thời gian</div>
                  <div className="text-lg font-semibold">{exercise.durationMinutes} phút</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Calo tiêu thụ</div>
                  <div className="text-lg font-semibold">{exercise.caloriesBurned} cal</div>
                </div>
              </div>
            </div>

            {/* Right side: Comments */}
            <div className="flex-1 lg:max-w-[35%] border-l lg:pl-4 lg:border-l-2 lg:border-gray-200">
              <div className="sticky top-0 bg-white pb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Bình luận ({comments.length})
                </h4>

                {/* Comment Form */}
                <div className="mb-4">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleSubmitComment(exercise._id)}
                      disabled={!commentContent.trim()}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {loadingComments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">Chưa có bình luận nào</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs flex-shrink-0">
                          {comment.userId.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{comment.userId.name}</span>
                            <span className="text-xs text-gray-500">{formatCommentDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2 whitespace-pre-wrap text-sm break-words">{comment.content}</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                              className="text-xs text-gray-600 hover:text-primary-600 flex items-center gap-1"
                            >
                              <Reply className="h-3 w-3" />
                              Phản hồi
                            </button>
                            {user && (user._id === comment.userId._id || user.role === 'admin') && (
                              <button
                                onClick={() => handleDeleteComment(exercise._id, comment._id)}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Xóa
                              </button>
                            )}
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment._id && (
                            <div className="mt-2 ml-2 border-l-2 border-gray-200 pl-3">
                              <textarea
                                value={replyContent[comment._id] || ''}
                                onChange={(e) =>
                                  setReplyContent((prev) => ({
                                    ...prev,
                                    [comment._id]: e.target.value,
                                  }))
                                }
                                placeholder="Viết phản hồi..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-xs"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2 mt-1.5">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent((prev) => {
                                      const newContent = { ...prev };
                                      delete newContent[comment._id];
                                      return newContent;
                                    });
                                  }}
                                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(exercise._id, comment._id)}
                                  disabled={!replyContent[comment._id]?.trim()}
                                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Gửi
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 ml-2 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply._id} className="border-l-2 border-gray-200 pl-3">
                                  <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                                      {reply.userId.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-semibold text-gray-900 text-xs">{reply.userId.name}</span>
                                        <span className="text-xs text-gray-500">{formatCommentDate(reply.createdAt)}</span>
                                      </div>
                                      <p className="text-gray-700 text-xs whitespace-pre-wrap break-words">{reply.content}</p>
                                      {user && (user._id === reply.userId._id || user.role === 'admin') && (
                                        <button
                                          onClick={() => handleDeleteComment(exercise._id, reply._id)}
                                          className="text-xs text-red-600 hover:text-red-700 mt-0.5"
                                        >
                                          Xóa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;

