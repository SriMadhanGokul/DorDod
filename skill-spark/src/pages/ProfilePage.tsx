import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PROFICIENCY = [
  "Please select",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Fluent",
  "Native",
];

const fmtFullDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const LabelValue = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-start gap-2 min-w-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-36">
      {label}
    </span>
    <span className="text-sm font-medium text-gray-800">
      {value || <span className="text-gray-300 italic">Not provided</span>}
    </span>
  </div>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"personal" | "professional" | "security">(
    "personal",
  );

  // Personal
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
  const [isEditingPersonal, setEditP] = useState(false);
  const [savingPersonal, setSavingP] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });

  // Professional
  const [prof, setProf] = useState<any>(null);
  const [loadingProf, setLoadingP] = useState(false);
  const [expandedSec, setExpSec] = useState<string | null>("work");

  // Add forms
  const [newWork, setNewWork] = useState({
    isCurrent: false,
    organizationName: "",
    title: "",
    startDate: "",
    endDate: "",
    jobResponsibilities: "",
  });
  const [newEdu, setNewEdu] = useState({
    collegeUniversity: "",
    degree: "",
    areaOfStudy: "",
    degreeCompleted: false,
    dateCompleted: "",
  });
  const [newLang, setNewLang] = useState({
    language: "",
    speakingProficiency: "",
    writingProficiency: "",
    readingProficiency: "",
  });
  const [newCert, setNewCert] = useState({
    name: "",
    institution: "",
    effectiveDate: "",
    expirationDate: "",
  });
  const [newTSkill, setNewTSkill] = useState({ skill: "", proficiency: "" });
  const [newFSkill, setNewFSkill] = useState({ skill: "", proficiency: "" });
  const [newHonor, setNewHonor] = useState({
    title: "",
    institution: "",
    issueDate: "",
  });

  // Edit work form
  const [editWork, setEditWork] = useState<any>(null);
  const [editWorkForm, setEditWF] = useState<any>({});

  // Security
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    curr: false,
    new_: false,
    conf: false,
  });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const u = res.data.user;
        setPersonal({
          firstName: u.firstName || "",
          middleName: u.middleName || "",
          lastName: u.lastName || "",
          preferredFullName: u.preferredFullName || "",
          contactNumber: u.contactNumber || "",
          gender: u.gender || "",
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : "",
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
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "professional" && !prof) loadProfessional();
  }, [tab]);

  const loadProfessional = async () => {
    setLoadingP(true);
    try {
      const r = await api.get("/profile/professional");
      setProf(r.data.data);
    } catch {
      toast.error("Failed to load professional profile");
    } finally {
      setLoadingP(false);
    }
  };

  const savePersonal = async () => {
    if (!personal.firstName.trim())
      return toast.error("First name is required");
    if (!personal.lastName.trim()) return toast.error("Last name is required");
    setSavingP(true);
    try {
      await api.put("/profile", personal);
      setEditP(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingP(false);
    }
  };

  const addProfItem = async (section: string, data: any, reset: () => void) => {
    try {
      const r = await api.post(`/profile/professional/${section}`, data);
      setProf(r.data.data);
      reset();
      toast.success("Added!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to add");
    }
  };

  const delProfItem = async (section: string, id: string) => {
    try {
      const r = await api.delete(`/profile/professional/${section}/${id}`);
      setProf(r.data.data);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const updateProfItem = async (section: string, id: string, data: any) => {
    try {
      const r = await api.put(`/profile/professional/${section}/${id}`, data);
      setProf(r.data.data);
      toast.success("Updated!");
      setEditWork(null);
    } catch {
      toast.error("Failed to update");
    }
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
      className="w-full flex justify-between items-center py-3 px-4 font-semibold text-sm bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
    >
      <span className="flex items-center gap-2 text-gray-800">
        {label}
        {count > 0 && (
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
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

  const Input = ({
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
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );

  const Select = ({
    label,
    value,
    onChange,
    options,
    required = false,
  }: any) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
      >
        <option value="">Please select</option>
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Identity</h1>

        {/* User card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {user?.name ||
                `${personal.firstName} ${personal.lastName}`.trim() ||
                "User"}
            </h2>
            <p className="text-sm text-gray-500">{(user as any)?.email}</p>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">
              {(user as any)?.subscription || "Free"} Plan
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "personal", label: "Personal" },
            { id: "professional", label: "Professional" },
            { id: "security", label: "Security" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PERSONAL TAB ─────────────────────────────────────────────── */}
        {tab === "personal" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">
                  Personal Information
                </h3>
                {!isEditingPersonal ? (
                  <button
                    onClick={() => setEditP(true)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
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
                      disabled={savingPersonal}
                      className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      <FaCheck className="w-3 h-3" />{" "}
                      {savingPersonal ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {/* VIEW MODE — horizontal label: value layout */}
              {!isEditingPersonal && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <LabelValue label="First Name" value={personal.firstName} />
                    <LabelValue
                      label="Middle Name"
                      value={personal.middleName}
                    />
                    <LabelValue label="Last Name" value={personal.lastName} />
                    <LabelValue
                      label="Preferred Name"
                      value={personal.preferredFullName}
                    />
                    <LabelValue
                      label="Contact"
                      value={personal.contactNumber}
                    />
                    <LabelValue label="Gender" value={personal.gender} />
                    <LabelValue
                      label="Date of Birth"
                      value={
                        personal.dateOfBirth
                          ? fmtFullDate(personal.dateOfBirth)
                          : ""
                      }
                    />
                    <LabelValue
                      label="Marital Status"
                      value={personal.maritalStatus}
                    />
                    <LabelValue
                      label="Nationality"
                      value={personal.nationality}
                    />
                    <LabelValue label="Country" value={personal.country} />
                    <LabelValue label="State" value={personal.state} />
                    <LabelValue label="City" value={personal.city} />
                    <LabelValue
                      label="Current City"
                      value={personal.currentCity}
                    />
                    <LabelValue label="Pincode" value={personal.pincode} />
                  </div>
                  {personal.bio && (
                    <div className="pt-2 border-t border-gray-100">
                      <LabelValue label="Bio" value={personal.bio} />
                    </div>
                  )}
                </div>
              )}

              {/* EDIT MODE */}
              {isEditingPersonal && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={personal.firstName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, firstName: v }))
                    }
                    required
                  />
                  <Input
                    label="Middle Name"
                    value={personal.middleName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, middleName: v }))
                    }
                  />
                  <Input
                    label="Last Name"
                    value={personal.lastName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, lastName: v }))
                    }
                    required
                  />
                  <Input
                    label="Preferred Name"
                    value={personal.preferredFullName}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, preferredFullName: v }))
                    }
                    required
                  />
                  <Input
                    label="Contact"
                    value={personal.contactNumber}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, contactNumber: v }))
                    }
                  />
                  <Select
                    label="Gender"
                    value={personal.gender}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, gender: v }))
                    }
                    options={["Male", "Female", "Other", "Prefer not to say"]}
                    required
                  />
                  <Input
                    label="Date of Birth"
                    value={personal.dateOfBirth}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, dateOfBirth: v }))
                    }
                    type="date"
                    required
                  />
                  <Select
                    label="Marital Status"
                    value={personal.maritalStatus}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, maritalStatus: v }))
                    }
                    options={["Single", "Married", "Divorced", "Widowed"]}
                  />
                  <Input
                    label="Nationality"
                    value={personal.nationality}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, nationality: v }))
                    }
                  />
                  <Input
                    label="Country"
                    value={personal.country}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, country: v }))
                    }
                    required
                  />
                  <Input
                    label="State"
                    value={personal.state}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, state: v }))
                    }
                    required
                  />
                  <Input
                    label="City"
                    value={personal.city}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, city: v }))
                    }
                    required
                  />
                  <Input
                    label="Current City"
                    value={personal.currentCity}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, currentCity: v }))
                    }
                  />
                  <Input
                    label="Pincode"
                    value={personal.pincode}
                    onChange={(v: string) =>
                      setPersonal((p) => ({ ...p, pincode: v }))
                    }
                    required
                  />
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      Bio
                    </label>
                    <textarea
                      value={personal.bio}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, bio: e.target.value }))
                      }
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-400 text-right mt-1">
                      {personal.bio.length}/300
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Notifications</h3>
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
                    <span className="text-sm text-gray-700">{n.label}</span>
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
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${notifications[n.key as keyof typeof notifications] ? "translate-x-5" : ""}`}
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

        {/* ── PROFESSIONAL TAB ─────────────────────────────────────────── */}
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                          className="border border-gray-100 rounded-xl p-4"
                        >
                          {editWork === w._id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  label="Organization *"
                                  value={editWorkForm.organizationName}
                                  onChange={(v: string) =>
                                    setEditWF((p: any) => ({
                                      ...p,
                                      organizationName: v,
                                    }))
                                  }
                                />
                                <Input
                                  label="Job Title *"
                                  value={editWorkForm.title}
                                  onChange={(v: string) =>
                                    setEditWF((p: any) => ({ ...p, title: v }))
                                  }
                                />
                                <Input
                                  label="Start Date *"
                                  value={editWorkForm.startDate}
                                  onChange={(v: string) =>
                                    setEditWF((p: any) => ({
                                      ...p,
                                      startDate: v,
                                    }))
                                  }
                                  type="date"
                                />
                                <div>
                                  <Input
                                    label="End Date"
                                    value={editWorkForm.endDate}
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
                                      checked={editWorkForm.isCurrent}
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
                                    />
                                    Currently working here
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                  Responsibilities
                                </label>
                                <textarea
                                  value={editWorkForm.jobResponsibilities}
                                  onChange={(e) =>
                                    setEditWF((p: any) => ({
                                      ...p,
                                      jobResponsibilities: e.target.value,
                                    }))
                                  }
                                  rows={2}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    updateProfItem("work", w._id, editWorkForm)
                                  }
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditWork(null)}
                                  className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {w.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {w.organizationName}
                                </p>
                                {/* Full date with day month year */}
                                <p className="text-xs text-gray-400 mt-1">
                                  {fmtFullDate(w.startDate)} —{" "}
                                  {w.isCurrent ? (
                                    <span className="text-green-600 font-semibold">
                                      Present
                                    </span>
                                  ) : (
                                    fmtFullDate(w.endDate) || (
                                      <span className="text-gray-300 italic">
                                        End date not set
                                      </span>
                                    )
                                  )}
                                </p>
                                {w.jobResponsibilities && (
                                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                                    {w.jobResponsibilities}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 ml-3">
                                <button
                                  onClick={() => {
                                    setEditWork(w._id);
                                    setEditWF({
                                      organizationName: w.organizationName,
                                      title: w.title,
                                      startDate:
                                        w.startDate?.slice(0, 10) || "",
                                      endDate: w.endDate?.slice(0, 10) || "",
                                      isCurrent: w.isCurrent || false,
                                      jobResponsibilities:
                                        w.jobResponsibilities || "",
                                    });
                                  }}
                                  className="text-indigo-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => delProfItem("work", w._id)}
                                  className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Add form */}
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Add New
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="Organization *"
                            value={newWork.organizationName}
                            onChange={(e) =>
                              setNewWork((p) => ({
                                ...p,
                                organizationName: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
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
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
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
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              End Date{" "}
                              {newWork.isCurrent && (
                                <span className="text-green-500">
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
                              className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none ${newWork.isCurrent ? "opacity-40 cursor-not-allowed" : ""}`}
                            />
                          </div>
                          <div className="col-span-2">
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
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
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
                            />
                            Currently working here
                          </label>
                          <button
                            onClick={() =>
                              addProfItem("work", newWork, () =>
                                setNewWork({
                                  isCurrent: false,
                                  organizationName: "",
                                  title: "",
                                  startDate: "",
                                  endDate: "",
                                  jobResponsibilities: "",
                                }),
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                          className="flex items-start justify-between border border-gray-100 rounded-xl p-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {e.degree}
                              {e.areaOfStudy && ` in ${e.areaOfStudy}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {e.collegeUniversity}
                            </p>
                            {e.dateCompleted && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Completed: {fmtFullDate(e.dateCompleted)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => delProfItem("education", e._id)}
                            className="text-red-400 hover:text-red-600 p-1.5"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="College / University *"
                            value={newEdu.collegeUniversity}
                            onChange={(e) =>
                              setNewEdu((p) => ({
                                ...p,
                                collegeUniversity: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
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
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
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
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
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
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("education", newEdu, () =>
                              setNewEdu({
                                collegeUniversity: "",
                                degree: "",
                                areaOfStudy: "",
                                degreeCompleted: false,
                                dateCompleted: "",
                              }),
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                          className="flex items-start justify-between border border-gray-100 rounded-xl p-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
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
                            className="text-red-400 hover:text-red-600 p-1.5"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="Language *"
                            value={newLang.language}
                            onChange={(e) =>
                              setNewLang((p) => ({
                                ...p,
                                language: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"
                          />
                          <select
                            value={newLang.speakingProficiency}
                            onChange={(e) =>
                              setNewLang((p) => ({
                                ...p,
                                speakingProficiency: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
                          >
                            {PROFICIENCY.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                          <select
                            value={newLang.writingProficiency}
                            onChange={(e) =>
                              setNewLang((p) => ({
                                ...p,
                                writingProficiency: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
                          >
                            {PROFICIENCY.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                          <select
                            value={newLang.readingProficiency}
                            onChange={(e) =>
                              setNewLang((p) => ({
                                ...p,
                                readingProficiency: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
                          >
                            {PROFICIENCY.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("languages", newLang, () =>
                              setNewLang({
                                language: "",
                                speakingProficiency: "",
                                writingProficiency: "",
                                readingProficiency: "",
                              }),
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                          className="flex items-start justify-between border border-gray-100 rounded-xl p-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {c.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {c.institution}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {c.effectiveDate &&
                                `From ${fmtFullDate(c.effectiveDate)}`}
                              {c.effectiveDate && c.expirationDate && " · "}
                              {c.expirationDate &&
                                `Expires ${fmtFullDate(c.expirationDate)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => delProfItem("certifications", c._id)}
                            className="text-red-400 hover:text-red-600 p-1.5"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            placeholder="Certification Name *"
                            value={newCert.name}
                            onChange={(e) =>
                              setNewCert((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"
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
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"
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
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                              Expiry Date *
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
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            addProfItem("certifications", newCert, () =>
                              setNewCert({
                                name: "",
                                institution: "",
                                effectiveDate: "",
                                expirationDate: "",
                              }),
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

                {/* TECHNICAL SKILLS */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead
                    id="tech"
                    label="Technical Skills"
                    count={prof.technicalSkills?.length}
                  />
                  {expandedSec === "tech" && (
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(prof.technicalSkills || []).map((s: any) => (
                          <div
                            key={s._id}
                            className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-sm"
                          >
                            {s.skill}{" "}
                            <span className="text-indigo-400">
                              ·{s.proficiency}
                            </span>
                            <button
                              onClick={() =>
                                delProfItem("technical-skills", s._id)
                              }
                              className="text-indigo-300 hover:text-red-500 ml-1"
                            >
                              <FaTimes className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input
                          placeholder="Skill name *"
                          value={newTSkill.skill}
                          onChange={(e) =>
                            setNewTSkill((p) => ({
                              ...p,
                              skill: e.target.value,
                            }))
                          }
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                        <select
                          value={newTSkill.proficiency}
                          onChange={(e) =>
                            setNewTSkill((p) => ({
                              ...p,
                              proficiency: e.target.value,
                            }))
                          }
                          className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
                        >
                          <option value="">Level</option>
                          {["1", "2", "3", "4", "5"].map((l) => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            addProfItem("technical-skills", newTSkill, () =>
                              setNewTSkill({ skill: "", proficiency: "" }),
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

                {/* FUNCTIONAL SKILLS */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead
                    id="func"
                    label="Functional Skills"
                    count={prof.functionalSkills?.length}
                  />
                  {expandedSec === "func" && (
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(prof.functionalSkills || []).map((s: any) => (
                          <div
                            key={s._id}
                            className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-full px-3 py-1 text-sm"
                          >
                            {s.skill}{" "}
                            <span className="text-purple-400">
                              ·{s.proficiency}
                            </span>
                            <button
                              onClick={() =>
                                delProfItem("functional-skills", s._id)
                              }
                              className="text-purple-300 hover:text-red-500 ml-1"
                            >
                              <FaTimes className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input
                          placeholder="Skill name *"
                          value={newFSkill.skill}
                          onChange={(e) =>
                            setNewFSkill((p) => ({
                              ...p,
                              skill: e.target.value,
                            }))
                          }
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                        <select
                          value={newFSkill.proficiency}
                          onChange={(e) =>
                            setNewFSkill((p) => ({
                              ...p,
                              proficiency: e.target.value,
                            }))
                          }
                          className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
                        >
                          <option value="">Level</option>
                          {["1", "2", "3", "4", "5"].map((l) => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            addProfItem("functional-skills", newFSkill, () =>
                              setNewFSkill({ skill: "", proficiency: "" }),
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
              </>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ─────────────────────────────────────────────── */}
        {tab === "security" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
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
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
