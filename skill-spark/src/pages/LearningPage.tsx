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
} from "react-icons/fa";

interface Course {
  _id: string;
  title: string;
  category: string;
  duration: string;
  instructor: string;
  skillTag: string;
  enrolled: boolean;
  progress: number;
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

export default function LearningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const skillFilter = searchParams.get("skill") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<YouTubeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // My Learning Skills panel
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [careerPath, setCareerPath] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const url = skillFilter
          ? `/learning?skill=${encodeURIComponent(skillFilter)}`
          : "/learning";
        const res = await api.get(url);
        setCourses(res.data.data);
        setYoutubeLinks(res.data.youtubeLinks || []);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [skillFilter]);

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

  const enroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await api.post(`/learning/${courseId}/enroll`);
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, enrolled: true } : c)),
      );
      toast.success("Enrolled successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  };

  const clearSkillFilter = () => {
    setSearchParams({});
  };

  // Fetch only skills the user has added as goals (addedToGoal = true)
  const handleOpenSkillsPanel = async () => {
    setShowSkillsPanel(true);
    if (mySkills.length > 0) return; // already loaded
    setSkillsLoading(true);
    try {
      const res = await api.get("/skill-path");
      if (res.data.data) {
        setCareerPath(res.data.data.careerPath);
        // Show ONLY skills that user explicitly added to goals
        const goalSkills = res.data.data.skills.filter(
          (s: any) => s.addedToGoal,
        );
        setMySkills(goalSkills);
      }
    } catch {
      toast.error("Failed to load your skills");
    } finally {
      setSkillsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Learning Library</h1>
            {skillFilter ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-foreground-muted">
                  Showing resources for:
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
          {/* My Learning Skills button */}
          <button
            onClick={handleOpenSkillsPanel}
            className="btn-secondary flex items-center gap-2 text-sm shrink-0"
          >
            <FaLightbulb className="text-secondary" /> My Skills
          </button>
        </div>

        {/* ─── My Learning Skills Slide Panel ──────────────────────────────── */}
        {showSkillsPanel && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setShowSkillsPanel(false)}
            />
            {/* Panel */}
            <div className="relative w-full max-w-sm bg-card h-full shadow-2xl flex flex-col animate-fade-in overflow-hidden">
              {/* Panel header */}
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
                  <p className="text-xs text-foreground-muted">
                    Skills you added as goals
                  </p>
                </div>
                <button
                  onClick={() => setShowSkillsPanel(false)}
                  className="text-foreground-muted hover:text-foreground p-1"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {skillsLoading && (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!skillsLoading && mySkills.length === 0 && (
                  <div className="text-center py-12 text-foreground-muted">
                    <FaLightbulb className="text-4xl mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">
                      No skills added to goals yet
                    </p>
                    <p className="text-xs mt-1">
                      Go to Skills page → click "+ Goal" on skills you want to
                      learn
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

                {!skillsLoading && mySkills.length > 0 && (
                  <>
                    {/* Filter tabs */}
                    {(["learning", "to-learn", "learned"] as const).map(
                      (status) => {
                        const group = mySkills.filter(
                          (s) => s.status === status,
                        );
                        if (group.length === 0) return null;

                        const statusConfig = {
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
                              className={`text-xs font-semibold uppercase tracking-wide mb-2 ${statusConfig.color}`}
                            >
                              {statusConfig.label} ({group.length})
                            </h3>
                            <div className="space-y-2">
                              {group.map((skill) => (
                                <div
                                  key={skill._id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-accent transition-all"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`}
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
                                  {/* Learn button per skill */}
                                  <button
                                    onClick={() => {
                                      setShowSkillsPanel(false);
                                      setSearchParams({ skill: skill.name });
                                    }}
                                    className="shrink-0 ml-2 text-xs bg-primary text-primary-foreground hover:opacity-90 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
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
                  </>
                )}
              </div>

              {/* Panel footer */}
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
                      className="bg-success rounded-full h-1.5 transition-all"
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
                    className="w-full mt-3 text-xs text-primary hover:underline text-center"
                  >
                    Manage skills in Skills page →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── YouTube Links (shown when filtering by skill) ──────────────── */}
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
                  className="flex items-start gap-3 p-3 bg-muted rounded-xl hover:bg-red-50 hover:border-red-200 border border-transparent transition-all group"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <FaYoutube className="text-white text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-red-600 transition-colors line-clamp-2">
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
            <p className="text-xs text-foreground-muted mt-3">
              💡 Use these YouTube videos if you need extra explanation for any
              course below
            </p>
          </div>
        )}

        {/* ─── No platform courses for this skill ──────────────────────────── */}
        {skillFilter && !loading && courses.length === 0 && (
          <div className="card-elevated border-l-4 border-l-secondary text-center py-8">
            <FaYoutube className="text-5xl text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">
              No platform courses for "{skillFilter}" yet
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              But don't worry! Use the YouTube resources above to learn this
              skill for free.
            </p>
            <button
              onClick={clearSkillFilter}
              className="btn-secondary text-sm"
            >
              Browse All Courses
            </button>
          </div>
        )}

        {/* Search + filters */}
        {(!skillFilter || courses.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground-muted hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Course grid */}
        {!loading && filtered.length > 0 && (
          <>
            {skillFilter && (
              <p className="text-sm text-foreground-muted">
                Found <strong>{filtered.length}</strong> course
                {filtered.length !== 1 ? "s" : ""} for{" "}
                <strong>{skillFilter}</strong>
              </p>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((course) => (
                <div key={course._id} className="card-elevated flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-medium bg-primary-light text-primary px-2 py-1 rounded-full">
                        {course.category}
                      </span>
                      {course.skillTag && (
                        <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full">
                          {course.skillTag}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mt-1 mb-1">{course.title}</h3>
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

                  {/* Enroll button */}
                  <button
                    disabled={course.enrolled || enrolling === course._id}
                    onClick={() => !course.enrolled && enroll(course._id)}
                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-70 ${
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

                  {/* YouTube fallback link for this course's skill */}
                  {course.skillTag && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(course.skillTag + " tutorial")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 border border-red-200"
                    >
                      <FaYoutube className="text-sm" /> Watch on YouTube
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty search result */}
        {!loading && filtered.length === 0 && courses.length > 0 && (
          <div className="text-center py-12 text-foreground-muted">
            <p className="font-medium">No courses match your search</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="text-sm text-primary hover:underline mt-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
