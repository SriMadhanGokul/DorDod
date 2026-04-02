import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaYoutube,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaLightbulb,
  FaTimes,
  FaPlay,
  FaUpload,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  instructor: string;
  skillTag: string;
  skillLevel: string;
  videoUrl: string;
  enrolled: boolean;
  progress: number;
  isAdminCourse: boolean;
  uploadedBy: string | null;
}
interface YouTubeLink {
  title: string;
  channel: string;
  url: string;
}
interface UserSkill {
  _id: string;
  name: string;
  status: string;
  category: string;
}
interface MyUpload {
  _id: string;
  title: string;
  status: string;
  category: string;
  createdAt: string;
  rejectionReason?: string;
}

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function LearningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const skillFilter = searchParams.get("skill") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<YouTubeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // My Skills panel
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [careerPath, setCareerPath] = useState("");

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [showUploads, setShowUploads] = useState(false);
  const [myUploads, setMyUploads] = useState<MyUpload[]>([]);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Technical",
    skillLevel: "Beginner",
    videoUrl: "",
    skillTag: "",
    duration: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (skillFilter) params.set("skill", skillFilter);
        if (level !== "All") params.set("level", level);
        const res = await api.get(`/learning?${params.toString()}`);
        setCourses(res.data.data);
        setYoutubeLinks(res.data.youtubeLinks || []);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [skillFilter, level]);

  const handleOpenSkillsPanel = async () => {
    setShowSkillsPanel(true);
    if (mySkills.length > 0) return;
    setSkillsLoading(true);
    try {
      const res = await api.get("/skill-path");
      if (res.data.data) {
        setCareerPath(res.data.data.careerPath);
        setMySkills(res.data.data.skills.filter((s: any) => s.addedToGoal));
      }
    } catch {
    } finally {
      setSkillsLoading(false);
    }
  };

  const loadMyUploads = async () => {
    try {
      const res = await api.get("/learning/my-uploads");
      setMyUploads(res.data.data);
    } catch {
      toast.error("Failed to load uploads");
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.category || !uploadForm.skillLevel)
      return toast.error("Title, category and skill level are required");
    setUploading(true);
    try {
      await api.post("/learning/upload", uploadForm);
      toast.success("📤 Course submitted for admin approval!");
      setShowUpload(false);
      setUploadForm({
        title: "",
        description: "",
        category: "Technical",
        skillLevel: "Beginner",
        videoUrl: "",
        skillTag: "",
        duration: "",
      });
      loadMyUploads();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const enroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await api.post(`/learning/${courseId}/enroll`);
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, enrolled: true } : c)),
      );
      toast.success("Enrolled successfully!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  };

  const clearSkillFilter = () => setSearchParams({});

  const categories = [
    "All",
    ...Array.from(new Set(courses.map((c) => c.category))),
  ];
  const filtered = courses.filter(
    (c) =>
      (category === "All" || c.category === category) &&
      (c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.skillTag?.toLowerCase().includes(search.toLowerCase())),
  );

  const statusIcon = (s: string) =>
    s === "approved" ? (
      <FaCheckCircle className="text-green-500" />
    ) : s === "pending" ? (
      <FaClock className="text-yellow-500" />
    ) : (
      <FaTimesCircle className="text-red-500" />
    );

  const CATEGORIES_UPLOAD = [
    "Technical",
    "Leadership",
    "Soft Skills",
    "Management",
    "Innovation",
    "DevOps",
    "Data",
    "Other",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Learning Library</h1>
            {skillFilter ? (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-foreground-muted">
                  Resources for:
                </span>
                <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                  {skillFilter}
                </span>
                <button
                  onClick={clearSkillFilter}
                  className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1"
                >
                  <FaArrowLeft className="w-3 h-3" /> All Courses
                </button>
              </div>
            ) : (
              <p className="text-foreground-muted mt-1">
                Explore courses to accelerate your growth
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setShowUploads(true);
                loadMyUploads();
              }}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <FaClock /> My Uploads
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <FaUpload /> Upload Course
            </button>
            <button
              onClick={handleOpenSkillsPanel}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <FaLightbulb className="text-secondary" /> My Skills
            </button>
          </div>
        </div>

        {/* YouTube section */}
        {skillFilter && youtubeLinks.length > 0 && (
          <div className="card-elevated border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-4">
              <FaYoutube className="text-red-500 text-xl" />
              <h2 className="font-semibold">
                YouTube Resources for{" "}
                <span className="text-primary">{skillFilter}</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {youtubeLinks.map((yt, i) => (
                <a
                  key={i}
                  href={yt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-muted rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <FaYoutube className="text-white text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-red-600 line-clamp-2">
                      {yt.title}
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {yt.channel}
                    </p>
                  </div>
                  <FaExternalLinkAlt className="text-foreground-muted w-3 h-3 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* No platform courses */}
        {skillFilter && !loading && courses.length === 0 && (
          <div className="card-elevated text-center py-8">
            <FaYoutube className="text-5xl text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">
              No platform courses for "{skillFilter}" yet
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              Use the YouTube resources above to learn this skill.
            </p>
            <button
              onClick={clearSkillFilter}
              className="btn-secondary text-sm"
            >
              Browse All Courses
            </button>
          </div>
        )}

        {/* Search + Filters */}
        {(!skillFilter || courses.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-11"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${level === l ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Course grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course) => (
              <div key={course._id} className="card-elevated flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium bg-primary-light text-primary px-2 py-1 rounded-full">
                      {course.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        course.skillLevel === "Beginner"
                          ? "bg-green-100 text-green-700"
                          : course.skillLevel === "Intermediate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {course.skillLevel}
                    </span>
                    {course.skillTag && (
                      <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full">
                        {course.skillTag}
                      </span>
                    )}
                    {!course.isAdminCourse && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        👤 Community
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mt-1 mb-1">{course.title}</h3>
                  {course.description && (
                    <p className="text-xs text-foreground-muted mb-1 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <p className="text-sm text-foreground-muted">
                    by {course.instructor} · {course.duration}
                  </p>
                  {course.enrolled && course.progress > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${course.progress === 100 ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-foreground-muted">
                        {course.progress}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <button
                    disabled={course.enrolled || enrolling === course._id}
                    onClick={() => !course.enrolled && enroll(course._id)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-70 ${
                      course.enrolled
                        ? "bg-success/10 text-success cursor-default"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {enrolling === course._id
                      ? "Enrolling..."
                      : course.enrolled
                        ? course.progress === 100
                          ? "Completed ✓"
                          : "Continue"
                        : "Enroll"}
                  </button>
                  {course.videoUrl && (
                    <a
                      href={course.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 border border-red-200 transition-all"
                    >
                      <FaYoutube className="text-sm" /> Watch Video
                    </a>
                  )}
                  {course.skillTag && !course.videoUrl && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(course.skillTag + " tutorial")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 border border-red-200 transition-all"
                    >
                      <FaYoutube className="text-sm" /> Watch on YouTube
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Upload Course Modal ─────────────────────────────────────────── */}
        {showUpload && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FaUpload className="text-primary" /> Upload a Course
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Your course will be reviewed by admin before publishing
                  </p>
                </div>
                <button onClick={() => setShowUpload(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Course title *"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="input-field"
                />
                <textarea
                  placeholder="Course description"
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="input-field min-h-[80px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Category *
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) =>
                        setUploadForm((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="input-field"
                    >
                      {CATEGORIES_UPLOAD.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Skill Level *
                    </label>
                    <select
                      value={uploadForm.skillLevel}
                      onChange={(e) =>
                        setUploadForm((p) => ({
                          ...p,
                          skillLevel: e.target.value,
                        }))
                      }
                      className="input-field"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Related Skill Tag
                    </label>
                    <input
                      placeholder="e.g. React, Python"
                      value={uploadForm.skillTag}
                      onChange={(e) =>
                        setUploadForm((p) => ({
                          ...p,
                          skillTag: e.target.value,
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Duration
                    </label>
                    <input
                      placeholder="e.g. 4h, 2 weeks"
                      value={uploadForm.duration}
                      onChange={(e) =>
                        setUploadForm((p) => ({
                          ...p,
                          duration: e.target.value,
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Video URL (YouTube / Drive link)
                  </label>
                  <input
                    placeholder="https://youtube.com/..."
                    value={uploadForm.videoUrl}
                    onChange={(e) =>
                      setUploadForm((p) => ({ ...p, videoUrl: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">
                    ⚠️ Your course will be reviewed by an admin. It will only
                    appear in the library after approval.
                  </p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {uploading ? "Submitting..." : "📤 Submit for Review"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── My Uploads Modal ───────────────────────────────────────────── */}
        {showUploads && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg animate-fade-in max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">My Uploaded Courses</h2>
                <button onClick={() => setShowUploads(false)}>
                  <FaTimes />
                </button>
              </div>
              {myUploads.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                  <FaUpload className="text-3xl mx-auto mb-2 opacity-30" />
                  <p>No uploads yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myUploads.map((u) => (
                    <div
                      key={u._id}
                      className={`p-4 rounded-xl border ${u.status === "approved" ? "border-green-200 bg-green-50" : u.status === "rejected" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{u.title}</p>
                          <p className="text-xs text-foreground-muted">
                            {u.category} ·{" "}
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                          {u.status === "rejected" && u.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Reason: {u.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(u.status)}
                          <span
                            className={`text-xs font-medium capitalize ${u.status === "approved" ? "text-green-600" : u.status === "rejected" ? "text-red-600" : "text-yellow-600"}`}
                          >
                            {u.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── My Skills Panel ────────────────────────────────────────────── */}
        {showSkillsPanel && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setShowSkillsPanel(false)}
            />
            <div className="relative w-full max-w-sm bg-card h-full shadow-2xl flex flex-col animate-fade-in">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <FaLightbulb className="text-secondary" /> My Goal Skills
                  </h2>
                  {careerPath && (
                    <p className="text-xs text-foreground-muted mt-0.5">
                      Path: {careerPath}
                    </p>
                  )}
                </div>
                <button onClick={() => setShowSkillsPanel(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {skillsLoading && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!skillsLoading && mySkills.length === 0 && (
                  <div className="text-center py-12 text-foreground-muted">
                    <FaLightbulb className="text-4xl mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                      No skills added to goals yet
                    </p>
                    <p className="text-xs mt-1">
                      Go to Skills page → click "+ Goal"
                    </p>
                    <button
                      onClick={() => {
                        setShowSkillsPanel(false);
                        navigate("/skills");
                      }}
                      className="btn-primary text-sm mt-4"
                    >
                      Go to Skills
                    </button>
                  </div>
                )}
                {!skillsLoading &&
                  mySkills.length > 0 &&
                  (["learning", "to-learn", "learned"] as const).map(
                    (status) => {
                      const group = mySkills.filter((s) => s.status === status);
                      if (group.length === 0) return null;
                      const cfg = {
                        learning: {
                          label: "📖 Currently Learning",
                          color: "text-primary",
                          dot: "bg-primary",
                        },
                        "to-learn": {
                          label: "⏳ To Learn Next",
                          color: "text-foreground-muted",
                          dot: "bg-muted-foreground",
                        },
                        learned: {
                          label: "✅ Already Learned",
                          color: "text-success",
                          dot: "bg-success",
                        },
                      }[status];
                      return (
                        <div key={status}>
                          <h3
                            className={`text-xs font-semibold uppercase tracking-wide mb-2 ${cfg.color}`}
                          >
                            {cfg.label} ({group.length})
                          </h3>
                          <div className="space-y-2">
                            {group.map((skill) => (
                              <div
                                key={skill._id}
                                className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-accent transition-all"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {skill.name}
                                    </p>
                                    <p className="text-xs text-foreground-muted">
                                      {skill.category}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setShowSkillsPanel(false);
                                    setSearchParams({ skill: skill.name });
                                  }}
                                  className="shrink-0 ml-2 text-xs bg-primary text-primary-foreground hover:opacity-90 px-2.5 py-1 rounded-lg flex items-center gap-1"
                                >
                                  <FaPlay className="w-2 h-2" /> Learn
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
              </div>
              {mySkills.length > 0 && (
                <div className="p-4 border-t border-border bg-muted/50">
                  <div className="flex justify-between text-xs text-foreground-muted mb-1">
                    <span>
                      ✅ {mySkills.filter((s) => s.status === "learned").length}{" "}
                      learned
                    </span>
                    <span>
                      📖{" "}
                      {mySkills.filter((s) => s.status === "learning").length}{" "}
                      learning
                    </span>
                    <span>
                      ⏳{" "}
                      {mySkills.filter((s) => s.status === "to-learn").length}{" "}
                      to learn
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-success rounded-full h-1.5"
                      style={{
                        width: `${Math.round((mySkills.filter((s) => s.status === "learned").length / mySkills.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowSkillsPanel(false);
                      navigate("/skills");
                    }}
                    className="w-full mt-3 text-xs text-primary hover:underline"
                  >
                    Manage skills in Skills page →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
