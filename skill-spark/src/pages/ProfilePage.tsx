import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PROFICIENCY = ["", "Beginner", "Intermediate", "Advanced", "Native"];

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

  // ─── Personal state ───────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
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
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  // ─── Professional state ───────────────────────────────────────────────────
  const [prof, setProf] = useState<any>(null);
  const [loadingProf, setLoadingProf] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // New entry forms
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
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
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
      } catch {}
    };
    load();
  }, []);

  const loadProfessional = async () => {
    if (prof) return;
    setLoadingProf(true);
    try {
      const res = await api.get("/profile/professional");
      setProf(res.data.data);
    } catch {
      toast.error("Failed to load professional profile");
    } finally {
      setLoadingProf(false);
    }
  };

  useEffect(() => {
    if (tab === "professional") loadProfessional();
  }, [tab]);

  const savePersonal = async () => {
    setSavingPersonal(true);
    try {
      await api.put("/profile", personal);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingPersonal(false);
    }
  };

  const toggleNotif = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await api.put("/profile/notifications", updated);
      toast.success("Saved!");
    } catch {
      setNotifications(notifications);
      toast.error("Failed");
    }
  };

  const addProfItem = async (section: string, data: any, reset: () => void) => {
    try {
      const res = await api.post(`/profile/professional/${section}`, data);
      setProf(res.data.data);
      reset();
      toast.success("Added!");
    } catch {
      toast.error("Failed to add");
    }
  };

  const deleteProfItem = async (section: string, itemId: string) => {
    try {
      const res = await api.delete(
        `/profile/professional/${section}/${itemId}`,
      );
      setProf(res.data.data);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const SectionHeader = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="w-full flex justify-between items-center py-3 font-semibold text-sm border-b border-border"
    >
      {label} {expandedSection === id ? <FaChevronUp /> : <FaChevronDown />}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>

        {/* User card */}
        <div className="card-elevated flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {user?.name ||
                `${personal.firstName} ${personal.lastName}`.trim() ||
                "User"}
            </h2>
            <p className="text-sm text-foreground-muted">{user?.email}</p>
            <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
              {user?.subscription || "Free"} Plan
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "personal", icon: FaUser, label: "Personal Profile" },
            {
              id: "professional",
              icon: FaBriefcase,
              label: "Professional Profile",
            },
            { id: "security", icon: FaLock, label: "Security" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Personal Tab ──────────────────────────────────────────────────── */}
        {tab === "personal" && (
          <div className="space-y-4">
            <div className="card-elevated space-y-4">
              <h3 className="font-semibold">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted">
                    First Name *
                  </label>
                  <input
                    value={personal.firstName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Middle Name
                  </label>
                  <input
                    value={personal.middleName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, middleName: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Last Name *
                  </label>
                  <input
                    value={personal.lastName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Preferred Full Name *
                  </label>
                  <input
                    value={personal.preferredFullName}
                    onChange={(e) =>
                      setPersonal((p) => ({
                        ...p,
                        preferredFullName: e.target.value,
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
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
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Gender *
                  </label>
                  <select
                    value={personal.gender}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, gender: e.target.value }))
                    }
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Date of Birth *
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
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Marital Status
                  </label>
                  <select
                    value={personal.maritalStatus}
                    onChange={(e) =>
                      setPersonal((p) => ({
                        ...p,
                        maritalStatus: e.target.value,
                      }))
                    }
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
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
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Country *
                  </label>
                  <input
                    value={personal.country}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, country: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    State *
                  </label>
                  <input
                    value={personal.state}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, state: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    City *
                  </label>
                  <input
                    value={personal.city}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, city: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
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
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Pincode *
                  </label>
                  <input
                    value={personal.pincode}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, pincode: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-foreground-muted">Bio</label>
                <textarea
                  value={personal.bio}
                  onChange={(e) =>
                    setPersonal((p) => ({ ...p, bio: e.target.value }))
                  }
                  className="input-field min-h-[80px]"
                  maxLength={300}
                />
              </div>
              <button
                onClick={savePersonal}
                disabled={savingPersonal}
                className="btn-primary disabled:opacity-50"
              >
                {savingPersonal ? "Saving..." : "Save Profile"}
              </button>
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

        {/* ─── Professional Tab ──────────────────────────────────────────────── */}
        {tab === "professional" && (
          <div className="card-elevated space-y-1">
            {loadingProf && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {prof && (
              <>
                {/* Work Experience */}
                <SectionHeader id="work" label="Work Experience" />
                {expandedSection === "work" && (
                  <div className="py-3 space-y-3">
                    {prof.workExperience.map((w: any) => (
                      <div
                        key={w._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {w.title} @ {w.organizationName}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {w.isCurrent
                              ? "Current"
                              : w.endDate?.substring(0, 10)}
                          </p>
                        </div>
                        <button onClick={() => deleteProfItem("work", w._id)}>
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 pt-2">
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
                      <input
                        type="date"
                        placeholder="Start Date"
                        value={newWork.startDate}
                        onChange={(e) =>
                          setNewWork((p) => ({
                            ...p,
                            startDate: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      />
                      <input
                        type="date"
                        placeholder="End Date"
                        value={newWork.endDate}
                        onChange={(e) =>
                          setNewWork((p) => ({ ...p, endDate: e.target.value }))
                        }
                        className="input-field text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newWork.isCurrent}
                        onChange={(e) =>
                          setNewWork((p) => ({
                            ...p,
                            isCurrent: e.target.checked,
                          }))
                        }
                      />{" "}
                      Current Job
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
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}

                {/* Education */}
                <SectionHeader id="education" label="Education" />
                {expandedSection === "education" && (
                  <div className="py-3 space-y-3">
                    {prof.education.map((e: any) => (
                      <div
                        key={e._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {e.degree} in {e.areaOfStudy}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {e.collegeUniversity}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteProfItem("education", e._id)}
                        >
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <input
                        placeholder="College/University *"
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
                      <input
                        type="date"
                        placeholder="Date Completed"
                        value={newEdu.dateCompleted}
                        onChange={(e) =>
                          setNewEdu((p) => ({
                            ...p,
                            dateCompleted: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      />
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
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}

                {/* Language Skills */}
                <SectionHeader id="languages" label="Language Skills" />
                {expandedSection === "languages" && (
                  <div className="py-3 space-y-3">
                    {prof.languages.map((l: any) => (
                      <div
                        key={l._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-medium">{l.language}</p>
                          <p className="text-xs text-foreground-muted">
                            Speaking: {l.speakingProficiency} · Writing:{" "}
                            {l.writingProficiency}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteProfItem("languages", l._id)}
                        >
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 pt-2">
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
                      {(
                        [
                          "speakingProficiency",
                          "writingProficiency",
                          "readingProficiency",
                        ] as const
                      ).map((k) => (
                        <select
                          key={k}
                          value={newLang[k]}
                          onChange={(e) =>
                            setNewLang((p) => ({ ...p, [k]: e.target.value }))
                          }
                          className="input-field text-sm"
                        >
                          <option value="">
                            {k
                              .replace("Proficiency", "")
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                          </option>
                          {PROFICIENCY.filter(Boolean).map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      ))}
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
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}

                {/* Certifications */}
                <SectionHeader
                  id="certifications"
                  label="Certifications / Licenses"
                />
                {expandedSection === "certifications" && (
                  <div className="py-3 space-y-3">
                    {prof.certifications.map((c: any) => (
                      <div
                        key={c._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-foreground-muted">
                            {c.institution}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            deleteProfItem("certifications", c._id)
                          }
                        >
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 pt-2">
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
                      <input
                        type="date"
                        placeholder="Effective Date"
                        value={newCert.effectiveDate}
                        onChange={(e) =>
                          setNewCert((p) => ({
                            ...p,
                            effectiveDate: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      />
                      <input
                        type="date"
                        placeholder="Expiration Date"
                        value={newCert.expirationDate}
                        onChange={(e) =>
                          setNewCert((p) => ({
                            ...p,
                            expirationDate: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      />
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
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}

                {/* Technical Skills */}
                <SectionHeader id="technical" label="Technical Skills" />
                {expandedSection === "technical" && (
                  <div className="py-3 space-y-3">
                    {prof.technicalSkills.map((s: any) => (
                      <div
                        key={s._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-center"
                      >
                        <span className="text-sm">
                          {s.skill}{" "}
                          <span className="text-foreground-muted">
                            — {s.proficiency}
                          </span>
                        </span>
                        <button
                          onClick={() =>
                            deleteProfItem("technical-skills", s._id)
                          }
                        >
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        placeholder="Skill name *"
                        value={newTSkill.skill}
                        onChange={(e) =>
                          setNewTSkill((p) => ({ ...p, skill: e.target.value }))
                        }
                        className="input-field flex-1 text-sm"
                      />
                      <select
                        value={newTSkill.proficiency}
                        onChange={(e) =>
                          setNewTSkill((p) => ({
                            ...p,
                            proficiency: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      >
                        {["", "1", "2", "3", "4", "5"].map((v) => (
                          <option key={v} value={v}>
                            {v || "Level"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() =>
                        addProfItem("technical-skills", newTSkill, () =>
                          setNewTSkill({ skill: "", proficiency: "" }),
                        )
                      }
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}

                {/* Functional Skills */}
                <SectionHeader id="functional" label="Functional Skills" />
                {expandedSection === "functional" && (
                  <div className="py-3 space-y-3">
                    {prof.functionalSkills.map((s: any) => (
                      <div
                        key={s._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-center"
                      >
                        <span className="text-sm">
                          {s.skill}{" "}
                          <span className="text-foreground-muted">
                            — {s.proficiency}
                          </span>
                        </span>
                        <button
                          onClick={() =>
                            deleteProfItem("functional-skills", s._id)
                          }
                        >
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        placeholder="Skill name *"
                        value={newFSkill.skill}
                        onChange={(e) =>
                          setNewFSkill((p) => ({ ...p, skill: e.target.value }))
                        }
                        className="input-field flex-1 text-sm"
                      />
                      <select
                        value={newFSkill.proficiency}
                        onChange={(e) =>
                          setNewFSkill((p) => ({
                            ...p,
                            proficiency: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      >
                        {["", "1", "2", "3", "4", "5"].map((v) => (
                          <option key={v} value={v}>
                            {v || "Level"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() =>
                        addProfItem("functional-skills", newFSkill, () =>
                          setNewFSkill({ skill: "", proficiency: "" }),
                        )
                      }
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}

                {/* Honors & Awards */}
                <SectionHeader
                  id="honors"
                  label="Honors / Awards / Publications"
                />
                {expandedSection === "honors" && (
                  <div className="py-3 space-y-3">
                    {prof.honorsAwards.map((h: any) => (
                      <div
                        key={h._id}
                        className="bg-muted rounded-lg p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-medium">{h.title}</p>
                          <p className="text-xs text-foreground-muted">
                            {h.institution}
                          </p>
                        </div>
                        <button onClick={() => deleteProfItem("honors", h._id)}>
                          <FaTrash className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <input
                        placeholder="Title *"
                        value={newHonor.title}
                        onChange={(e) =>
                          setNewHonor((p) => ({ ...p, title: e.target.value }))
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
                      <input
                        type="date"
                        value={newHonor.issueDate}
                        onChange={(e) =>
                          setNewHonor((p) => ({
                            ...p,
                            issueDate: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      />
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
                      className="btn-primary text-sm py-2 flex items-center gap-1"
                    >
                      <FaPlus />
                      Add
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Security Tab ──────────────────────────────────────────────────── */}
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
                  if (
                    !confirm(
                      "Are you sure you want to log out from all devices?",
                    )
                  )
                    return;
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
