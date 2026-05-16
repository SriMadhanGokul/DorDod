import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  FaHeart, FaComment, FaPlus, FaTimes, FaTrash, FaPaperPlane,
  FaImage, FaVideo, FaLink, FaEdit, FaEllipsisV, FaCheck, FaFilePdf,
} from 'react-icons/fa';

interface Comment {
  _id: string; author: string; avatar: string; content: string;
  time: string; userId: string; isOwner: boolean; isPostOwner: boolean; edited: boolean;
}
interface Post {
  _id: string; author: string; avatar: string; userId: string; isOwner: boolean;
  content: string; tags: string[]; likes: number; liked: boolean;
  comments: Comment[]; time: string;
  mediaType: 'none'|'image'|'video'|'link'|'file';
  mediaUrl: string; mediaFileName: string;
  linkPreview?: { title: string; description: string; url: string };
}

const TAGS = ['General','Achievement','Question','Resource','Motivation','Career','Learning'];
const BASE  = import.meta.env.VITE_API_URL || '';

const fmtTime = (t: string) => {
  const diff = Date.now() - new Date(t).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const Avatar = ({ name, avatar, size = 'w-10 h-10' }: { name: string; avatar?: string; size?: string }) =>
  avatar
    ? <img src={avatar} className={`${size} rounded-full object-cover shrink-0`} alt=""/>
    : <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 text-sm`}>
        {name?.charAt(0)?.toUpperCase() || 'U'}
      </div>;

export default function Networkpage() {
  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterTag, setFilterTag]     = useState('All');

  // Create post modal
  const [showModal, setShowModal]     = useState(false);
  const [posting, setPosting]         = useState(false);
  const [content, setContent]         = useState('');
  const [tag, setTag]                 = useState('General');
  const [mediaFile, setMediaFile]     = useState<File | null>(null);
  const [mediaType, setMediaType]     = useState<'image'|'video'|'pdf'|null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [linkUrl, setLinkUrl]         = useState('');
  const [showLinkInput, setShowLink]  = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  // Edit post modal
  const [editPostData, setEditPostData]   = useState<Post | null>(null);
  const [editContent, setEditContent]     = useState('');
  const [editTag, setEditTag]             = useState('General');
  const [savingEditPost, setSavingEditPost] = useState(false);

  // Comments
  const [expanded, setExpanded]           = useState<string | null>(null);
  const [commentTexts, setCommentTexts]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting]       = useState<string | null>(null);
  const [openMenu, setOpenMenu]           = useState<string | null>(null);

  // Edit comment
  const [editCId, setEditCId]             = useState<{ postId: string; commentId: string } | null>(null);
  const [editCText, setEditCText]         = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => { load(); }, [filterTag]);

  const load = async () => {
    setLoading(true);
    try {
      const url = filterTag !== 'All' ? `/community?tag=${filterTag}` : '/community';
      const res = await api.get(url);
      setPosts(res.data.data || []);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  };

  // ── FILE SELECTION ──────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'image'|'video'|'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('Max file size is 20MB'); e.target.value = ''; return; }
    setMediaFile(file);
    setMediaType(type);
    setShowLink(false);
    setLinkUrl('');
    if (type !== 'pdf') setMediaPreview(URL.createObjectURL(file));
    else setMediaPreview('');
  };

  const clearMedia = () => {
    setMediaFile(null); setMediaType(null); setMediaPreview('');
    setLinkUrl(''); setShowLink(false);
    [imageRef, videoRef, pdfRef].forEach(r => { if (r.current) r.current.value = ''; });
  };

  // ── CREATE POST ─────────────────────────────────────────────────────────────
  const doPost = async () => {
    if (!content.trim() && !mediaFile && !linkUrl.trim())
      return toast.error('Write something, upload a file, or add a link');
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('tags',    tag || 'General');
      if (mediaFile)        fd.append('media',    mediaFile);
      else if (linkUrl.trim()) fd.append('mediaUrl', linkUrl.trim());

      const res = await api.post('/community', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPosts(p => [res.data.data, ...p]);
      setContent(''); setTag('General'); clearMedia(); setShowModal(false);
      toast.success('Post shared! 🎉');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to post');
    } finally { setPosting(false); }
  };

  // ── EDIT POST ───────────────────────────────────────────────────────────────
  const openEditPost = (post: Post) => {
    setEditPostData(post);
    setEditContent(post.content);
    setEditTag(post.tags?.[0] || 'General');
    setOpenMenu(null);
  };

  const doEditPost = async () => {
    if (!editPostData) return;
    setSavingEditPost(true);
    try {
      const res = await api.put(`/community/${editPostData._id}`, {
        content: editContent,
        tags:    editTag,
      });
      setPosts(p => p.map(post => post._id === editPostData._id ? { ...post, ...res.data.data } : post));
      setEditPostData(null);
      toast.success('Post updated!');
    } catch { toast.error('Failed to update post'); }
    finally { setSavingEditPost(false); }
  };

  // ── DELETE POST ─────────────────────────────────────────────────────────────
  const doDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/community/${id}`);
      setPosts(p => p.filter(post => post._id !== id));
      toast.success('Post deleted!');
    } catch { toast.error('Failed to delete'); }
  };

  // ── LIKE ────────────────────────────────────────────────────────────────────
  const toggleLike = async (id: string) => {
    try {
      const res = await api.patch(`/community/${id}/like`);
      setPosts(p => p.map(post => post._id === id
        ? { ...post, likes: res.data.data.likes, liked: res.data.data.liked }
        : post
      ));
    } catch { toast.error('Failed'); }
  };

  // ── COMMENT ─────────────────────────────────────────────────────────────────
  const addComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    setSubmitting(postId);
    try {
      const res = await api.post(`/community/${postId}/comments`, { content: text });
      setPosts(p => p.map(post => post._id === postId
        ? { ...post, comments: [...post.comments, res.data.data] }
        : post
      ));
      setCommentTexts(t => ({ ...t, [postId]: '' }));
    } catch { toast.error('Failed to comment'); }
    finally { setSubmitting(null); }
  };

  const startEditComment = (postId: string, comment: Comment) => {
    setEditCId({ postId, commentId: comment._id });
    setEditCText(comment.content);
    setExpanded(postId);
  };

  const saveEditComment = async () => {
    if (!editCId || !editCText.trim()) return;
    setSavingComment(true);
    try {
      const res = await api.put(
        `/community/${editCId.postId}/comments/${editCId.commentId}`,
        { content: editCText }
      );
      setPosts(p => p.map(post =>
        post._id === editCId.postId
          ? { ...post, comments: post.comments.map(c =>
              c._id === editCId.commentId
                ? { ...c, content: res.data.data.content, edited: true }
                : c
            )}
          : post
      ));
      setEditCId(null); setEditCText('');
      toast.success('Comment updated!');
    } catch { toast.error('Failed to edit comment'); }
    finally { setSavingComment(false); }
  };

  const delComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/community/${postId}/comments/${commentId}`);
      setPosts(p => p.map(post =>
        post._id === postId
          ? { ...post, comments: post.comments.filter(c => c._id !== commentId) }
          : post
      ));
      toast.success('Comment deleted!');
    } catch { toast.error('Failed'); }
  };

  // ── MEDIA DISPLAY ───────────────────────────────────────────────────────────
  const MediaDisplay = ({ post }: { post: Post }) => {
    if (!post.mediaUrl) return null;
    const src = post.mediaUrl.startsWith('/uploads') ? `${BASE}${post.mediaUrl}` : post.mediaUrl;
    if (post.mediaType === 'image') return (
      <img src={src} alt="Post" onClick={() => window.open(src, '_blank')}
        className="w-full max-h-96 object-cover rounded-xl mt-3 cursor-pointer hover:opacity-95 transition-opacity"/>
    );
    if (post.mediaType === 'video') return (
      <video src={src} controls className="w-full max-h-80 rounded-xl mt-3"/>
    );
    if (post.mediaType === 'file') return (
      <a href={src} target="_blank" rel="noopener noreferrer"
        className="mt-3 flex items-center gap-3 p-4 bg-red-50 border-2 border-red-100 rounded-xl hover:bg-red-100 transition-all">
        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
          <FaFilePdf className="text-white text-lg"/>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{post.mediaFileName}</p>
          <p className="text-xs text-red-500">PDF • Click to open</p>
        </div>
      </a>
    );
    if (post.mediaType === 'link') return (
      <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer"
        className="mt-3 flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
        <FaLink className="text-indigo-500 mt-1 shrink-0 w-4 h-4"/>
        <div className="min-w-0">
          {post.linkPreview?.title && <p className="font-semibold text-sm line-clamp-1">{post.linkPreview.title}</p>}
          <p className="text-xs text-indigo-500 truncate">{post.mediaUrl}</p>
        </div>
      </a>
    );
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto" onClick={() => setOpenMenu(null)}>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network</h1>
            <p className="text-sm text-gray-500 mt-0.5">Share and learn with your community</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2">
            <FaPlus className="w-3 h-3"/> New Post
          </button>
        </div>

        {/* Tag filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...TAGS].map(t => (
            <button key={t} onClick={() => setFilterTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterTag === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-lg font-semibold text-gray-700">No posts yet</p>
            <button onClick={() => setShowModal(true)} className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Create First Post
            </button>
          </div>
        )}

        {/* Posts list */}
        {posts.map(post => (
          <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            {/* Post header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={post.author} avatar={post.avatar}/>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{post.author}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{fmtTime(post.time)}</p>
                    {post.tags?.map(t => (
                      <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ⋯ menu — only if isOwner (comes from backend, 100% reliable) */}
              {post.isOwner && (
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenu(openMenu === post._id ? null : post._id)}
                    className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all">
                    <FaEllipsisV className="w-4 h-4"/>
                  </button>
                  {openMenu === post._id && (
                    <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-30 w-36 overflow-hidden">
                      <button onClick={() => openEditPost(post)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 flex items-center gap-2 text-gray-700 font-medium">
                        <FaEdit className="w-3.5 h-3.5 text-indigo-500"/> Edit Post
                      </button>
                      <button onClick={() => { doDelete(post._id); setOpenMenu(null); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 flex items-center gap-2 text-red-500 font-medium">
                        <FaTrash className="w-3.5 h-3.5"/> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {post.content && (
              <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap mb-1">{post.content}</p>
            )}
            <MediaDisplay post={post}/>

            {/* Like + Comment actions */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => toggleLike(post._id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-all ${post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                <FaHeart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`}/> {post.likes}
              </button>
              <button onClick={() => setExpanded(expanded === post._id ? null : post._id)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-all">
                <FaComment className="w-4 h-4"/> {post.comments?.length || 0} Comments
              </button>
            </div>

            {/* Comments */}
            {expanded === post._id && (
              <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                {post.comments?.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
                )}

                {post.comments?.map(c => (
                  <div key={c._id} className="flex items-start gap-2.5">
                    <Avatar name={c.author} avatar={c.avatar} size="w-8 h-8"/>
                    <div className="flex-1 min-w-0 bg-gray-50 rounded-xl p-3">
                      {editCId?.commentId === c._id ? (
                        /* Edit comment inline */
                        <div className="space-y-2">
                          <textarea value={editCText} onChange={e => setEditCText(e.target.value)} rows={2} autoFocus
                            className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none focus:ring-2 focus:ring-indigo-200"/>
                          <div className="flex gap-2">
                            <button onClick={saveEditComment} disabled={savingComment}
                              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 disabled:opacity-50">
                              <FaCheck className="w-2.5 h-2.5"/> {savingComment ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => { setEditCId(null); setEditCText(''); }}
                              className="border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <p className="text-xs font-bold text-gray-800">{c.author}</p>
                              {c.edited && <span className="text-xs text-gray-400 italic">(edited)</span>}
                            </div>
                            {/* Edit / Delete — use isOwner from backend, 100% reliable */}
                            <div className="flex items-center gap-1 shrink-0">
                              {c.isOwner && (
                                <button onClick={() => startEditComment(post._id, c)}
                                  className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-600 hover:bg-indigo-200 px-2 py-1 rounded-lg font-medium transition-all">
                                  <FaEdit className="w-2.5 h-2.5"/> Edit
                                </button>
                              )}
                              {(c.isOwner || c.isPostOwner) && (
                                <button onClick={() => delComment(post._id, c._id)}
                                  className="flex items-center gap-1 text-xs bg-red-100 text-red-500 hover:bg-red-200 px-2 py-1 rounded-lg font-medium transition-all">
                                  <FaTrash className="w-2.5 h-2.5"/>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 mt-1 leading-relaxed">{c.content}</p>
                          <p className="text-xs text-gray-400 mt-1">{fmtTime(c.time)}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add comment */}
                <div className="flex gap-2 pt-1">
                  <input
                    placeholder="Write a comment..."
                    value={commentTexts[post._id] || ''}
                    onChange={e => setCommentTexts(t => ({ ...t, [post._id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(post._id); } }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button onClick={() => addComment(post._id)}
                    disabled={submitting === post._id || !commentTexts[post._id]?.trim()}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                    <FaPaperPlane className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ─── CREATE POST MODAL ────────────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-gray-900">Create Post</h2>
                <button onClick={() => { setShowModal(false); clearMedia(); setContent(''); setTag('General'); setShowLink(false); }}
                  className="text-gray-400 hover:text-gray-600 p-1"><FaTimes className="w-5 h-5"/></button>
              </div>

              {/* Text */}
              <textarea placeholder="Share your thoughts, achievements, or ask for help..."
                value={content} onChange={e => setContent(e.target.value)} rows={4} autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"/>

              {/* Tag */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Tag <span className="text-red-400">*</span>
                </label>
                <select value={tag} onChange={e => setTag(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="">Please select a tag</option>
                  {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Media Upload Buttons — always visible */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attach Media (optional)</p>
                <div className="grid grid-cols-4 gap-2">
                  <button type="button" onClick={() => { clearMedia(); imageRef.current?.click(); }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${mediaType === 'image' ? 'border-green-500 bg-green-50 text-green-700' : 'border-dashed border-gray-300 text-gray-500 hover:border-green-400 hover:bg-green-50'}`}>
                    <FaImage className="w-5 h-5"/>
                    Image
                  </button>
                  <button type="button" onClick={() => { clearMedia(); videoRef.current?.click(); }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${mediaType === 'video' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <FaVideo className="w-5 h-5"/>
                    Video
                  </button>
                  <button type="button" onClick={() => { clearMedia(); pdfRef.current?.click(); }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${mediaType === 'pdf' ? 'border-red-500 bg-red-50 text-red-700' : 'border-dashed border-gray-300 text-gray-500 hover:border-red-400 hover:bg-red-50'}`}>
                    <FaFilePdf className="w-5 h-5"/>
                    PDF
                  </button>
                  <button type="button" onClick={() => { clearMedia(); setShowLink(p => !p); }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${showLinkInput ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                    <FaLink className="w-5 h-5"/>
                    Link
                  </button>
                </div>

                {/* Hidden file inputs */}
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')}/>
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e, 'video')}/>
                <input ref={pdfRef}   type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => handleFile(e, 'pdf')}/>
              </div>

              {/* Link input */}
              {showLinkInput && (
                <input placeholder="Paste URL here..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
              )}

              {/* File preview */}
              {mediaFile && mediaType === 'image' && mediaPreview && (
                <div className="relative mb-3">
                  <img src={mediaPreview} className="w-full max-h-48 object-cover rounded-xl" alt="Preview"/>
                  <button onClick={clearMedia} className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500">
                    <FaTimes className="w-3 h-3"/>
                  </button>
                </div>
              )}
              {mediaFile && mediaType === 'video' && mediaPreview && (
                <div className="relative mb-3">
                  <video src={mediaPreview} controls className="w-full max-h-48 rounded-xl"/>
                  <button onClick={clearMedia} className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500">
                    <FaTimes className="w-3 h-3"/>
                  </button>
                </div>
              )}
              {mediaFile && mediaType === 'pdf' && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-100 rounded-xl mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <FaFilePdf className="text-white text-lg"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{mediaFile.name}</p>
                    <p className="text-xs text-gray-400">{(mediaFile.size/1024/1024).toFixed(1)} MB • PDF</p>
                  </div>
                  <button onClick={clearMedia} className="text-red-400 hover:text-red-600 p-1"><FaTimes className="w-3.5 h-3.5"/></button>
                </div>
              )}

              <p className="text-xs text-gray-400 mb-3">Max file size: 20MB</p>

              <button onClick={doPost} disabled={posting || (!content.trim() && !mediaFile && !linkUrl.trim())}
                className="bg-indigo-600 text-white w-full py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {posting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Sharing...</>
                  : <><FaPaperPlane className="w-3.5 h-3.5"/> Share Post</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ─── EDIT POST MODAL ──────────────────────────────────────────── */}
        {editPostData && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <FaEdit className="text-indigo-500"/> Edit Post
                </h2>
                <button onClick={() => setEditPostData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <FaTimes className="w-5 h-5"/>
                </button>
              </div>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" autoFocus/>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tag</label>
                <select value={editTag} onChange={e => setEditTag(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
                  <option value="">Please select a tag</option>
                  {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={doEditPost} disabled={savingEditPost}
                className="bg-indigo-600 text-white w-full py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {savingEditPost ? 'Saving...' : <><FaCheck className="w-3 h-3"/> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}