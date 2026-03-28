import { useState, useEffect } from "react";
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
} from "react-icons/fa";

interface Comment {
  _id: string;
  author: string;
  content: string;
  time: string;
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
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("General");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    api
      .get("/community")
      .then((r) => setPosts(r.data.data))
      .catch(() => toast.error("Failed to load posts"))
      .finally(() => setLoading(false));
  }, []);

  const addPost = async () => {
    if (!newContent.trim()) return toast.error("Please write something");
    setPosting(true);
    try {
      const tags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await api.post("/community", { content: newContent, tags });
      setPosts((p) => [res.data.data, ...p]);
      setNewContent("");
      setNewTags("General");
      setShowModal(false);
      toast.success("Post shared!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setPosting(false);
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
      toast.error("Failed to like");
    }
  };

  const addComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/community/${postId}/comments`, {
        content: commentText,
      });
      setPosts((p) =>
        p.map((post) =>
          post._id === postId
            ? { ...post, comments: [...post.comments, res.data.data] }
            : post,
        ),
      );
      setCommentText("");
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to comment");
    }
  };

  const deletePost = async (id: string) => {
    try {
      await api.delete(`/community/${id}`);
      setPosts((p) => p.filter((post) => post._id !== id));
      toast.success("Post deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Community</h1>
            <p className="text-foreground-muted mt-1">
              Share and learn together
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> Post
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to share something!</p>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {post.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{post.author}</p>
                    <p className="text-xs text-foreground-muted">
                      {formatTime(post.time)}
                    </p>
                  </div>
                </div>
                {post.userId === user?.id && (
                  <button
                    onClick={() => deletePost(post._id)}
                    className="text-foreground-muted hover:text-destructive"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                )}
              </div>

              <p className="text-sm mb-3">{post.content}</p>
              <div className="flex gap-2 mb-3 flex-wrap">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 pt-3 border-t border-border">
                <button
                  onClick={() => toggleLike(post._id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? "text-destructive" : "text-foreground-muted hover:text-destructive"}`}
                >
                  <FaHeart /> {post.likes}
                </button>
                <button
                  onClick={() =>
                    setExpandedComments(
                      expandedComments === post._id ? null : post._id,
                    )
                  }
                  className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary transition-colors"
                >
                  <FaComment /> {post.comments.length}
                </button>
              </div>

              {expandedComments === post._id && (
                <div className="mt-3 space-y-2">
                  {post.comments.map((c) => (
                    <div key={c._id} className="bg-muted rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold">{c.author}</p>
                      <p className="text-xs text-foreground-muted">
                        {c.content}
                      </p>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && addComment(post._id)
                      }
                      placeholder="Write a comment..."
                      className="input-field flex-1 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => addComment(post._id)}
                      className="btn-primary py-1.5 px-3"
                    >
                      <FaPaperPlane className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">New Post</h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <textarea
                placeholder="Share your thoughts, achievements, or ask for help..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="input-field min-h-[120px] mb-3"
              />
              <input
                placeholder="Tags (comma separated, e.g. Goals, Achievement)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="input-field mb-4"
              />
              <button
                onClick={addPost}
                disabled={posting}
                className="btn-primary w-full disabled:opacity-50"
              >
                {posting ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
