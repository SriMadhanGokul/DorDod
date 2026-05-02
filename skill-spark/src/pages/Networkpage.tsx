import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  FaHeart,
  FaComment,
  FaPlus,
  FaTimes,
  FaTrash,
  FaPaperPlane,
  FaImage,
  FaVideo,
  FaLink,
  FaEdit,
  FaEllipsisV,
  FaCheck,
} from "react-icons/fa";

interface Comment {
  _id: string;
  author: string;
  content: string;
  time: string;
  userId: string;
}
interface Post {
  _id: string;
  author: string;
  avatar: string;
  userId: string;
  content: string;
  tags: string[];
  likes: number;
  liked: boolean;
  comments: Comment[];
  time: string;
  mediaType: "none" | "image" | "video" | "link";
  mediaUrl: string;
  mediaFileName: string;
  linkPreview?: { title: string; description: string; url: string };
}

const TAGS = [
  "General",
  "Achievement",
  "Question",
  "Resource",
  "Motivation",
  "Career",
  "Learning",
];
const BASE = import.meta.env.VITE_API_URL || "https://dordod-1.onrender.com";

const fmtTime = (t: string) => {
  const diff = Date.now() - new Date(t).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const Avatar = ({
  name,
  avatar,
  size = "w-10 h-10",
}: {
  name: string;
  avatar?: string;
  size?: string;
}) =>
  avatar ? (
    <img
      src={avatar}
      className={`${size} rounded-full object-cover shrink-0`}
      alt=""
    />
  ) : (
    <div
      className={`${size} rounded-full gradient-hero flex items-center justify-center text-white font-bold shrink-0 text-sm`}
    >
      {name?.charAt(0).toUpperCase() || "U"}
    </div>
  );

export default function NetworkPage() {
  const { user } = useAuth();
  const myId = (user as any)?._id || (user as any)?.id || "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [filterTag, setFilterTag] = useState("All");

  // New post form
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("General");
  const [mediaMode, setMediaMode] = useState<
    "none" | "image" | "video" | "link"
  >("none");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit post
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTag, setEditTag] = useState("General");
  const [saving, setSaving] = useState(false);

  // Comments
  const [expandedComments, setExpanded] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [filterTag]);

  const load = async () => {
    setLoading(true);
    try {
      const url =
        filterTag !== "All" ? `/community?tag=${filterTag}` : "/community";
      const res = await api.get(url);
      setPosts(res.data.data || []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaMode(file.type.startsWith("image/") ? "image" : "video");
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview("");
    setLinkUrl("");
    setMediaMode("none");
    if (fileRef.current) fileRef.current.value = "";
  };

  const doPost = async () => {
    if (!content.trim() && !mediaFile && !linkUrl.trim())
      return toast.error("Write something, upload media, or add a link");
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("content", content);
      fd.append("tags", tag);
      if (mediaFile) {
        fd.append("media", mediaFile);
        fd.append("mediaType", mediaMode);
      } else if (linkUrl.trim()) {
        fd.append("mediaType", "link");
        fd.append("mediaUrl", linkUrl);
      }
      const res = await api.post("/community", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPosts((p) => [res.data.data, ...p]);
      setContent("");
      setTag("General");
      clearMedia();
      setShowModal(false);
      toast.success("Post shared! 🎉");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const doEdit = async () => {
    if (!editPost) return;
    setSaving(true);
    try {
      const res = await api.put(`/community/${editPost._id}`, {
        content: editContent,
        tags: editTag,
      });
      setPosts((p) =>
        p.map((post) => (post._id === editPost._id ? res.data.data : post)),
      );
      setEditPost(null);
      toast.success("Post updated!");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/community/${id}`);
      setPosts((p) => p.filter((post) => post._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleLike = async (id: string) => {
    try {
      const res = await api.patch(`/community/${id}/like`);
      setPosts((p) =>
        p.map((post) =>
          post._id === id
            ? {
                ...post,
                likes: res.data.data.likes,
                liked: res.data.data.liked,
              }
            : post,
        ),
      );
    } catch {
      toast.error("Failed");
    }
  };

  const addComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    try {
      const res = await api.post(`/community/${postId}/comments`, {
        content: text,
      });
      setPosts((p) =>
        p.map((post) =>
          post._id === postId
            ? { ...post, comments: [...post.comments, res.data.data] }
            : post,
        ),
      );
      setCommentTexts((t) => ({ ...t, [postId]: "" }));
    } catch {
      toast.error("Failed to comment");
    }
  };

  const delComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/community/${postId}/comments/${commentId}`);
      setPosts((p) =>
        p.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c._id !== commentId),
              }
            : post,
        ),
      );
      toast.success("Comment deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const MediaDisplay = ({ post }: { post: Post }) => {
    if (post.mediaType === "image" && post.mediaUrl) {
      const src = post.mediaUrl.startsWith("/uploads")
        ? `${BASE}${post.mediaUrl}`
        : post.mediaUrl;
      return (
        <img
          src={src}
          alt="Post media"
          className="w-full max-h-96 object-cover rounded-xl mt-3"
        />
      );
    }
    if (post.mediaType === "video" && post.mediaUrl) {
      const src = post.mediaUrl.startsWith("/uploads")
        ? `${BASE}${post.mediaUrl}`
        : post.mediaUrl;
      return (
        <video src={src} controls className="w-full max-h-80 rounded-xl mt-3" />
      );
    }
    if (post.mediaType === "link" && post.mediaUrl) {
      return (
        <a
          href={post.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-start gap-3 p-3 bg-muted border border-border rounded-xl hover:bg-accent transition-all"
        >
          <FaLink className="text-primary mt-1 shrink-0 w-4 h-4" />
          <div className="min-w-0">
            {post.linkPreview?.title && (
              <p className="font-semibold text-sm line-clamp-1">
                {post.linkPreview.title}
              </p>
            )}
            <p className="text-xs text-primary truncate">{post.mediaUrl}</p>
            {post.linkPreview?.description && (
              <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                {post.linkPreview.description}
              </p>
            )}
          </div>
        </a>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Network</h1>
            <p className="text-foreground-muted mt-1">
              Share and learn with your community
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> Post
          </button>
        </div>

        {/* Tag filter */}
        <div className="flex gap-2 flex-wrap">
          {["All", ...TAGS].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterTag === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground-muted hover:bg-accent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 text-foreground-muted card-elevated">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to share something!</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 mx-auto flex items-center gap-2"
            >
              <FaPlus /> Create Post
            </button>
          </div>
        )}

        {/* Posts */}
        {posts.map((post) => (
          <div key={post._id} className="card-elevated">
            {/* Post header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={post.author} avatar={post.avatar} />
                <div>
                  <p className="font-semibold text-sm">{post.author}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-foreground-muted">
                      {fmtTime(post.time)}
                    </p>
                    {post.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Options — only for post owner */}
              {post.userId === myId && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === post._id ? null : post._id)
                    }
                    className="text-foreground-muted hover:text-foreground p-1.5 hover:bg-muted rounded-lg transition-all"
                  >
                    <FaEllipsisV className="w-3.5 h-3.5" />
                  </button>
                  {openMenu === post._id && (
                    <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg z-10 w-32 overflow-hidden">
                      <button
                        onClick={() => {
                          setEditPost(post);
                          setEditContent(post.content);
                          setEditTag(post.tags?.[0] || "General");
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <FaEdit className="w-3 h-3 text-primary" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          doDelete(post._id);
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                      >
                        <FaTrash className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {post.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {/* Media */}
            <MediaDisplay post={post} />

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              <button
                onClick={() => toggleLike(post._id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-all ${post.liked ? "text-destructive" : "text-foreground-muted hover:text-destructive"}`}
              >
                <FaHeart
                  className={`w-3.5 h-3.5 ${post.liked ? "fill-current" : ""}`}
                />{" "}
                {post.likes}
              </button>
              <button
                onClick={() =>
                  setExpanded(expandedComments === post._id ? null : post._id)
                }
                className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-all"
              >
                <FaComment className="w-3.5 h-3.5" />{" "}
                {post.comments?.length || 0}
              </button>
            </div>

            {/* Comments */}
            {expandedComments === post._id && (
              <div className="mt-3 space-y-2">
                {post.comments?.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-start gap-2 bg-muted rounded-xl p-2.5"
                  >
                    <Avatar name={c.author} size="w-7 h-7" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold">{c.author}</p>
                        {(c.userId === myId || post.userId === myId) && (
                          <button
                            onClick={() => delComment(post._id, c._id)}
                            className="text-foreground-muted hover:text-destructive p-0.5 shrink-0"
                          >
                            <FaTrash className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Add comment */}
                <div className="flex gap-2 mt-2">
                  <input
                    placeholder="Write a comment..."
                    value={commentTexts[post._id] || ""}
                    onChange={(e) =>
                      setCommentTexts((t) => ({
                        ...t,
                        [post._id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && addComment(post._id)}
                    className="input-field text-xs flex-1 py-2"
                  />
                  <button
                    onClick={() => addComment(post._id)}
                    className="btn-primary text-xs px-3 py-2"
                  >
                    <FaPaperPlane className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── CREATE POST MODAL ───────────────────────────────────────────── */}
        {showModal && (
          <div
            className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto"
            onClick={() => setOpenMenu(null)}
          >
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">New Post</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    clearMedia();
                    setContent("");
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              <textarea
                placeholder="Share your thoughts, achievements, or ask for help..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full input-field min-h-[120px] resize-none mb-3"
              />

              {/* Tag select */}
              <div className="mb-3">
                <label className="text-xs font-medium text-foreground-muted">
                  Tag
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="">Please select a tag</option>
                  {TAGS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Media mode buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setMediaMode("image");
                    fileRef.current?.click();
                  }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${mediaMode === "image" ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground-muted hover:border-primary/40"}`}
                >
                  <FaImage className="w-3 h-3" /> Image
                </button>
                <button
                  onClick={() => {
                    setMediaMode("video");
                    fileRef.current?.click();
                  }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${mediaMode === "video" ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground-muted hover:border-primary/40"}`}
                >
                  <FaVideo className="w-3 h-3" /> Video
                </button>
                <button
                  onClick={() =>
                    setMediaMode(mediaMode === "link" ? "none" : "link")
                  }
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${mediaMode === "link" ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground-muted hover:border-primary/40"}`}
                >
                  <FaLink className="w-3 h-3" /> Link
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Link URL input */}
              {mediaMode === "link" && (
                <input
                  placeholder="Paste link URL here..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="input-field mb-3 text-sm"
                />
              )}

              {/* Media preview */}
              {mediaPreview && (
                <div className="relative mb-3">
                  {mediaMode === "image" ? (
                    <img
                      src={mediaPreview}
                      className="w-full max-h-48 object-cover rounded-xl"
                      alt="Preview"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-48 rounded-xl"
                    />
                  )}
                  <button
                    onClick={clearMedia}
                    className="absolute top-2 right-2 w-7 h-7 bg-foreground/70 text-white rounded-full flex items-center justify-center hover:bg-destructive transition-all"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={doPost}
                disabled={
                  posting || (!content.trim() && !mediaFile && !linkUrl.trim())
                }
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {posting ? (
                  "Sharing..."
                ) : (
                  <>
                    <FaPaperPlane className="w-3 h-3" /> Share
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── EDIT POST MODAL ─────────────────────────────────────────────── */}
        {editPost && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FaEdit className="text-primary" /> Edit Post
                </h2>
                <button onClick={() => setEditPost(null)}>
                  <FaTimes />
                </button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full input-field min-h-[120px] resize-none mb-3"
              />
              <div className="mb-4">
                <label className="text-xs font-medium text-foreground-muted">
                  Tag
                </label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="">Please select a tag</option>
                  {TAGS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={doEdit}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <FaCheck className="w-3 h-3" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
