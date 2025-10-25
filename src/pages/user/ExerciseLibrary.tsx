import type { DraftHandleValue } from 'draft-js';
import { ContentState, convertFromHTML, convertToRaw, Editor, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';
import draftToHtml from 'draftjs-to-html';
import { Edit2, MessageCircle, Plus, Reply, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface ExerciseItem {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  caloriesBurned: number;
  videoUrl?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  isCommon: boolean;
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

const ExerciseLibrary = () => {
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterIsCommon, setFilterIsCommon] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExerciseItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ExerciseItem | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(() => EditorState.createEmpty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    // Trích xuất ID video từ nhiều định dạng URL YouTube
    // Hỗ trợ URL có tham số truy vấn như &list=, &start_radio=, v.v.
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*[&?]v=([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Chỉ lấy video ID, bỏ qua các query parameters khác
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    return null;
  };

  const handleKeyCommand = (command: string, state: EditorState): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const onTab = (e: React.KeyboardEvent) => {
    setEditorState(RichUtils.onTab(e, editorState, 4));
  };

  const toggleInline = (style: 'BOLD' | 'ITALIC' | 'UNDERLINE' | 'CODE') => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlock = (
    type: 'header-one' | 'header-two' | 'unordered-list-item' | 'ordered-list-item' | 'blockquote' | 'code-block'
  ) => {
    setEditorState(RichUtils.toggleBlockType(editorState, type));
  };

  const applyLink = () => {
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) return;
    const url = prompt('Nhập URL:');
    if (!url) return;
    const content = editorState.getCurrentContent();
    const contentWithEntity = content.createEntity('LINK', 'MUTABLE', { url });
    const entityKey = contentWithEntity.getLastCreatedEntityKey();
    const newState = EditorState.push(editorState, contentWithEntity, 'apply-entity');
    setEditorState(RichUtils.toggleLink(newState, newState.getSelection(), entityKey));
  };

  const removeLink = () => {
    const selection = editorState.getSelection();
    setEditorState(RichUtils.toggleLink(editorState, selection, null));
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: '',
    caloriesBurned: '',
    videoUrl: '',
    difficulty: 'basic' as 'basic' | 'intermediate' | 'advanced',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterIsCommon !== 'all') params.isCommon = filterIsCommon;
      const res = await api.get('/user/exercises', { params });
      setItems(res.data.data);
    } catch {
      toast.error('Danh sách bài tập không tải được');
    } finally {
      setLoading(false);
    }
  }, [search, filterIsCommon]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrors({});
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên bài tập';
      const hasText = editorState.getCurrentContent().hasText();
      if (!hasText) newErrors.description = 'Vui lòng nhập mô tả';
      const duration = Number(formData.durationMinutes);
      const calories = Number(formData.caloriesBurned);
      if (Number.isNaN(duration) || duration <= 0) newErrors.durationMinutes = 'Thời gian phải > 0';
      if (Number.isNaN(calories) || calories < 0) newErrors.caloriesBurned = 'Calo không hợp lệ';
      const youtube = formData.videoUrl.trim();
      if (youtube) {
        // Cho phép các query parameters sau video ID (như &list=, &start_radio=, etc.)
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/i;
        if (!ytRegex.test(youtube)) newErrors.videoUrl = 'Link YouTube không hợp lệ';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setSubmitting(true);
      const descriptionVal = editorState ? draftToHtml(convertToRaw(editorState.getCurrentContent())) : formData.description;
      const payload = {
        name: formData.name,
        description: descriptionVal,
        durationMinutes: Number(formData.durationMinutes),
        caloriesBurned: Number(formData.caloriesBurned),
        videoUrl: formData.videoUrl,
        difficulty: formData.difficulty,
      };
      if (editing) {
        await api.put(`/user/exercises/${editing._id}`, payload);
        toast.success('Cập nhật bài tập thành công');
      } else {
        await api.post('/user/exercises', payload);
        toast.success('Tạo bài tập thành công');
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err as { message?: string }).message ||
        'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ex: ExerciseItem) => {
    if (ex.isCommon) {
      toast.error('Bài tập chung không thể chỉnh sửa');
      return;
    }
    setEditing(ex);
    setFormData({
      name: ex.name,
      description: ex.description || '',
      durationMinutes: String(ex.durationMinutes),
      caloriesBurned: String(ex.caloriesBurned),
      videoUrl: ex.videoUrl || '',
      difficulty: ex.difficulty,
    });
    if (ex.description) {
      const blocks = convertFromHTML(ex.description);
      const content = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
      setEditorState(EditorState.createWithContent(content));
    } else {
      setEditorState(EditorState.createEmpty());
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string, isCommon: boolean) => {
    if (isCommon) {
      toast.error('Bài tập chung không thể xóa');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;
    try {
      await api.delete(`/user/exercises/${id}`);
      toast.success('Xóa bài tập thành công');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xóa bài tập';
      toast.error(message);
    }
  };

  const loadComments = useCallback(async (exerciseId: string) => {
    try {
      setLoadingComments(true);
      const res = await api.get(`/user/exercises/${exerciseId}/comments`);
      setComments(res.data.data || []);
    } catch (err: unknown) {
      console.error('Lỗi tải bình luận:', err);
      // Không hiển thị thông báo lỗi, chỉ cần đặt mảng trống
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const handleSubmitComment = async (exerciseId: string) => {
    if (!commentContent.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }
    try {
      const res = await api.post(`/user/exercises/${exerciseId}/comments`, {
        content: commentContent.trim(),
      });
      setComments((prev) => [...prev, res.data.data]);
      setCommentContent('');
      toast.success('Đã thêm bình luận thành công');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể thêm comment';
      toast.error(message);
    }
  };

  const handleSubmitReply = async (exerciseId: string, parentCommentId: string) => {
    const replyText = replyContent[parentCommentId];
    if (!replyText || !replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi:');
      return;
    }
    try {
      const res = await api.post(`/user/exercises/${exerciseId}/comments`, {
        content: replyText.trim(),
        parentCommentId,
      });
      // Cập nhật bình luận để thêm trả lời cho bình luận gốc
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
      toast.success('Đã thêm phản hồi thành công!');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể thêm phản hồi';
      toast.error(message);
    }
  };

  const handleDeleteComment = async (exerciseId: string, commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa comment này?')) return;
    try {
      await api.delete(`/user/exercises/${exerciseId}/comments/${commentId}`);
      // Xóa bình luận hoặc trả lời khỏi trạng thái
      setComments((prev) => {
        // Kiểm tra xem đó có phải là bình luận cấp cao nhất không
        const commentIndex = prev.findIndex((c) => c._id === commentId);
        if (commentIndex !== -1) {
          // Đây là bình luận cấp cao nhất, hãy xóa nó đi
          return prev.filter((c) => c._id !== commentId);
        }
        // Đây là một câu trả lời, hãy xóa nó khỏi bình luận gốc
        return prev.map((comment) => ({
          ...comment,
          replies: comment.replies.filter((r) => r._id !== commentId),
        }));
      });
      toast.success('Đã xóa comment thành công!');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xóa comment';
      toast.error(message);
    }
  };

  const formatDate = (dateString: string) => {
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      durationMinutes: '',
      caloriesBurned: '',
      videoUrl: '',
      difficulty: 'basic',
    });
    setEditorState(EditorState.createEmpty());
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Thư viện bài tập</h2>
        <p className="text-gray-600">Bài tập dùng chung và bài tập bạn đã tạo</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Tìm kiếm bài tập..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterIsCommon}
            onChange={(e) => setFilterIsCommon(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Tất cả</option>
            <option value="true">Dùng chung</option>
            <option value="false">Của tôi</option>
          </select>
          <button onClick={load} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
            Tìm kiếm
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            Thêm bài tập
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">{editing ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài tập *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <div className="bg-white border border-gray-300 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleInline('BOLD')}>
                        B
                      </button>
                      <button type="button" className="px-2 py-1 border rounded italic" onClick={() => toggleInline('ITALIC')}>
                        I
                      </button>
                      <button type="button" className="px-2 py-1 border rounded underline" onClick={() => toggleInline('UNDERLINE')}>
                        U
                      </button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('header-one')}>
                        H1
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('header-two')}>
                        H2
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('unordered-list-item')}>
                        • List
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('ordered-list-item')}>
                        1. List
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('blockquote')}>
                        &gt;
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleInline('CODE')}>
                        {`</>`}
                      </button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button type="button" className="px-2 py-1 border rounded" onClick={applyLink}>
                        Link
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={removeLink}>
                        Unlink
                      </button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => setEditorState(EditorState.undo(editorState))}>
                        Undo
                      </button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => setEditorState(EditorState.redo(editorState))}>
                        Redo
                      </button>
                    </div>
                    <div className="min-h-[200px] px-3 py-2 border rounded">
                      <Editor
                        editorState={editorState}
                        onChange={(st) => setEditorState(st)}
                        handleKeyCommand={(cmd) => handleKeyCommand(cmd, editorState)}
                        placeholder="Nhập mô tả..."
                        onTab={onTab}
                      />
                    </div>
                  </div>
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút) *</label>
                    <input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                    {errors.durationMinutes && <p className="mt-1 text-sm text-red-600">{errors.durationMinutes}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calo tiêu thụ *</label>
                    <input
                      type="number"
                      value={formData.caloriesBurned}
                      onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min="0"
                    />
                    {errors.caloriesBurned && <p className="mt-1 text-sm text-red-600">{errors.caloriesBurned}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video hướng dẫn</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {errors.videoUrl && <p className="mt-1 text-sm text-red-600">{errors.videoUrl}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'basic' | 'intermediate' | 'advanced' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
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
          <p className="text-gray-600">Chưa có bài tập</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((ex) => (
            <div 
              key={ex._id} 
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all ${ex.isCommon ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (ex.isCommon) {
                  setViewingItem(ex);
                  loadComments(ex._id);
                }
              }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{ex.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">{ex.difficulty}</span>
                    {ex.isCommon && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Dùng chung</span>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{stripHtml(ex.description || '')}</p>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-gray-600">Thời gian:</span> <span className="font-medium">{ex.durationMinutes} phút</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Calo:</span> <span className="font-medium">{ex.caloriesBurned}</span>
                  </div>
                </div>
                {ex.videoUrl && (
                  <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-primary-600 text-sm hover:underline" onClick={(e) => e.stopPropagation()}>
                    Xem video hướng dẫn
                  </a>
                )}
                {!ex.isCommon && (
                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(ex)} className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm flex items-center justify-center gap-1">
                      <Edit2 className="h-4 w-4" />
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(ex._id, ex.isCommon)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header với nút đóng */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-2xl font-bold text-gray-900">{viewingItem.name}</h3>
              <button
                onClick={() => {
                  setViewingItem(null);
                  setComments([]);
                  setCommentContent('');
                  setReplyingTo(null);
                  setReplyContent({});
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content area: Video bên trái, Comments bên phải */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row gap-4 p-4">
                {/* Left side: Video và thông tin */}
                <div className="flex-1 lg:max-w-[65%] space-y-4">
                  {/* Video */}
                  {viewingItem.videoUrl && getYouTubeEmbedUrl(viewingItem.videoUrl) ? (
                    <div>
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={getYouTubeEmbedUrl(viewingItem.videoUrl) || ''}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
                        />
                      </div>
                      <a 
                        href={viewingItem.videoUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-primary-600 hover:underline inline-flex items-center gap-2 mt-2 text-sm"
                      >
                        Xem video →
                      </a>
                    </div>
                  ) : viewingItem.videoUrl ? (
                    <div>
                      <a 
                        href={viewingItem.videoUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-primary-600 hover:underline inline-flex items-center gap-2"
                      >
                        Xem video  →
                      </a>
                    </div>
                  ) : null}

                  {/* Title và badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">{viewingItem.difficulty}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Dùng chung</span>
                  </div>

                  {/* Description */}
                  {viewingItem.description && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Mô tả</h4>
                      <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: viewingItem.description }} />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Thời gian</div>
                      <div className="text-lg font-semibold">{viewingItem.durationMinutes} phút</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Calo tiêu thụ</div>
                      <div className="text-lg font-semibold">{viewingItem.caloriesBurned} cal</div>
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
                          onClick={() => handleSubmitComment(viewingItem._id)}
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
                                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
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
                                    onClick={() => handleDeleteComment(viewingItem._id, comment._id)}
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
                                      onClick={() => handleSubmitReply(viewingItem._id, comment._id)}
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
                                            <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                          </div>
                                          <p className="text-gray-700 text-xs whitespace-pre-wrap break-words">{reply.content}</p>
                                          {user && (user._id === reply.userId._id || user.role === 'admin') && (
                                            <button
                                              onClick={() => handleDeleteComment(viewingItem._id, reply._id)}
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
      )}
    </div>
  );
};

export default ExerciseLibrary;
