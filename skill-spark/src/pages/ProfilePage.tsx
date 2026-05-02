import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaSignOutAlt,
  FaUser,
  FaBriefcase,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaTrash,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PROFICIENCY = ["Beginner", "Intermediate", "Advanced", "Native"];
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "";

// ── Reusable "Please select" select ──────────────────────────────────────────
const SelectField = ({
  label,
  value,
  onChange,
  options,
  className = "",
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  className?: string;
  required?: boolean;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`input-field ${className}`}
  >
    <option value="">
      {label ? `Please select ${label}` : "Please select"}
    </option>
    {options.map((o) =>
      typeof o === "string" ? (
        <option key={o} value={o}>
          {o}
        </option>
      ) : (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ),
    )}
  </select>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"personal" | "professional" | "security">(
    "personal",
  );
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    curr: false,
    new_: false,
    conf: false,
  });
  const [savingPw, setSavingPw] = useState(false);

  // ── Personal info — view/edit mode ─────────────────────────────────────────
  const EMPTY_PERSONAL = {
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
  const [personal, setPersonal] = useState(EMPTY_PERSONAL);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });

  // ── Professional ───────────────────────────────────────────────────────────
  const [prof, setProf] = useState<any>(null);
  const [loadingProf, setLoadingProf] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // New-entry forms
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
  const [newFSkill, setNewFSkill] = useState({ skill: "", proficiency: "" });
  const [newTSkill, setNewTSkill] = useState({ skill: "", proficiency: "" });
  const [newHonor, setNewHonor] = useState({
    title: "",
    institution: "",
    issueDate: "",
  });

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
    if (tab === "professional") loadProfessional();
  }, [tab]);

  const loadProfessional = async () => {
    if (prof) return;
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

  const savePersonal = async () => {
    setSavingPersonal(true);
    try {
      await api.put("/profile", personal);
      setIsEditingPersonal(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingPersonal(false);
    }
  };

  const cancelEditPersonal = () => {
    setIsEditingPersonal(false);
  };

  const toggleNotif = async (key: keyof typeof notifications) => {
    const upd = { ...notifications, [key]: !notifications[key] };
    setNotifications(upd);
    try {
      await api.put("/profile/notifications", upd);
      toast.success("Saved!");
    } catch {
      setNotifications(notifications);
      toast.error("Failed");
    }
  };

  const addProfItem = async (section: string, data: any, reset: () => void) => {
    try {
      const r = await api.post(`/profile/professional/${section}`, data);
      setProf(r.data.data);
      reset();
      toast.success("Added!");
    } catch {
      toast.error("Failed to add");
    }
  };

  const deleteProfItem = async (section: string, itemId: string) => {
    try {
      const r = await api.delete(`/profile/professional/${section}/${itemId}`);
      setProf(r.data.data);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const SectionHeader = ({
    id,
    label,
    count = 0,
  }: {
    id: string;
    label: string;
    count?: number;
  }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="w-full flex justify-between items-center py-3 font-semibold text-sm border-b border-border hover:text-primary transition-colors"
    >
      <span className="flex items-center gap-2">
        {label}
        {count > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </span>
      {expandedSection === id ? (
        <FaChevronUp className="w-3 h-3" />
      ) : (
        <FaChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  // ── Display-only field ──────────────────────────────────────────────────────
  const DisplayField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-foreground-muted font-medium mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-medium ${value ? "" : "text-foreground-muted italic"}`}
      >
        {value || "Not provided"}
      </p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold">Identity</h1>

        {/* User card */}
        <div className="card-elevated flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {user?.name ||
                `${personal.firstName} ${personal.lastName}`.trim() ||
                "User"}
            </h2>
            <p className="text-sm text-foreground-muted">
              {(user as any)?.email}
            </p>
            <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
              {(user as any)?.subscription || "Free"} Plan
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "personal", icon: FaUser, label: "Personal" },
            { id: "professional", icon: FaBriefcase, label: "Professional" },
            { id: "security", icon: FaLock, label: "Security" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground-muted hover:bg-accent"
              }`}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PERSONAL TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "personal" && (
          <div className="space-y-4">
            <div className="card-elevated space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Personal Information</h3>
                {!isEditingPersonal ? (
                  <button
                    onClick={() => setIsEditingPersonal(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all border border-primary/20"
                  >
                    <FaEdit className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEditPersonal}
                      className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-all"
                    >
                      <FaTimes className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={savePersonal}
                      disabled={savingPersonal}
                      className="flex items-center gap-1.5 text-sm btn-primary py-1.5 px-3 disabled:opacity-50"
                    >
                      <FaCheck className="w-3 h-3" />{" "}
                      {savingPersonal ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {/* View mode */}
              {!isEditingPersonal && (
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="First Name" value={personal.firstName} />
                  <DisplayField
                    label="Middle Name"
                    value={personal.middleName}
                  />
                  <DisplayField label="Last Name" value={personal.lastName} />
                  <DisplayField
                    label="Preferred Full Name"
                    value={personal.preferredFullName}
                  />
                  <DisplayField
                    label="Contact Number"
                    value={personal.contactNumber}
                  />
                  <DisplayField label="Gender" value={personal.gender} />
                  <DisplayField
                    label="Date of Birth"
                    value={
                      personal.dateOfBirth
                        ? new Date(personal.dateOfBirth).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" },
                          )
                        : ""
                    }
                  />
                  <DisplayField
                    label="Marital Status"
                    value={personal.maritalStatus}
                  />
                  <DisplayField
                    label="Nationality"
                    value={personal.nationality}
                  />
                  <DisplayField label="Country" value={personal.country} />
                  <DisplayField label="State" value={personal.state} />
                  <DisplayField label="City" value={personal.city} />
                  <DisplayField
                    label="Current City"
                    value={personal.currentCity}
                  />
                  <DisplayField label="Pincode" value={personal.pincode} />
                  {personal.bio && (
                    <div className="col-span-2">
                      <p className="text-xs text-foreground-muted font-medium mb-0.5">
                        Bio
                      </p>
                      <p className="text-sm">{personal.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit mode */}
              {isEditingPersonal && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.firstName}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          firstName: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Middle Name
                    </label>
                    <input
                      value={personal.middleName}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          middleName: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.lastName}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, lastName: e.target.value }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Preferred Full Name{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.preferredFullName}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          preferredFullName: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Contact Number
                    </label>
                    <input
                      value={personal.contactNumber}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          contactNumber: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <SelectField
                      label="gender"
                      value={personal.gender}
                      onChange={(v) =>
                        setPersonal((p) => ({ ...p, gender: v }))
                      }
                      options={["Male", "Female", "Other", "Prefer not to say"]}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Date of Birth <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={personal.dateOfBirth}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          dateOfBirth: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Marital Status
                    </label>
                    <SelectField
                      label="marital status"
                      value={personal.maritalStatus}
                      onChange={(v) =>
                        setPersonal((p) => ({ ...p, maritalStatus: v }))
                      }
                      options={["Single", "Married", "Divorced", "Widowed"]}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Nationality
                    </label>
                    <input
                      value={personal.nationality}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          nationality: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Country <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.country}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, country: e.target.value }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      State <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.state}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, state: e.target.value }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      City <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.city}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, city: e.target.value }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Current City
                    </label>
                    <input
                      value={personal.currentCity}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          currentCity: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Pincode <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={personal.pincode}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, pincode: e.target.value }))
                      }
                      className="input-field mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-foreground-muted font-medium">
                      Bio
                    </label>
                    <textarea
                      value={personal.bio}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, bio: e.target.value }))
                      }
                      className="input-field min-h-[80px] mt-1"
                      maxLength={300}
                    />
                    <p className="text-xs text-foreground-muted mt-1 text-right">
                      {personal.bio.length}/300
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="card-elevated">
              <h3 className="font-semibold mb-4">Notifications</h3>
              <div className="space-y-3">
                {(
                  [
                    { key: "email", label: "Email notifications" },
                    { key: "push", label: "Push notifications" },
                    { key: "weekly", label: "Weekly digest" },
                  ] as const
                ).map((n) => (
                  <label
                    key={n.key}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm">{n.label}</span>
                    <button
                      onClick={() => toggleNotif(n.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${notifications[n.key] ? "bg-primary" : "bg-muted"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card transition-transform ${notifications[n.key] ? "translate-x-5" : ""}`}
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
              className="flex items-center gap-2 text-destructive hover:underline font-medium"
            >
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PROFESSIONAL TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "professional" && (
          <div className="card-elevated space-y-1">
            {loadingProf && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {prof && (
              <>
                {/* ── Work Experience ──────────────────────────────────── */}
                <SectionHeader
                  id="work"
                  label="Work Experience"
                  count={prof.workExperience?.length}
                />
                {expandedSection === "work" && (
                  <div className="py-3 space-y-3">
                    {(prof.workExperience || []).map((w: any) => (
                      <div
                        key={w._id}
                        className="bg-muted rounded-xl p-3 flex justify-between items-start"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{w.title}</p>
                          <p className="text-xs text-foreground-muted">
                            {w.organizationName}
                          </p>
                          {/* FIX: Show start date → end date (or "Present") */}
                          <p className="text-xs text-foreground-muted mt-1">
                            {fmtDate(w.startDate)}
                            {w.startDate && " — "}
                            {w.isCurrent ? (
                              <span className="text-success font-medium">
                                Present
                              </span>
                            ) : w.endDate ? (
                              fmtDate(w.endDate)
                            ) : (
                              <span className="opacity-50">
                                End date not set
                              </span>
                            )}
                          </p>
                          {w.jobResponsibilities && (
                            <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                              {w.jobResponsibilities}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteProfItem("work", w._id)}
                          className="ml-3 shrink-0"
                        >
                          <FaTrash className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                        </button>
                      </div>
                    ))}

                    {/* Add form */}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                        Add New
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Organization *"
                          value={newWork.organizationName}
                          onChange={(e) =>
                            setNewWork((p) => ({
                              ...p,
                              organizationName: e.target.value,
                            }))
                          }
                          className="input-field text-sm"
                        />
                        <input
                          placeholder="Job Title *"
                          value={newWork.title}
                          onChange={(e) =>
                            setNewWork((p) => ({ ...p, title: e.target.value }))
                          }
                          className="input-field text-sm"
                        />
                        <div>
                          <label className="text-xs text-foreground-muted">
                            Start Date
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
                            className="input-field text-sm mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-foreground-muted">
                            End Date{" "}
                            {newWork.isCurrent && (
                              <span className="text-success">
                                (not required — Current)
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
                            className={`input-field text-sm mt-1 ${newWork.isCurrent ? "opacity-40 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <textarea
                            placeholder="Job responsibilities (optional)"
                            value={newWork.jobResponsibilities}
                            onChange={(e) =>
                              setNewWork((p) => ({
                                ...p,
                                jobResponsibilities: e.target.value,
                              }))
                            }
                            className="input-field text-sm min-h-[60px]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
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
                          className="btn-primary text-sm py-2 flex items-center gap-1.5 ml-auto"
                        >
                          <FaPlus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Education ────────────────────────────────────────── */}
                <SectionHeader
                  id="education"
                  label="Education"
                  count={prof.education?.length}
                />
                {expandedSection === "education" && (
                  <div className="py-3 space-y-3">
                    {(prof.education || []).map((e: any) => (
                      <div
                        key={e._id}
                        className="bg-muted rounded-xl p-3 flex justify-between items-start"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">
                            {e.degree} {e.areaOfStudy && `in ${e.areaOfStudy}`}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {e.collegeUniversity}
                          </p>
                          {e.dateCompleted && (
                            <p className="text-xs text-foreground-muted mt-0.5">
                              Completed: {fmtDate(e.dateCompleted)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteProfItem("education", e._id)}
                          className="ml-3 shrink-0"
                        >
                          <FaTrash className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                        Add New
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="College / University *"
                          value={newEdu.collegeUniversity}
                          onChange={(e) =>
                            setNewEdu((p) => ({
                              ...p,
                              collegeUniversity: e.target.value,
                            }))
                          }
                          className="input-field text-sm"
                        />
                        <input
                          placeholder="Degree *"
                          value={newEdu.degree}
                          onChange={(e) =>
                            setNewEdu((p) => ({ ...p, degree: e.target.value }))
                          }
                          className="input-field text-sm"
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
                          className="input-field text-sm"
                        />
                        <div>
                          <label className="text-xs text-foreground-muted">
                            Date Completed
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
                            className="input-field text-sm mt-1"
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
                        className="btn-primary text-sm py-2 flex items-center gap-1.5 mt-2"
                      >
                        <FaPlus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Language Skills ───────────────────────────────────── */}
                <SectionHeader
                  id="languages"
                  label="Language Skills"
                  count={prof.languages?.length}
                />
                {expandedSection === "languages" && (
                  <div className="py-3 space-y-3">
                    {(prof.languages || []).map((l: any) => (
                      <div
                        key={l._id}
                        className="bg-muted rounded-xl p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-semibold">{l.language}</p>
                          <p className="text-xs text-foreground-muted">
                            Speaking: {l.speakingProficiency} · Writing:{" "}
                            {l.writingProficiency} · Reading:{" "}
                            {l.readingProficiency}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteProfItem("languages", l._id)}
                          className="ml-3 shrink-0"
                        >
                          <FaTrash className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                        Add New
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Language *"
                          value={newLang.language}
                          onChange={(e) =>
                            setNewLang((p) => ({
                              ...p,
                              language: e.target.value,
                            }))
                          }
                          className="input-field text-sm"
                        />
                        <SelectField
                          label="speaking proficiency"
                          value={newLang.speakingProficiency}
                          onChange={(v) =>
                            setNewLang((p) => ({
                              ...p,
                              speakingProficiency: v,
                            }))
                          }
                          options={PROFICIENCY}
                        />
                        <SelectField
                          label="writing proficiency"
                          value={newLang.writingProficiency}
                          onChange={(v) =>
                            setNewLang((p) => ({ ...p, writingProficiency: v }))
                          }
                          options={PROFICIENCY}
                        />
                        <SelectField
                          label="reading proficiency"
                          value={newLang.readingProficiency}
                          onChange={(v) =>
                            setNewLang((p) => ({ ...p, readingProficiency: v }))
                          }
                          options={PROFICIENCY}
                        />
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
                        className="btn-primary text-sm py-2 flex items-center gap-1.5 mt-2"
                      >
                        <FaPlus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Certifications ────────────────────────────────────── */}
                <SectionHeader
                  id="certifications"
                  label="Certifications / Licenses"
                  count={prof.certifications?.length}
                />
                {expandedSection === "certifications" && (
                  <div className="py-3 space-y-3">
                    {(prof.certifications || []).map((c: any) => (
                      <div
                        key={c._id}
                        className="bg-muted rounded-xl p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-semibold">{c.name}</p>
                          <p className="text-xs text-foreground-muted">
                            {c.institution}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {c.effectiveDate &&
                              `From ${fmtDate(c.effectiveDate)}`}
                            {c.effectiveDate && c.expirationDate && " · "}
                            {c.expirationDate &&
                              `Expires ${fmtDate(c.expirationDate)}`}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            deleteProfItem("certifications", c._id)
                          }
                          className="ml-3 shrink-0"
                        >
                          <FaTrash className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                        Add New
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Certification Name *"
                          value={newCert.name}
                          onChange={(e) =>
                            setNewCert((p) => ({ ...p, name: e.target.value }))
                          }
                          className="input-field text-sm"
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
                          className="input-field text-sm"
                        />
                        <div>
                          <label className="text-xs text-foreground-muted">
                            Effective Date
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
                            className="input-field text-sm mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-foreground-muted">
                            Expiration Date
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
                            className="input-field text-sm mt-1"
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
                        className="btn-primary text-sm py-2 flex items-center gap-1.5 mt-2"
                      >
                        <FaPlus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Technical Skills ──────────────────────────────────── */}
                <SectionHeader
                  id="technical"
                  label="Technical Skills"
                  count={prof.technicalSkills?.length}
                />
                {expandedSection === "technical" && (
                  <div className="py-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(prof.technicalSkills || []).map((s: any) => (
                        <div
                          key={s._id}
                          className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5"
                        >
                          <span className="text-sm">{s.skill}</span>
                          <span className="text-xs text-foreground-muted">
                            — {s.proficiency}
                          </span>
                          <button
                            onClick={() =>
                              deleteProfItem("technical-skills", s._id)
                            }
                            className="text-foreground-muted hover:text-destructive ml-1"
                          >
                            <FaTimes className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-3 flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-foreground-muted">
                          Skill name *
                        </label>
                        <input
                          value={newTSkill.skill}
                          onChange={(e) =>
                            setNewTSkill((p) => ({
                              ...p,
                              skill: e.target.value,
                            }))
                          }
                          className="input-field text-sm mt-1"
                        />
                      </div>
                      <div className="w-40">
                        <label className="text-xs text-foreground-muted">
                          Level
                        </label>
                        <SelectField
                          label="level"
                          value={newTSkill.proficiency}
                          onChange={(v) =>
                            setNewTSkill((p) => ({ ...p, proficiency: v }))
                          }
                          options={["1", "2", "3", "4", "5"]}
                          className="text-sm mt-1"
                        />
                      </div>
                      <button
                        onClick={() =>
                          addProfItem("technical-skills", newTSkill, () =>
                            setNewTSkill({ skill: "", proficiency: "" }),
                          )
                        }
                        className="btn-primary text-sm py-2.5 px-4 flex items-center gap-1"
                      >
                        <FaPlus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Functional Skills ─────────────────────────────────── */}
                <SectionHeader
                  id="functional"
                  label="Functional Skills"
                  count={prof.functionalSkills?.length}
                />
                {expandedSection === "functional" && (
                  <div className="py-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(prof.functionalSkills || []).map((s: any) => (
                        <div
                          key={s._id}
                          className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5"
                        >
                          <span className="text-sm">{s.skill}</span>
                          <span className="text-xs text-foreground-muted">
                            — {s.proficiency}
                          </span>
                          <button
                            onClick={() =>
                              deleteProfItem("functional-skills", s._id)
                            }
                            className="text-foreground-muted hover:text-destructive ml-1"
                          >
                            <FaTimes className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-3 flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-foreground-muted">
                          Skill name *
                        </label>
                        <input
                          value={newFSkill.skill}
                          onChange={(e) =>
                            setNewFSkill((p) => ({
                              ...p,
                              skill: e.target.value,
                            }))
                          }
                          className="input-field text-sm mt-1"
                        />
                      </div>
                      <div className="w-40">
                        <label className="text-xs text-foreground-muted">
                          Level
                        </label>
                        <SelectField
                          label="level"
                          value={newFSkill.proficiency}
                          onChange={(v) =>
                            setNewFSkill((p) => ({ ...p, proficiency: v }))
                          }
                          options={["1", "2", "3", "4", "5"]}
                          className="text-sm mt-1"
                        />
                      </div>
                      <button
                        onClick={() =>
                          addProfItem("functional-skills", newFSkill, () =>
                            setNewFSkill({ skill: "", proficiency: "" }),
                          )
                        }
                        className="btn-primary text-sm py-2.5 px-4 flex items-center gap-1"
                      >
                        <FaPlus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Honors & Awards ───────────────────────────────────── */}
                <SectionHeader
                  id="honors"
                  label="Honors / Awards / Publications"
                  count={prof.honorsAwards?.length}
                />
                {expandedSection === "honors" && (
                  <div className="py-3 space-y-3">
                    {(prof.honorsAwards || []).map((h: any) => (
                      <div
                        key={h._id}
                        className="bg-muted rounded-xl p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-semibold">{h.title}</p>
                          <p className="text-xs text-foreground-muted">
                            {h.institution}
                          </p>
                          {h.issueDate && (
                            <p className="text-xs text-foreground-muted">
                              {fmtDate(h.issueDate)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteProfItem("honors", h._id)}
                          className="ml-3 shrink-0"
                        >
                          <FaTrash className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                        Add New
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Title *"
                          value={newHonor.title}
                          onChange={(e) =>
                            setNewHonor((p) => ({
                              ...p,
                              title: e.target.value,
                            }))
                          }
                          className="input-field text-sm"
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
                          className="input-field text-sm"
                        />
                        <div>
                          <label className="text-xs text-foreground-muted">
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
                            className="input-field text-sm mt-1"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          addProfItem("honors", newHonor, () =>
                            setNewHonor({
                              title: "",
                              institution: "",
                              issueDate: "",
                            }),
                          )
                        }
                        className="btn-primary text-sm py-2 flex items-center gap-1.5 mt-2"
                      >
                        <FaPlus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECURITY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "security" && (
          <div className="space-y-4">
            <div className="card-elevated">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FaLock className="text-primary" /> Change Password
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (pwForm.newPw.length < 6)
                    return toast.error(
                      "Password must be at least 6 characters",
                    );
                  if (pwForm.newPw !== pwForm.confirm)
                    return toast.error("Passwords do not match");
                  setSavingPw(true);
                  try {
                    const res = await api.patch("/auth/change-password", {
                      currentPassword: pwForm.current,
                      newPassword: pwForm.newPw,
                    });
                    toast.success(res.data.message);
                    setPwForm({ current: "", newPw: "", confirm: "" });
                  } catch (e: any) {
                    toast.error(
                      e.response?.data?.message || "Failed to change password",
                    );
                  } finally {
                    setSavingPw(false);
                  }
                }}
                className="space-y-3"
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
                    label: "Confirm New Password",
                    showKey: "conf" as const,
                  },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-foreground-muted font-medium">
                      {field.label}
                    </label>
                    <div className="relative mt-1">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted w-3.5 h-3.5" />
                      <input
                        type={showPw[field.showKey] ? "text" : "password"}
                        value={(pwForm as any)[field.key]}
                        onChange={(e) =>
                          setPwForm((p) => ({
                            ...p,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="input-field pl-11 pr-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPw((p) => ({
                            ...p,
                            [field.showKey]: !p[field.showKey],
                          }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                      >
                        {showPw[field.showKey] ? (
                          <FaEyeSlash className="w-3.5 h-3.5" />
                        ) : (
                          <FaEye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {pwForm.newPw.length > 0 && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            pwForm.newPw.length >= i * 3
                              ? i <= 1
                                ? "bg-destructive"
                                : i <= 2
                                  ? "bg-secondary"
                                  : i <= 3
                                    ? "bg-blue-400"
                                    : "bg-success"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-foreground-muted">
                      {pwForm.newPw.length < 6
                        ? "Too short"
                        : pwForm.newPw.length < 9
                          ? "Weak"
                          : pwForm.newPw.length < 12
                            ? "Good"
                            : "Strong"}
                    </p>
                  </div>
                )}
                {pwForm.confirm.length > 0 && (
                  <p
                    className={`text-xs ${pwForm.newPw === pwForm.confirm ? "text-success" : "text-destructive"}`}
                  >
                    {pwForm.newPw === pwForm.confirm
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingPw}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {savingPw ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
            <div className="card-elevated border-l-4 border-l-destructive">
              <h3 className="font-semibold text-destructive mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-foreground-muted mb-3">
                These actions are permanent and cannot be undone.
              </p>
              <button
                onClick={async () => {
                  if (!confirm("Sign out?")) return;
                  logout();
                  navigate("/login");
                }}
                className="text-sm text-destructive border border-destructive px-4 py-2 rounded-lg hover:bg-destructive/10 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
