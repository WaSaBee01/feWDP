import type { DraftHandleValue } from 'draft-js';
import { ContentState, convertFromHTML, convertToRaw, Editor, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';
import draftToHtml from 'draftjs-to-html';
import { Eye, MessageCircle, Plus, Reply, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
  difficulty: 'basic' | 'intermediate' | 'advanced';
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

const ExerciseManagement = () => {
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [search, setSearch] = useState('');
  const [editorState, setEditorState] = useState<EditorState>(() => EditorState.createEmpty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [viewingItem, setViewingItem] = useState<Exercise | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
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
    type:
      | 'header-one'
      | 'header-two'
      | 'unordered-list-item'
      | 'ordered-list-item'
      | 'blockquote'
      | 'code-block'
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
      const params: Record<string, string> = { isCommon: 'true' };
      if (search) params.search = search;
      const res = await api.get('/admin/exercises', { params });
      setItems(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrors({});

      // Client validations
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
        // Cho phép query parameters sau video ID (như &list=, &start_radio=, etc.)
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
        await api.put(`/admin/exercises/${editing._id}`, payload);
        toast.success('Update successfully');
      } else {
        await api.post('/admin/exercises', payload);
        toast.success('Create successfully');
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

  const handleEdit = (ex: Exercise) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;
    try {
      await api.delete(`/admin/exercises/${id}`);
      toast.success('Delete Sucessfull');
      load();
    } catch {
      toast.error('Cannot Sucessfull');
    }
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

 
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <div className="bg-white border border-gray-300 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleInline('BOLD')}>B</button>
                      <button type="button" className="px-2 py-1 border rounded italic" onClick={() => toggleInline('ITALIC')}>I</button>
                      <button type="button" className="px-2 py-1 border rounded underline" onClick={() => toggleInline('UNDERLINE')}>U</button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('header-one')}>H1</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('header-two')}>H2</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('unordered-list-item')}>• List</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('ordered-list-item')}>1. List</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleBlock('blockquote')}>&gt;</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => toggleInline('CODE')}>{`</>`}</button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button type="button" className="px-2 py-1 border rounded" onClick={applyLink}>Link</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={removeLink}>Unlink</button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => setEditorState(EditorState.undo(editorState))}>Undo</button>
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => setEditorState(EditorState.redo(editorState))}>Redo</button>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video hướng dẫn (YouTube)</label>
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
          <p className="text-gray-600">Chưa có bài tập nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((ex) => (
            <div key={ex._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{ex.name}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">{ex.difficulty}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {stripHtml(ex.description || '')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Thời gian:</span> <span className="font-medium">{ex.durationMinutes} phút</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Calo:</span> <span className="font-medium">{ex.caloriesBurned}</span>
                  </div>
                </div>
                {ex.videoUrl && (
                  <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-primary-600 text-sm hover:underline">
                    Xem video hướng dẫn
                  </a>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setViewingItem(ex);
                      loadComments(ex._id);
                    }}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Xem
                  </button>
                  <button onClick={() => handleEdit(ex)} className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                    Chỉnh sửa
                  </button>
                  <button onClick={() => handleDelete(ex._id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog with Comments */}
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
                        Xem trên YouTube →
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
                        Xem video trên YouTube →
                      </a>
                    </div>
                  ) : null}

                  {/* Title và badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">{viewingItem.difficulty}</span>
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

export default ExerciseManagement;


