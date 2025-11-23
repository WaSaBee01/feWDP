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
          console.error('Error deleting player:', err);
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
      toast.error('Vui lòng nhập nội dung comment video');
      return;
    }
    try {
      const res = await api.post(`/user/exercises/${exerciseId}/comments`, {
        content: commentContent.trim(),
      });
      setComments((prev) => [...prev, res.data.data]);
      setCommentContent('');
      toast.success('Thêm comment thành công');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể thêm comment';
      toast.error(message);
    }
  };

  