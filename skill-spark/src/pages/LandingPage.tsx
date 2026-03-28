import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";

interface Course {
  _id: string;
  title: string;
  category: string;
  duration: string;
  instructor: string;
  enrolled: boolean;
  progress: number;
}

export default function LearningPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // ─── Fetch courses ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/learning");
        setCourses(res.data.data);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(courses.map((c) => c.category))),
  ];

  const filtered = courses.filter(
    (c) =>
      (category === "All" || c.category === category) &&
      c.title.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Enroll ───────────────────────────────────────────────────────────────
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Learning Library</h1>
          <p className="text-foreground-muted mt-1">
            Explore courses to accelerate your growth
          </p>
        </div>

        {/* Search + filters */}
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Courses grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <div key={course._id} className="card-elevated flex flex-col">
              <div className="flex-1">
                <span className="text-xs font-medium bg-primary-light text-primary px-2 py-1 rounded-full">
                  {course.category}
                </span>
                <h3 className="font-semibold mt-3 mb-1">{course.title}</h3>
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
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
