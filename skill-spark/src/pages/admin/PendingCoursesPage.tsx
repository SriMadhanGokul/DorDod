import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaTimes,
  FaExternalLinkAlt,
  FaClock,
  FaUser,
} from "react-icons/fa";

export default function PendingCoursesPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/admin/courses/pending")
      .then((r) => setPending(r.data.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const approve = async (id: string) => {
    setProcessing(id);
    try {
      await api.patch(`/admin/courses/${id}/approve`);
      setPending((p) => p.filter((c) => c._id !== id));
      toast.success("Course approved and published! ✅");
    } catch {
      toast.error("Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (id: string) => {
    if (!reason.trim()) return toast.error("Please provide a rejection reason");
    setProcessing(id);
    try {
      await api.patch(`/admin/courses/${id}/reject`, { reason });
      setPending((p) => p.filter((c) => c._id !== id));
      setRejectId(null);
      setReason("");
      toast.success("Course rejected.");
    } catch {
      toast.error("Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaClock className="text-yellow-500" /> Pending Course Approvals
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pending.length} course{pending.length !== 1 ? "s" : ""} waiting for
            review
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FaCheck className="text-5xl text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">All caught up!</h3>
            <p className="text-gray-400 text-sm mt-1">
              No pending courses to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-xl border border-yellow-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-800">
                        {course.title}
                      </h3>
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
                        ⏳ Pending
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        {course.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          course.skillLevel === "Beginner"
                            ? "bg-green-100 text-green-600"
                            : course.skillLevel === "Intermediate"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        {course.skillLevel}
                      </span>
                    </div>

                    {course.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {course.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <FaUser className="w-3 h-3" />
                        <span className="text-xs">
                          {course.uploadedBy?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        📧 {course.uploadedBy?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        ⏱ {course.duration || "Not specified"}
                      </div>
                      <div className="text-xs text-gray-500">
                        🏷 {course.skillTag || "—"}
                      </div>
                    </div>

                    {course.videoUrl && (
                      <a
                        href={course.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline mt-2"
                      >
                        <FaExternalLinkAlt className="w-2.5 h-2.5" /> Preview
                        Video
                      </a>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Submitted:{" "}
                      {new Date(course.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => approve(course._id)}
                      disabled={processing === course._id}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                    >
                      <FaCheck className="w-3 h-3" />
                      {processing === course._id ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectId(course._id);
                        setReason("");
                      }}
                      disabled={processing === course._id}
                      className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                    >
                      <FaTimes className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>

                {/* Reject reason input */}
                {rejectId === course._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason:
                    </p>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why this course is being rejected..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[80px]"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => reject(course._id)}
                        disabled={processing === course._id}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {processing === course._id
                          ? "Rejecting..."
                          : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectId(null);
                          setReason("");
                        }}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
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
