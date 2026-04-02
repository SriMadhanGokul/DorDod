import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaTrash, FaBan, FaComment } from "react-icons/fa";

export default function CommunityModeration() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/admin/posts")
      .then((r) => setPosts(r.data.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((p) => p.filter((x) => x._id !== id));
      toast.success("Post deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/admin/posts/${postId}/comments/${commentId}`);
      setPosts((p) =>
        p.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter((c: any) => c._id !== commentId),
              }
            : post,
        ),
      );
      toast.success("Comment deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      toast.success("User suspended!");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Community Moderation
          </h1>
          <p className="text-gray-500 text-sm">{posts.length} posts</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No posts found
              </div>
            )}
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {post.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {post.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {post.user?.email} ·{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {post.user?.suspended && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setExpanded(expanded === post._id ? null : post._id)
                      }
                      className="text-blue-400 hover:text-blue-600 p-1 flex items-center gap-1 text-xs"
                    >
                      <FaComment /> {post.comments?.length || 0}
                    </button>
                    <button
                      onClick={() => suspendUser(post.user?._id)}
                      title="Suspend user"
                      className="text-yellow-400 hover:text-yellow-600 p-1"
                    >
                      <FaBan />
                    </button>
                    <button
                      onClick={() => deletePost(post._id)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-3">{post.content}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {post.tags?.map((t: string) => (
                    <span
                      key={t}
                      className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400">
                    {post.likes?.length || 0} likes
                  </span>
                </div>

                {expanded === post._id && post.comments?.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">
                      Comments
                    </p>
                    {post.comments.map((c: any) => (
                      <div
                        key={c._id}
                        className="flex items-start justify-between bg-gray-50 rounded-lg p-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            {c.user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-600">{c.content}</p>
                        </div>
                        <button
                          onClick={() => deleteComment(post._id, c._id)}
                          className="text-red-400 hover:text-red-600 ml-2 shrink-0"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
