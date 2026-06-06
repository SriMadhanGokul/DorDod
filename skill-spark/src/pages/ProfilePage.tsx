import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaSignOutAlt,
  FaEdit,
  FaPlus,
  FaTrash,
  FaTimes,
  FaCheck,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaChevronDown,
  FaChevronUp,
  FaCamera,
  FaDownload,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const PROFICIENCY = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Fluent",
  "Native",
];
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const LV = ({ label, value }: { label: string; value?: string }) => (
  <div className="py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">
      {label}
    </span>
    <span className="text-sm text-gray-800 dark:text-white font-medium">
      {value || <span className="text-gray-300 italic">Not provided</span>}
    </span>
  </div>
);

function ScoreRing({ score, label }: { score: number; label: string }) {
  const size = 90;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 60
        ? "#3b82f6"
        : score >= 40
          ? "#f59e0b"
          : "#ef4444";
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={9}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
      <span
        className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
          score >= 80
            ? "bg-green-100 text-green-700"
            : score >= 60
              ? "bg-blue-100 text-blue-700"
              : score >= 40
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: any) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  </div>
);

const Sel = ({ label, value, onChange, options, required = false }: any) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      <option value="">Please select</option>
      {options.map((o: string) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const ProfSel = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      <option value="">Select level</option>
      {PROFICIENCY.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  </div>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"personal" | "professional" | "security">(
    "personal",
  );

  const [avatar, setAvatar] = useState((user as any)?.avatar || "");
  const [uploadingAvatar, setUpAvatar] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const EMPTY_P = {
    firstName: "",
    middleName: "",
    lastName: "",
    preferredFullName: "",
    contactNumber: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    nationality: "",
    country: "",
    state: "",
    city: "",
    currentCity: "",
    pincode: "",
    bio: "",
  };
  const [personal, setPersonal] = useState(EMPTY_P);
  const [isEditingP, setEditP] = useState(false);
  const [savingP, setSavingP] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });

  const [prof, setProf] = useState<any>(null);
  const [loadingProf, setLoadingProf] = useState(false);
  const [expandedSec, setExpSec] = useState<string | null>("work");

  const EMPTY_WORK = {
    isCurrent: false,
    organizationName: "",
    title: "",
    startDate: "",
    endDate: "",
    jobResponsibilities: "",
  };
  const EMPTY_EDU = {
    collegeUniversity: "",
    degree: "",
    areaOfStudy: "",
    degreeCompleted: false,
    dateCompleted: "",
  };
  const EMPTY_LANG = {
    language: "",
    speakingProficiency: "",
    writingProficiency: "",
    readingProficiency: "",
  };
  const EMPTY_CERT = {
    name: "",
    institution: "",
    effectiveDate: "",
    expirationDate: "",
  };
  const EMPTY_SKILL = { skill: "", proficiency: "" };
  const EMPTY_HONOR = { title: "", institution: "", issueDate: "" };

  const [newWork, setNewWork] = useState({ ...EMPTY_WORK });
  const [newEdu, setNewEdu] = useState({ ...EMPTY_EDU });
  const [newLang, setNewLang] = useState({ ...EMPTY_LANG });
  const [newCert, setNewCert] = useState({ ...EMPTY_CERT });
  const [newTSkill, setNewTSkill] = useState({ ...EMPTY_SKILL });
  const [newFSkill, setNewFSkill] = useState({ ...EMPTY_SKILL });
  const [newHonor, setNewHonor] = useState({ ...EMPTY_HONOR });

  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editWF, setEditWF] = useState<any>({});

  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    curr: false,
    new_: false,
    conf: false,
  });
  const [savingPw, setSavingPw] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);

  // Apply a user object to the personal form (handles all fields)
  const applyUser = (u: any) => {
    if (!u) return;
    setAvatar(u.avatar || "");
    setPersonal({
      firstName: u.firstName || "",
      middleName: u.middleName || "",
      lastName: u.lastName || "",
      preferredFullName: u.preferredFullName || "",
      contactNumber: u.contactNumber || "",
      gender: u.gender || "",
      dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).substring(0, 10) : "",
      maritalStatus: u.maritalStatus || "",
      nationality: u.nationality || "",
      country: u.country || "",
      state: u.state || "",
      city: u.city || "",
      currentCity: u.currentCity || "",
      pincode: u.pincode || "",
      bio: u.bio || "",
    });
    if (u.notifications) setNotifications(u.notifications);
  };

  // Load profile on mount — tries /profile, falls back to /auth/me,
  // and handles both { user } and { data } response shapes.
  useEffect(() => {
    const loadPersonal = async () => {
      try {
        const res = await api.get("/profile");
        const u = res.data.user || res.data.data;
        if (u) {
          applyUser(u);
          return;
        }
      } catch (err) {
        console.warn("GET /profile failed, falling back to /auth/me", err);
      }

      try {
        const res = await api.get("/auth/me");
        const u = res.data.user || res.data.data;
        if (u) applyUser(u);
        else console.error("/auth/me returned no user object:", res.data);
      } catch (err) {
        console.error("Failed to load profile from both endpoints", err);
      }
    };

    loadPersonal();
    loadScore();
  }, []);

  useEffect(() => {
    if (tab === "professional" && !prof) loadProfessional();
    if (tab === "personal") loadScore();
  }, [tab]);

  const loadScore = async () => {
    setLoadingScore(true);
    try {
      const res = await api.get("/profile/score");
      setScoreData(res.data.data);
    } catch (err) {
      console.error("loadScore failed", err);
    } finally {
      setLoadingScore(false);
    }
  };

  const loadProfessional = async () => {
    setLoadingProf(true);
    try {
      const r = await api.get("/profile/professional");
      setProf(r.data.data);
    } catch {
      toast.error("Failed to load professional profile");
    } finally {
      setLoadingProf(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be under 5MB");
    setUpAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/profile/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatar(res.data.avatar);
      toast.success("Profile picture updated!");
      loadScore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to upload");
    } finally {
      setUpAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const savePersonal = async () => {
    if (!personal.firstName.trim())
      return toast.error("First name is required");
    if (!personal.lastName.trim()) return toast.error("Last name is required");
    setSavingP(true);
    try {
      const res = await api.put("/profile", personal);
      // Re-apply the saved user so the view reflects exactly what's stored
      const u = res.data.user || res.data.data;
      if (u) applyUser(u);
      setEditP(false);
      toast.success("Profile updated!");
      loadScore();
    } catch (err: any) {
      console.error("savePersonal failed", err);
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingP(false);
    }
  };

  const refreshProf = async () => {
    try {
      const r = await api.get("/profile/professional");
      setProf(r.data.data);
    } catch {}
  };

  const addProfItem = async (section: string, data: any, reset: () => void) => {
    try {
      await api.post(`/profile/professional/${section}`, data);
      await refreshProf();
      reset();
      toast.success("Added!");
      loadScore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to add");
    }
  };

  const updateProfItem = async (section: string, id: string, data: any) => {
    try {
      await api.put(`/profile/professional/${section}/${id}`, data);
      await refreshProf();
      setEditingWorkId(null);
      setEditWF({});
      toast.success("Updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update");
    }
  };

  const delProfItem = async (section: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/profile/professional/${section}/${id}`);
      await refreshProf();
      toast.success("Deleted!");
      loadScore();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const startEditWork = (w: any) => {
    setEditingWorkId(w._id);
    setEditWF({
      organizationName: w.organizationName || "",
      title: w.title || "",
      startDate: w.startDate?.slice(0, 10) || "",
      endDate: w.endDate?.slice(0, 10) || "",
      isCurrent: w.isCurrent || false,
      jobResponsibilities: w.jobResponsibilities || "",
    });
  };

  const SecHead = ({
    id,
    label,
    count = 0,
  }: {
    id: string;
    label: string;
    count?: number;
  }) => (
    <button
      onClick={() => setExpSec(expandedSec === id ? null : id)}
      className="w-full flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold text-sm text-gray-800 dark:text-white"
    >
      <span className="flex items-center gap-2">
        {label}
        {count > 0 && (
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </span>
      {expandedSec === id ? (
        <FaChevronUp className="w-3 h-3 text-gray-400" />
      ) : (
        <FaChevronDown className="w-3 h-3 text-gray-400" />
      )}
    </button>
  );

  const downloadResume = async () => {
    setDownloadingResume(true);
    try {
      if (!prof) await loadProfessional();
      const r = await api.get("/profile").catch(() => api.get("/auth/me"));
      const u = r.data.user || r.data.data;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = 210;
      const margin = 18;
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, 210, 38, "F");
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      const fullName =
        u.preferredFullName ||
        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
        u.name ||
        "Name";
      doc.text(fullName, margin, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        [
          u.email,
          u.contactNumber,
          u.city && u.country ? `${u.city}, ${u.country}` : "",
        ]
          .filter(Boolean)
          .join("  |  "),
        margin,
        24,
      );
      if (u.bio) {
        doc.setFontSize(9);
        doc.setTextColor(200, 220, 255);
        doc.text(
          doc.splitTextToSize(u.bio, pageW - margin * 2)[0] || "",
          margin,
          32,
        );
      }
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated by DoR-DoD  •  Page ${i} of ${totalPages}`,
          margin,
          290,
        );
      }
      doc.save(`${fullName.replace(/\s+/g, "_")}_Resume.pdf`);
      toast.success("Resume downloaded!");
    } catch (err) {
      console.error("downloadResume failed", err);
      toast.error("Failed to generate resume");
    } finally {
      setDownloadingResume(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Identity
        </h1>

        {/* USER CARD */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(user as any)?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              {uploadingAvatar ? (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-all"
                >
                  <FaCamera className="w-3 h-3" />
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {(user as any)?.name ||
                  `${personal.firstName} ${personal.lastName}`.trim() ||
                  "User"}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {(user as any)?.email}
              </p>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">
                {(user as any)?.subscription || "Free"} Plan
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {scoreData && !loadingScore && (
                <ScoreRing
                  score={scoreData.totalScore}
                  label={scoreData.label}
                />
              )}
              <button
                onClick={downloadResume}
                disabled={downloadingResume}
                className="flex-1 sm:flex-none flex flex-col items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-semibold text-xs disabled:opacity-50 transition-all"
              >
                <FaDownload className="w-4 h-4" />
                {downloadingResume ? "Generating..." : "Download Resume"}
              </button>
            </div>
          </div>

          {scoreData && scoreData.totalScore < 100 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Complete your profile to improve your resume
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ...scoreData.personalMissing,
                  ...scoreData.professionalMissing,
                ]
                  .slice(0, 5)
                  .map((item: any) => (
                    <span
                      key={item.label}
                      className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full"
                    >
                      <FaExclamationCircle className="w-2.5 h-2.5" />{" "}
                      {item.label} (+{item.points}%)
                    </span>
                  ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-indigo-600 transition-all duration-700"
                    style={{ width: `${scoreData.totalScore}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">
                  {scoreData.totalScore}% complete
                </span>
              </div>
              <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                <span>Personal: {scoreData.personalScore}/50</span>
                <span>Professional: {scoreData.professionalScore}/50</span>
              </div>
            </div>
          )}
          {scoreData && scoreData.totalScore === 100 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-green-600">
              <FaCheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">
                Profile 100% complete — resume is ready!
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "personal", label: "👤 Personal" },
            { id: "professional", label: "💼 Professional" },
            { id: "security", label: "🔒 Security" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* PERSONAL TAB */}
        {tab === "personal" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                {!isEditingP ? (
                  <button
                    onClick={() => setEditP(true)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    <FaEdit className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditP(false)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg"
                    >
                      <FaTimes className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={savePersonal}
                      disabled={savingP}
                      className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      <FaCheck className="w-3 h-3" />{" "}
                      {savingP ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
              {!isEditingP ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <LV label="First Name" value={personal.firstName} />
                  <LV label="Middle Name" value={personal.middleName} />
                  <LV label="Last Name" value={personal.lastName} />
                  <LV
                    label="Preferred Name"
                    value={personal.preferredFullName}
                  />
                  <LV label="Contact" value={personal.contactNumber} />
                  <LV label="Gender" value={personal.gender} />
                  <LV
                    label="Date of Birth"
                    value={
                      personal.dateOfBirth ? fmtDate(personal.dateOfBirth) : ""
                    }
                  />
                  <LV label="Marital Status" value={personal.maritalStatus} />
                  <LV label="Nationality" value={personal.nationality} />
                  <LV label="Country" value={personal.country} />
                  <LV label="State" value={personal.state} />
                  <LV label="City" value={personal.city} />
                  <LV label="Current City" value={personal.currentCity} />
                  <LV label="Pincode" value={personal.pincode} />
                  {personal.bio && (
                    <div className="sm:col-span-2">
                      <LV label="Bio" value={personal.bio} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="First Name"
                    value={personal.firstName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, firstName: v }))
                    }
                    required
                  />
                  <Field
                    label="Middle Name"
                    value={personal.middleName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, middleName: v }))
                    }
                  />
                  <Field
                    label="Last Name"
                    value={personal.lastName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, lastName: v }))
                    }
                    required
                  />
                  <Field
                    label="Preferred Name"
                    value={personal.preferredFullName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, preferredFullName: v }))
                    }
                  />
                  <Field
                    label="Contact"
                    value={personal.contactNumber}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, contactNumber: v }))
                    }
                  />
                  <Sel
                    label="Gender"
                    value={personal.gender}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, gender: v }))
                    }
                    options={["Male", "Female", "Other", "Prefer not to say"]}
                  />
                  <Field
                    label="Date of Birth"
                    value={personal.dateOfBirth}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, dateOfBirth: v }))
                    }
                    type="date"
                  />
                  <Sel
                    label="Marital Status"
                    value={personal.maritalStatus}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, maritalStatus: v }))
                    }
                    options={["Single", "Married", "Divorced", "Widowed"]}
                  />
                  <Field
                    label="Nationality"
                    value={personal.nationality}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, nationality: v }))
                    }
                  />
                  <Field
                    label="Country"
                    value={personal.country}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, country: v }))
                    }
                  />
                  <Field
                    label="State"
                    value={personal.state}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, state: v }))
                    }
                  />
                  <Field
                    label="City"
                    value={personal.city}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, city: v }))
                    }
                  />
                  <Field
                    label="Current City"
                    value={personal.currentCity}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, currentCity: v }))
                    }
                  />
                  <Field
                    label="Pincode"
                    value={personal.pincode}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, pincode: v }))
                    }
                  />
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      Bio
                    </label>
                    <textarea
                      value={personal.bio}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, bio: e.target.value }))
                      }
                      rows={3}
                      maxLength={300}
                      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                    />
                    <p className="text-xs text-right text-gray-400 mt-1">
                      {personal.bio.length}/300
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Notifications
              </h3>
              <div className="space-y-3">
                {[
                  { key: "email", label: "Email notifications" },
                  { key: "push", label: "Push notifications" },
                  { key: "weekly", label: "Weekly digest" },
                ].map((n) => (
                  <label
                    key={n.key}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {n.label}
                    </span>
                    <button
                      onClick={async () => {
                        const upd = {
                          ...notifications,
                          [n.key]:
                            !notifications[n.key as keyof typeof notifications],
                        };
                        setNotifications(upd);
                        try {
                          await api.put("/profile/notifications", upd);
                        } catch {}
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative ${notifications[n.key as keyof typeof notifications] ? "bg-indigo-600" : "bg-gray-200"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications[n.key as keyof typeof notifications] ? "translate-x-5" : ""}`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2 text-red-500 hover:underline font-medium text-sm"
            >
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        )}

        {/* PROFESSIONAL TAB */}
        {tab === "professional" && (
          <div className="space-y-3">
            {loadingProf && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {prof && (
              <>
                {/* WORK EXPERIENCE */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <SecHead
                    id="work"
                    label="Work Experience"
                    count={prof.workExperience?.length}
                  />
                  {expandedSec === "work" && (
                    <div className="p-4 space-y-3">
                      {(prof.workExperience || []).map((w: any) => (
                        <div
                          key={w._id}
                          className="border border-gray-100 dark:border-gray-700 rounded-xl p-4"
                        >
                          {editingWorkId === w._id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field
                                  label="Organization *"
                                  value={editWF.organizationName}
                                  onChange={(v: string) =>
                                    setEditWF((p: any) => ({
                                      ...p,
                                      organizationName: v,
                                    }))
                                  }
                                />
                                <Field
                                  label="Job Title *"
                                  value={editWF.title}
                                  onChange={(v: string) =>
                                    setEditWF((p: any) => ({ ...p, title: v }))
                                  }
                                />
                                <Field
                                  label="Start Date *"
                                  value={editWF.startDate}
                                  onChange={(v: string) =>
                                    setEditWF((p: any) => ({
                                      ...p,
                                      startDate: v,
                                    }))
                                  }
                                  type="date"
                                />
                                <div>
                                  <Field
                                    label="End Date"
                                    value={editWF.endDate}
                                    onChange={(v: string) =>
                                      setEditWF((p: any) => ({
                                        ...p,
                                        endDate: v,
                                      }))
                                    }
                                    type="date"
                                  />
                                  <label className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editWF.isCurrent || false}
                                      onChange={(e) =>
                                        setEditWF((p: any) => ({
                                          ...p,
                                          isCurrent: e.target.checked,
                                          endDate: e.target.checked
                                            ? ""
                                            : p.endDate,
                                        }))
                                      }
                                      className="rounded"
                                    />{" "}
                                    Currently working here
                                  </label>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                    Responsibilities
                                  </label>
                                  <textarea
                                    value={editWF.jobResponsibilities || ""}
                                    onChange={(e) =>
                                      setEditWF((p: any) => ({
                                        ...p,
                                        jobResponsibilities: e.target.value,
                                      }))
                                    }
                                    rows={2}
                                    className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    updateProfItem("work", w._id, editWF)
                                  }
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingWorkId(null);
                                    setEditWF({});
                                  }}
                                  className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {w.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {w.organizationName}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {fmtDate(w.startDate)} —{" "}
                                  {w.isCurrent ? (
                                    <span className="text-green-600 font-semibold">
                                      Present
                                    </span>
                                  ) : (
                                    fmtDate(w.endDate)
                                  )}
                                </p>
                                {w.jobResponsibilities && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {w.jobResponsibilities}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => startEditWork(w)}
                                  className="text-indigo-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => delProfItem("work", w._id)}
                                  className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Add New
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="Organization *"
                            value={newWork.organizationName}
                            onChange={(e) =>
                              setNewWork((p) => ({
                                ...p,
                                organizationName: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <input
                            placeholder="Job Title *"
                            value={newWork.title}
                            onChange={(e) =>
                              setNewWork((p) => ({
                                ...p,
                                title: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              Start Date *
                            </label>
                            <input
                              type="date"
                              value={newWork.startDate}
                              onChange={(e) =>
                                setNewWork((p) => ({
                                  ...p,
                                  startDate: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              End Date
                              {newWork.isCurrent && (
                                <span className="text-green-500 ml-1">
                                  (not needed)
                                </span>
                              )}
                            </label>
                            <input
                              type="date"
                              value={newWork.endDate}
                              disabled={newWork.isCurrent}
                              onChange={(e) =>
                                setNewWork((p) => ({
                                  ...p,
                                  endDate: e.target.value,
                                }))
                              }
                              className={`w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none ${newWork.isCurrent ? "opacity-40 cursor-not-allowed" : ""}`}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <textarea
                              placeholder="Job responsibilities"
                              value={newWork.jobResponsibilities}
                              onChange={(e) =>
                                setNewWork((p) => ({
                                  ...p,
                                  jobResponsibilities: e.target.value,
                                }))
                              }
                              rows={2}
                              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newWork.isCurrent}
                              onChange={(e) =>
                                setNewWork((p) => ({
                                  ...p,
                                  isCurrent: e.target.checked,
                                  endDate: e.target.checked ? "" : p.endDate,
                                }))
                              }
                              className="rounded"
                            />{" "}
                            Currently working here
                          </label>
                          <button
                            onClick={() =>
                              addProfItem("work", newWork, () =>
                                setNewWork({ ...EMPTY_WORK }),
                              )
                            }
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                          >
                            <FaPlus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* EDUCATION */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <SecHead
                    id="edu"
                    label="Education"
                    count={prof.education?.length}
                  />
                  {expandedSec === "edu" && (
                    <div className="p-4 space-y-3">
                      {(prof.education || []).map((e: any) => (
                        <div
                          key={e._id}
                          className="flex items-start justify-between gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {e.degree}
                              {e.areaOfStudy && ` in ${e.areaOfStudy}`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {e.collegeUniversity}
                            </p>
                            {e.dateCompleted && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Completed: {fmtDate(e.dateCompleted)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => delProfItem("education", e._id)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg shrink-0"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="College / University *"
                            value={newEdu.collegeUniversity}
                            onChange={(e) =>
                              setNewEdu((p) => ({
                                ...p,
                                collegeUniversity: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <input
                            placeholder="Degree *"
                            value={newEdu.degree}
                            onChange={(e) =>
                              setNewEdu((p) => ({
                                ...p,
                                degree: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <input
                            placeholder="Area of Study"
                            value={newEdu.areaOfStudy}
                            onChange={(e) =>
                              setNewEdu((p) => ({
                                ...p,
                                areaOfStudy: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              Date Completed *
                            </label>
                            <input
                              type="date"
                              value={newEdu.dateCompleted}
                              onChange={(e) =>
                                setNewEdu((p) => ({
                                  ...p,
                                  dateCompleted: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("education", newEdu, () =>
                              setNewEdu({ ...EMPTY_EDU }),
                            )
                          }
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                        >
                          <FaPlus className="w-3 h-3" /> Add Education
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* LANGUAGE SKILLS */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <SecHead
                    id="lang"
                    label="Language Skills"
                    count={prof.languages?.length}
                  />
                  {expandedSec === "lang" && (
                    <div className="p-4 space-y-3">
                      {(prof.languages || []).map((l: any) => (
                        <div
                          key={l._id}
                          className="flex items-start justify-between gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {l.language}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Speaking: {l.speakingProficiency} · Writing:{" "}
                              {l.writingProficiency} · Reading:{" "}
                              {l.readingProficiency}
                            </p>
                          </div>
                          <button
                            onClick={() => delProfItem("languages", l._id)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg shrink-0"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                        <input
                          placeholder="Language *"
                          value={newLang.language}
                          onChange={(e) =>
                            setNewLang((p) => ({
                              ...p,
                              language: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <ProfSel
                            label="Speaking"
                            value={newLang.speakingProficiency}
                            onChange={(v) =>
                              setNewLang((p) => ({
                                ...p,
                                speakingProficiency: v,
                              }))
                            }
                          />
                          <ProfSel
                            label="Writing"
                            value={newLang.writingProficiency}
                            onChange={(v) =>
                              setNewLang((p) => ({
                                ...p,
                                writingProficiency: v,
                              }))
                            }
                          />
                          <ProfSel
                            label="Reading"
                            value={newLang.readingProficiency}
                            onChange={(v) =>
                              setNewLang((p) => ({
                                ...p,
                                readingProficiency: v,
                              }))
                            }
                          />
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("languages", newLang, () =>
                              setNewLang({ ...EMPTY_LANG }),
                            )
                          }
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                        >
                          <FaPlus className="w-3 h-3" /> Add Language
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CERTIFICATIONS */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <SecHead
                    id="cert"
                    label="Certifications / Licenses"
                    count={prof.certifications?.length}
                  />
                  {expandedSec === "cert" && (
                    <div className="p-4 space-y-3">
                      {(prof.certifications || []).map((c: any) => (
                        <div
                          key={c._id}
                          className="flex items-start justify-between gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {c.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {c.institution}
                            </p>
                            <p className="text-xs text-gray-400">
                              {c.effectiveDate &&
                                `From ${fmtDate(c.effectiveDate)}`}
                              {c.effectiveDate && c.expirationDate && " · "}
                              {c.expirationDate &&
                                `Expires ${fmtDate(c.expirationDate)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => delProfItem("certifications", c._id)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg shrink-0"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="Certification Name *"
                            value={newCert.name}
                            onChange={(e) =>
                              setNewCert((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none sm:col-span-2"
                          />
                          <input
                            placeholder="Institution"
                            value={newCert.institution}
                            onChange={(e) =>
                              setNewCert((p) => ({
                                ...p,
                                institution: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none sm:col-span-2"
                          />
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              Effective Date *
                            </label>
                            <input
                              type="date"
                              value={newCert.effectiveDate}
                              onChange={(e) =>
                                setNewCert((p) => ({
                                  ...p,
                                  effectiveDate: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              value={newCert.expirationDate}
                              onChange={(e) =>
                                setNewCert((p) => ({
                                  ...p,
                                  expirationDate: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("certifications", newCert, () =>
                              setNewCert({ ...EMPTY_CERT }),
                            )
                          }
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                        >
                          <FaPlus className="w-3 h-3" /> Add Certification
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* TECHNICAL + FUNCTIONAL SKILLS */}
                {(["tech", "func"] as const).map((type) => {
                  const isT = type === "tech";
                  const key = isT ? "technicalSkills" : "functionalSkills";
                  const sec = isT ? "technical-skills" : "functional-skills";
                  const st = isT ? newTSkill : newFSkill;
                  const setSt = isT ? setNewTSkill : setNewFSkill;
                  return (
                    <div
                      key={type}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                    >
                      <SecHead
                        id={type}
                        label={isT ? "Technical Skills" : "Functional Skills"}
                        count={prof[key]?.length}
                      />
                      {expandedSec === type && (
                        <div className="p-4 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {(prof[key] || []).map((s: any) => (
                              <div
                                key={s._id}
                                className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full px-3 py-1 text-sm"
                              >
                                {s.skill}
                                <span className="text-indigo-400 text-xs">
                                  ·{s.proficiency}
                                </span>
                                <button
                                  onClick={() => delProfItem(sec, s._id)}
                                  className="text-indigo-300 hover:text-red-500 ml-1"
                                >
                                  <FaTimes className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <input
                              placeholder="Skill name *"
                              value={st.skill}
                              onChange={(e) =>
                                setSt((p: any) => ({
                                  ...p,
                                  skill: e.target.value,
                                }))
                              }
                              className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                            <select
                              value={st.proficiency}
                              onChange={(e) =>
                                setSt((p: any) => ({
                                  ...p,
                                  proficiency: e.target.value,
                                }))
                              }
                              className="w-28 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-2 py-2 text-sm bg-white focus:outline-none"
                            >
                              <option value="">Level</option>
                              {["1", "2", "3", "4", "5"].map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                addProfItem(sec, st, () =>
                                  setSt({ skill: "", proficiency: "" }),
                                )
                              }
                              className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                            >
                              <FaPlus />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* HONORS */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <SecHead
                    id="honors"
                    label="Honors / Awards / Publications"
                    count={prof.honorsAwards?.length}
                  />
                  {expandedSec === "honors" && (
                    <div className="p-4 space-y-3">
                      {(prof.honorsAwards || []).map((h: any) => (
                        <div
                          key={h._id}
                          className="flex items-start justify-between gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {h.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {h.institution}
                            </p>
                            {h.issueDate && (
                              <p className="text-xs text-gray-400">
                                {fmtDate(h.issueDate)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => delProfItem("honors", h._id)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg shrink-0"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="Title *"
                            value={newHonor.title}
                            onChange={(e) =>
                              setNewHonor((p) => ({
                                ...p,
                                title: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <input
                            placeholder="Institution"
                            value={newHonor.institution}
                            onChange={(e) =>
                              setNewHonor((p) => ({
                                ...p,
                                institution: e.target.value,
                              }))
                            }
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                          />
                          <div className="sm:col-span-2">
                            <label className="text-xs text-gray-400 mb-1 block">
                              Issue Date
                            </label>
                            <input
                              type="date"
                              value={newHonor.issueDate}
                              onChange={(e) =>
                                setNewHonor((p) => ({
                                  ...p,
                                  issueDate: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("honors", newHonor, () =>
                              setNewHonor({ ...EMPTY_HONOR }),
                            )
                          }
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                        >
                          <FaPlus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {tab === "security" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <FaLock className="text-indigo-500" /> Change Password
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (pwForm.newPw.length < 6)
                  return toast.error("Min 6 characters");
                if (pwForm.newPw !== pwForm.confirm)
                  return toast.error("Passwords do not match");
                setSavingPw(true);
                try {
                  const r = await api.patch("/auth/change-password", {
                    currentPassword: pwForm.current,
                    newPassword: pwForm.newPw,
                  });
                  toast.success(r.data.message);
                  setPwForm({ current: "", newPw: "", confirm: "" });
                } catch (e: any) {
                  toast.error(e.response?.data?.message || "Failed");
                } finally {
                  setSavingPw(false);
                }
              }}
              className="space-y-4"
            >
              {[
                {
                  key: "current",
                  label: "Current Password",
                  showKey: "curr" as const,
                },
                {
                  key: "newPw",
                  label: "New Password",
                  showKey: "new_" as const,
                },
                {
                  key: "confirm",
                  label: "Confirm Password",
                  showKey: "conf" as const,
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    {f.label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw[f.showKey] ? "text" : "password"}
                      value={(pwForm as any)[f.key]}
                      onChange={(e) =>
                        setPwForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPw((p) => ({ ...p, [f.showKey]: !p[f.showKey] }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPw[f.showKey] ? (
                        <FaEyeSlash className="w-4 h-4" />
                      ) : (
                        <FaEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={savingPw}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingPw ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
