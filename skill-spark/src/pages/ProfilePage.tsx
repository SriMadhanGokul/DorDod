import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  FaSignOutAlt, FaEdit, FaPlus, FaTrash, FaTimes, FaCheck,
  FaLock, FaEye, FaEyeSlash, FaChevronDown, FaChevronUp,
  FaCamera, FaDownload, FaStar, FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const PROFICIENCY = ['Please select', 'Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];
const fmtDate = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—';

const LV = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-36 pt-0.5">{label}</span>
    <span className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300 italic">Not provided</span>}</span>
  </div>
);

// ── Profile Score Ring ───────────────────────────────────────────────────────
function ScoreRing({ score, label }: { score: number; label: string }) {
  const size = 100; const r = 38; const circ = 2 * Math.PI * r;
  const off  = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1s ease' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
      <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
        score >= 80 ? 'bg-green-100 text-green-700' :
        score >= 60 ? 'bg-blue-100 text-blue-700' :
        score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
      }`}>{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'personal' | 'professional' | 'security'>('personal');

  // Avatar
  const [avatar, setAvatar]           = useState((user as any)?.avatar || '');
  const [uploadingAvatar, setUpAvatar] = useState(false);

  // Profile score
  const [scoreData, setScoreData]     = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // Personal
  const EMPTY_P = {
    firstName:'', middleName:'', lastName:'', preferredFullName:'',
    contactNumber:'', gender:'', dateOfBirth:'', maritalStatus:'',
    nationality:'', country:'', state:'', city:'', currentCity:'', pincode:'', bio:'',
  };
  const [personal, setPersonal]         = useState(EMPTY_P);
  const [isEditingP, setEditP]          = useState(false);
  const [savingP, setSavingP]           = useState(false);
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true });

  // Professional
  const [prof, setProf]               = useState<any>(null);
  const [loadingProf, setLoadingProf]  = useState(false);
  const [expandedSec, setExpSec]       = useState<string | null>('work');

  // Add forms
  const [newWork,   setNewWork]   = useState({ isCurrent: false, organizationName: '', title: '', startDate: '', endDate: '', jobResponsibilities: '' });
  const [newEdu,    setNewEdu]    = useState({ collegeUniversity: '', degree: '', areaOfStudy: '', degreeCompleted: false, dateCompleted: '' });
  const [newLang,   setNewLang]   = useState({ language: '', speakingProficiency: '', writingProficiency: '', readingProficiency: '' });
  const [newCert,   setNewCert]   = useState({ name: '', institution: '', effectiveDate: '', expirationDate: '' });
  const [newTSkill, setNewTSkill] = useState({ skill: '', proficiency: '' });
  const [newFSkill, setNewFSkill] = useState({ skill: '', proficiency: '' });
  const [newHonor,  setNewHonor]  = useState({ title: '', institution: '', issueDate: '' });
  const [editWork,  setEditWork]  = useState<any>(null);
  const [editWF,    setEditWF]    = useState<any>({});

  // Security
  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw]   = useState({ curr: false, new_: false, conf: false });
  const [savingPw, setSavingPw] = useState(false);

  // Resume download state
  const [downloadingResume, setDownloadingResume] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const u = res.data.user;
      setAvatar(u.avatar || '');
      setPersonal({
        firstName: u.firstName || '', middleName: u.middleName || '',
        lastName: u.lastName || '', preferredFullName: u.preferredFullName || '',
        contactNumber: u.contactNumber || '', gender: u.gender || '',
        dateOfBirth: u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : '',
        maritalStatus: u.maritalStatus || '', nationality: u.nationality || '',
        country: u.country || '', state: u.state || '', city: u.city || '',
        currentCity: u.currentCity || '', pincode: u.pincode || '', bio: u.bio || '',
      });
      if (u.notifications) setNotifications(u.notifications);
    }).catch(() => {});

    // Load profile score
    loadScore();
  }, []);

  useEffect(() => {
    if (tab === 'professional' && !prof) loadProfessional();
    if (tab === 'personal') loadScore();
  }, [tab]);

  const loadScore = async () => {
    setLoadingScore(true);
    try {
      const res = await api.get('/profile/score');
      setScoreData(res.data.data);
    } catch {} finally { setLoadingScore(false); }
  };

  const loadProfessional = async () => {
    setLoadingProf(true);
    try { const r = await api.get('/profile/professional'); setProf(r.data.data); }
    catch { toast.error('Failed to load professional profile'); }
    finally { setLoadingProf(false); }
  };

  // ── AVATAR UPLOAD ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setUpAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatar(res.data.avatar);
      toast.success('Profile picture updated! ✅');
      loadScore();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to upload'); }
    finally { setUpAvatar(false); if (avatarInputRef.current) avatarInputRef.current.value = ''; }
  };

  // ── PERSONAL SAVE ──────────────────────────────────────────────────────────
  const savePersonal = async () => {
    if (!personal.firstName.trim()) return toast.error('First name is required');
    if (!personal.lastName.trim())  return toast.error('Last name is required');
    setSavingP(true);
    try {
      await api.put('/profile', personal);
      setEditP(false);
      toast.success('Profile updated!');
      loadScore();
    } catch { toast.error('Failed to save'); }
    finally { setSavingP(false); }
  };

  // ── PROFESSIONAL CRUD ──────────────────────────────────────────────────────
  const addProfItem = async (section: string, data: any, reset: () => void) => {
    try { const r = await api.post(`/profile/professional/${section}`, data); setProf(r.data.data); reset(); toast.success('Added!'); loadScore(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const updateProfItem = async (section: string, id: string, data: any) => {
    try { const r = await api.put(`/profile/professional/${section}/${id}`, data); setProf(r.data.data); setEditWork(null); toast.success('Updated!'); }
    catch { toast.error('Failed to update'); }
  };
  const delProfItem = async (section: string, id: string) => {
    try { const r = await api.delete(`/profile/professional/${section}/${id}`); setProf(r.data.data); toast.success('Deleted!'); loadScore(); }
    catch { toast.error('Failed'); }
  };

  // ── RESUME DOWNLOAD ────────────────────────────────────────────────────────
  const downloadResume = async () => {
    setDownloadingResume(true);
    try {
      if (!prof) await loadProfessional();
      const u = await api.get('/auth/me').then(r => r.data.user);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210; const margin = 18; let y = 20;

      const addText = (text: string, size = 10, bold = false, color = [30, 30, 30]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text || '', margin, y);
        y += size * 0.5;
      };

      const addSection = (title: string) => {
        y += 4;
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin + 2, y + 0.5);
        y += 6;
        doc.setTextColor(30, 30, 30);
      };

      const checkPage = (needed = 15) => {
        if (y + needed > 270) { doc.addPage(); y = 20; }
      };

      // ── HEADER ─────────────────────────────────────────────────────────────
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const fullName = u.preferredFullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'Name';
      doc.text(fullName, margin, 16);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const contactLine = [u.email, u.contactNumber, u.city && u.country ? `${u.city}, ${u.country}` : ''].filter(Boolean).join('  |  ');
      doc.text(contactLine, margin, 24);
      if (u.bio) {
        doc.setFontSize(9); doc.setTextColor(200, 220, 255);
        const bioLines = doc.splitTextToSize(u.bio, pageW - margin * 2);
        doc.text(bioLines[0] || '', margin, 32);
      }
      y = 48;

      // ── PERSONAL INFORMATION ───────────────────────────────────────────────
      addSection('PERSONAL INFORMATION');
      y += 2;
      const personalInfo = [
        ['Date of Birth', fmtDate(u.dateOfBirth)], ['Gender', u.gender || ''],
        ['Nationality', u.nationality || ''], ['Marital Status', u.maritalStatus || ''],
        ['Current City', u.currentCity || u.city || ''], ['Pincode', u.pincode || ''],
      ].filter(([, v]) => v);

      personalInfo.forEach(([label, value]) => {
        checkPage(6);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
        doc.text(`${label}:`, margin, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        doc.text(value, margin + 35, y);
        y += 5.5;
      });

      // ── WORK EXPERIENCE ────────────────────────────────────────────────────
      if (prof?.workExperience?.length > 0) {
        checkPage(20); addSection('WORK EXPERIENCE'); y += 2;
        prof.workExperience.forEach((w: any) => {
          checkPage(18);
          doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text(w.title || '', margin, y); y += 5;
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          const dateRange = `${fmtDate(w.startDate)} — ${w.isCurrent ? 'Present' : fmtDate(w.endDate)}`;
          doc.text(`${w.organizationName || ''}   •   ${dateRange}`, margin, y); y += 5;
          if (w.jobResponsibilities) {
            doc.setTextColor(60, 60, 60);
            const lines = doc.splitTextToSize(w.jobResponsibilities, pageW - margin * 2);
            lines.slice(0, 4).forEach((line: string) => { checkPage(5); doc.text(line, margin, y); y += 4.5; });
          }
          y += 3;
        });
      }

      // ── EDUCATION ──────────────────────────────────────────────────────────
      if (prof?.education?.length > 0) {
        checkPage(20); addSection('EDUCATION'); y += 2;
        prof.education.forEach((e: any) => {
          checkPage(14);
          doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text(`${e.degree || ''}${e.areaOfStudy ? ` in ${e.areaOfStudy}` : ''}`, margin, y); y += 5;
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          doc.text(`${e.collegeUniversity || ''}${e.dateCompleted ? `   •   Completed: ${fmtDate(e.dateCompleted)}` : ''}`, margin, y);
          y += 7;
        });
      }

      // ── CERTIFICATIONS ─────────────────────────────────────────────────────
      if (prof?.certifications?.length > 0) {
        checkPage(20); addSection('CERTIFICATIONS'); y += 2;
        prof.certifications.forEach((c: any) => {
          checkPage(12);
          doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text(c.name || '', margin, y); y += 5;
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          const certLine = [c.institution, c.effectiveDate ? `From ${fmtDate(c.effectiveDate)}` : ''].filter(Boolean).join('  •  ');
          if (certLine) { doc.text(certLine, margin, y); y += 5; }
          y += 2;
        });
      }

      // ── SKILLS ─────────────────────────────────────────────────────────────
      const techSkills  = prof?.technicalSkills?.map((s: any) => s.skill).filter(Boolean) || [];
      const funcSkills  = prof?.functionalSkills?.map((s: any) => s.skill).filter(Boolean) || [];
      if (techSkills.length > 0 || funcSkills.length > 0) {
        checkPage(20); addSection('SKILLS'); y += 2;
        if (techSkills.length > 0) {
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text('Technical:', margin, y); y += 4.5;
          doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
          const techLine = doc.splitTextToSize(techSkills.join('  •  '), pageW - margin * 2);
          techLine.forEach((line: string) => { doc.text(line, margin, y); y += 4.5; });
          y += 2;
        }
        if (funcSkills.length > 0) {
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text('Functional:', margin, y); y += 4.5;
          doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
          const funcLine = doc.splitTextToSize(funcSkills.join('  •  '), pageW - margin * 2);
          funcLine.forEach((line: string) => { doc.text(line, margin, y); y += 4.5; });
          y += 2;
        }
      }

      // ── LANGUAGES ──────────────────────────────────────────────────────────
      if (prof?.languages?.length > 0) {
        checkPage(20); addSection('LANGUAGES'); y += 2;
        prof.languages.forEach((l: any) => {
          checkPage(8);
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text(l.language || '', margin, y);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          doc.text(`Speaking: ${l.speakingProficiency}  •  Writing: ${l.writingProficiency}  •  Reading: ${l.readingProficiency}`, margin + 30, y);
          y += 6;
        });
      }

      // ── HONORS & AWARDS ────────────────────────────────────────────────────
      if (prof?.honorsAwards?.length > 0) {
        checkPage(20); addSection('HONORS & AWARDS'); y += 2;
        prof.honorsAwards.forEach((h: any) => {
          checkPage(10);
          doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text(h.title || '', margin, y); y += 5;
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          if (h.institution) { doc.text(h.institution, margin, y); y += 4.5; }
          y += 2;
        });
      }

      // ── FOOTER ─────────────────────────────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
        doc.text(`Generated by DoR-DoD Platform  •  Page ${i} of ${totalPages}`, margin, 290);
      }

      doc.save(`${fullName.replace(/\s+/g, '_')}_Resume.pdf`);
      toast.success('Resume downloaded! 📄');
    } catch (err) {
      console.error('Resume error:', err);
      toast.error('Failed to generate resume. Make sure jspdf is installed: npm install jspdf');
    } finally { setDownloadingResume(false); }
  };

  const SecHead = ({ id, label, count = 0 }: { id: string; label: string; count?: number }) => (
    <button onClick={() => setExpSec(expandedSec === id ? null : id)}
      className="w-full flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all font-semibold text-sm text-gray-800">
      <span className="flex items-center gap-2">{label}{count > 0 && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{count}</span>}</span>
      {expandedSec === id ? <FaChevronUp className="w-3 h-3 text-gray-400"/> : <FaChevronDown className="w-3 h-3 text-gray-400"/>}
    </button>
  );

  const Field = ({ label, value, onChange, type = 'text', required = false }: any) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
    </div>
  );

  const Sel = ({ label, value, onChange, options, required = false }: any) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
        <option value="">Please select</option>
        {options.map((o: string) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Identity</h1>

        {/* ── USER CARD with Avatar ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-5">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(user as any)?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {uploadingAvatar ? (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : (
                <button onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
                  title="Change profile picture">
                  <FaCamera className="w-3 h-3"/>
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {(user as any)?.name || `${personal.firstName} ${personal.lastName}`.trim() || 'User'}
              </h2>
              <p className="text-sm text-gray-500">{(user as any)?.email}</p>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">
                {(user as any)?.subscription || 'Free'} Plan
              </span>
            </div>

            {/* Profile Score + Download Resume */}
            <div className="flex items-center gap-4 shrink-0">
              {scoreData && !loadingScore && (
                <ScoreRing score={scoreData.totalScore} label={scoreData.label}/>
              )}
              <button onClick={downloadResume} disabled={downloadingResume}
                className="flex flex-col items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-semibold text-xs disabled:opacity-50 transition-all">
                <FaDownload className="w-4 h-4"/>
                {downloadingResume ? 'Generating...' : 'Download Resume'}
              </button>
            </div>
          </div>

          {/* Profile completeness tips */}
          {scoreData && scoreData.totalScore < 100 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Complete your profile to improve your resume
              </p>
              <div className="flex flex-wrap gap-2">
                {[...scoreData.personalMissing, ...scoreData.professionalMissing].slice(0, 5).map((item: any) => (
                  <span key={item.label} className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full">
                    <FaExclamationCircle className="w-2.5 h-2.5"/> {item.label} (+{item.points}%)
                  </span>
                ))}
              </div>
              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-indigo-600 transition-all duration-700"
                    style={{ width: `${scoreData.totalScore}%` }}/>
                </div>
                <span className="text-xs font-bold text-indigo-600">{scoreData.totalScore}% complete</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>Personal: {scoreData.personalScore}/50</span>
                <span>Professional: {scoreData.professionalScore}/50</span>
              </div>
            </div>
          )}
          {scoreData && scoreData.totalScore === 100 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-green-600">
              <FaCheckCircle className="w-4 h-4"/>
              <span className="text-sm font-semibold">Profile 100% complete — your resume is ready to download!</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[{ id: 'personal', label: '👤 Personal' }, { id: 'professional', label: '💼 Professional' }, { id: 'security', label: '🔒 Security' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PERSONAL TAB ────────────────────────────────────────────────── */}
        {tab === 'personal' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Personal Information</h3>
                {!isEditingP
                  ? <button onClick={() => setEditP(true)} className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg"><FaEdit className="w-3 h-3"/> Edit</button>
                  : <div className="flex gap-2">
                      <button onClick={() => setEditP(false)} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg"><FaTimes className="w-3 h-3"/> Cancel</button>
                      <button onClick={savePersonal} disabled={savingP} className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"><FaCheck className="w-3 h-3"/> {savingP ? 'Saving...' : 'Save'}</button>
                    </div>
                }
              </div>
              {!isEditingP ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                  <LV label="First Name"     value={personal.firstName}/>
                  <LV label="Middle Name"    value={personal.middleName}/>
                  <LV label="Last Name"      value={personal.lastName}/>
                  <LV label="Preferred Name" value={personal.preferredFullName}/>
                  <LV label="Contact"        value={personal.contactNumber}/>
                  <LV label="Gender"         value={personal.gender}/>
                  <LV label="Date of Birth"  value={personal.dateOfBirth ? fmtDate(personal.dateOfBirth) : ''}/>
                  <LV label="Marital Status" value={personal.maritalStatus}/>
                  <LV label="Nationality"    value={personal.nationality}/>
                  <LV label="Country"        value={personal.country}/>
                  <LV label="State"          value={personal.state}/>
                  <LV label="City"           value={personal.city}/>
                  <LV label="Current City"   value={personal.currentCity}/>
                  <LV label="Pincode"        value={personal.pincode}/>
                  {personal.bio && <div className="col-span-2"><LV label="Bio" value={personal.bio}/></div>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name"    value={personal.firstName}    onChange={(v:string)=>setPersonal(p=>({...p,firstName:v}))}    required/>
                  <Field label="Middle Name"   value={personal.middleName}   onChange={(v:string)=>setPersonal(p=>({...p,middleName:v}))}/>
                  <Field label="Last Name"     value={personal.lastName}     onChange={(v:string)=>setPersonal(p=>({...p,lastName:v}))}     required/>
                  <Field label="Preferred Name"value={personal.preferredFullName} onChange={(v:string)=>setPersonal(p=>({...p,preferredFullName:v}))} required/>
                  <Field label="Contact"       value={personal.contactNumber}onChange={(v:string)=>setPersonal(p=>({...p,contactNumber:v}))}/>
                  <Sel   label="Gender"        value={personal.gender}       onChange={(v:string)=>setPersonal(p=>({...p,gender:v}))}        options={['Male','Female','Other','Prefer not to say']} required/>
                  <Field label="Date of Birth" value={personal.dateOfBirth}  onChange={(v:string)=>setPersonal(p=>({...p,dateOfBirth:v}))}   type="date" required/>
                  <Sel   label="Marital Status"value={personal.maritalStatus}onChange={(v:string)=>setPersonal(p=>({...p,maritalStatus:v}))} options={['Single','Married','Divorced','Widowed']}/>
                  <Field label="Nationality"   value={personal.nationality}  onChange={(v:string)=>setPersonal(p=>({...p,nationality:v}))}/>
                  <Field label="Country"       value={personal.country}      onChange={(v:string)=>setPersonal(p=>({...p,country:v}))}       required/>
                  <Field label="State"         value={personal.state}        onChange={(v:string)=>setPersonal(p=>({...p,state:v}))}         required/>
                  <Field label="City"          value={personal.city}         onChange={(v:string)=>setPersonal(p=>({...p,city:v}))}          required/>
                  <Field label="Current City"  value={personal.currentCity}  onChange={(v:string)=>setPersonal(p=>({...p,currentCity:v}))}/>
                  <Field label="Pincode"       value={personal.pincode}      onChange={(v:string)=>setPersonal(p=>({...p,pincode:v}))}/>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Bio</label>
                    <textarea value={personal.bio} onChange={e=>setPersonal(p=>({...p,bio:e.target.value}))} rows={3} maxLength={300}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"/>
                    <p className="text-xs text-right text-gray-400 mt-1">{personal.bio.length}/300</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3">
                {[{ key: 'email', label: 'Email notifications' }, { key: 'push', label: 'Push notifications' }, { key: 'weekly', label: 'Weekly digest' }].map(n => (
                  <label key={n.key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">{n.label}</span>
                    <button onClick={async () => {
                      const upd = { ...notifications, [n.key]: !notifications[n.key as keyof typeof notifications] };
                      setNotifications(upd);
                      try { await api.put('/profile/notifications', upd); } catch {}
                    }} className={`w-11 h-6 rounded-full transition-colors relative ${notifications[n.key as keyof typeof notifications] ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications[n.key as keyof typeof notifications] ? 'translate-x-5' : ''}`}/>
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-red-500 hover:underline font-medium text-sm">
              <FaSignOutAlt/> Log Out
            </button>
          </div>
        )}

        {/* ── PROFESSIONAL TAB ────────────────────────────────────────────── */}
        {tab === 'professional' && (
          <div className="space-y-3">
            {loadingProf && <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>}
            {prof && (
              <>
                {/* Work Experience */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead id="work" label="Work Experience" count={prof.workExperience?.length}/>
                  {expandedSec === 'work' && (
                    <div className="p-4 space-y-3">
                      {(prof.workExperience || []).map((w: any) => (
                        <div key={w._id} className="border border-gray-100 rounded-xl p-4">
                          {editWork === w._id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <Field label="Organization *" value={editWF.organizationName} onChange={(v:string)=>setEditWF((p:any)=>({...p,organizationName:v}))}/>
                                <Field label="Job Title *"    value={editWF.title}             onChange={(v:string)=>setEditWF((p:any)=>({...p,title:v}))}/>
                                <Field label="Start Date *"   value={editWF.startDate}         onChange={(v:string)=>setEditWF((p:any)=>({...p,startDate:v}))} type="date"/>
                                <div>
                                  <Field label="End Date" value={editWF.endDate} onChange={(v:string)=>setEditWF((p:any)=>({...p,endDate:v}))} type="date"/>
                                  <label className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 cursor-pointer">
                                    <input type="checkbox" checked={editWF.isCurrent} onChange={e=>setEditWF((p:any)=>({...p,isCurrent:e.target.checked,endDate:e.target.checked?'':p.endDate}))} className="rounded"/> Currently working
                                  </label>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Responsibilities</label>
                                  <textarea value={editWF.jobResponsibilities} onChange={e=>setEditWF((p:any)=>({...p,jobResponsibilities:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"/>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={()=>updateProfItem('work',w._id,editWF)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">Save</button>
                                <button onClick={()=>setEditWork(null)} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{w.title}</p>
                                <p className="text-sm text-gray-600">{w.organizationName}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {fmtDate(w.startDate)} — {w.isCurrent ? <span className="text-green-600 font-semibold">Present</span> : fmtDate(w.endDate)}
                                </p>
                                {w.jobResponsibilities && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{w.jobResponsibilities}</p>}
                              </div>
                              <div className="flex gap-1 ml-3">
                                <button onClick={()=>{setEditWork(w._id);setEditWF({organizationName:w.organizationName,title:w.title,startDate:w.startDate?.slice(0,10)||'',endDate:w.endDate?.slice(0,10)||'',isCurrent:w.isCurrent||false,jobResponsibilities:w.jobResponsibilities||''});}} className="text-indigo-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg"><FaEdit className="w-3.5 h-3.5"/></button>
                                <button onClick={()=>delProfItem('work',w._id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"><FaTrash className="w-3 h-3"/></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Add form */}
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Add New</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input placeholder="Organization *" value={newWork.organizationName} onChange={e=>setNewWork(p=>({...p,organizationName:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                          <input placeholder="Job Title *"    value={newWork.title}             onChange={e=>setNewWork(p=>({...p,title:e.target.value}))}             className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                          <div><label className="text-xs text-gray-400 mb-1 block">Start Date *</label><input type="date" value={newWork.startDate} onChange={e=>setNewWork(p=>({...p,startDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">End Date {newWork.isCurrent&&<span className="text-green-500">(not needed)</span>}</label><input type="date" value={newWork.endDate} disabled={newWork.isCurrent} onChange={e=>setNewWork(p=>({...p,endDate:e.target.value}))} className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none ${newWork.isCurrent?'opacity-40 cursor-not-allowed':''}`}/></div>
                          <div className="col-span-2"><textarea placeholder="Job responsibilities" value={newWork.jobResponsibilities} onChange={e=>setNewWork(p=>({...p,jobResponsibilities:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"/></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer"><input type="checkbox" checked={newWork.isCurrent} onChange={e=>setNewWork(p=>({...p,isCurrent:e.target.checked,endDate:e.target.checked?'':p.endDate}))} className="rounded"/> Currently working here</label>
                          <button onClick={()=>addProfItem('work',newWork,()=>setNewWork({isCurrent:false,organizationName:'',title:'',startDate:'',endDate:'',jobResponsibilities:''}))} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"><FaPlus className="w-3 h-3"/> Add</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead id="edu" label="Education" count={prof.education?.length}/>
                  {expandedSec === 'edu' && (
                    <div className="p-4 space-y-3">
                      {(prof.education||[]).map((e:any)=>(
                        <div key={e._id} className="flex items-start justify-between border border-gray-100 rounded-xl p-3">
                          <div><p className="font-semibold text-gray-900">{e.degree}{e.areaOfStudy&&` in ${e.areaOfStudy}`}</p><p className="text-sm text-gray-600">{e.collegeUniversity}</p>{e.dateCompleted&&<p className="text-xs text-gray-400 mt-0.5">Completed: {fmtDate(e.dateCompleted)}</p>}</div>
                          <button onClick={()=>delProfItem('education',e._id)} className="text-red-400 hover:text-red-600 p-1.5 ml-2"><FaTrash className="w-3 h-3"/></button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input placeholder="College / University *" value={newEdu.collegeUniversity} onChange={e=>setNewEdu(p=>({...p,collegeUniversity:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                          <input placeholder="Degree *"               value={newEdu.degree}             onChange={e=>setNewEdu(p=>({...p,degree:e.target.value}))}             className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                          <input placeholder="Area of Study"           value={newEdu.areaOfStudy}        onChange={e=>setNewEdu(p=>({...p,areaOfStudy:e.target.value}))}        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                          <div><label className="text-xs text-gray-400 mb-1 block">Date Completed *</label><input type="date" value={newEdu.dateCompleted} onChange={e=>setNewEdu(p=>({...p,dateCompleted:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/></div>
                        </div>
                        <button onClick={()=>addProfItem('education',newEdu,()=>setNewEdu({collegeUniversity:'',degree:'',areaOfStudy:'',degreeCompleted:false,dateCompleted:''}))} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"><FaPlus className="w-3 h-3"/> Add Education</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Language Skills */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead id="lang" label="Language Skills" count={prof.languages?.length}/>
                  {expandedSec === 'lang' && (
                    <div className="p-4 space-y-3">
                      {(prof.languages||[]).map((l:any)=>(<div key={l._id} className="flex items-start justify-between border border-gray-100 rounded-xl p-3"><div><p className="font-semibold">{l.language}</p><p className="text-xs text-gray-500">Speaking: {l.speakingProficiency} · Writing: {l.writingProficiency} · Reading: {l.readingProficiency}</p></div><button onClick={()=>delProfItem('languages',l._id)} className="text-red-400 hover:text-red-600 p-1.5"><FaTrash className="w-3 h-3"/></button></div>))}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input placeholder="Language *" value={newLang.language} onChange={e=>setNewLang(p=>({...p,language:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"/>
                          {['speakingProficiency','writingProficiency','readingProficiency'].map(f=>(
                            <select key={f} value={(newLang as any)[f]} onChange={e=>setNewLang((p:any)=>({...p,[f]:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                              {PROFICIENCY.map(p=><option key={p}>{p}</option>)}
                            </select>
                          ))}
                        </div>
                        <button onClick={()=>addProfItem('languages',newLang,()=>setNewLang({language:'',speakingProficiency:'',writingProficiency:'',readingProficiency:''}))} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"><FaPlus className="w-3 h-3"/> Add Language</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead id="cert" label="Certifications / Licenses" count={prof.certifications?.length}/>
                  {expandedSec === 'cert' && (
                    <div className="p-4 space-y-3">
                      {(prof.certifications||[]).map((c:any)=>(<div key={c._id} className="flex items-start justify-between border border-gray-100 rounded-xl p-3"><div><p className="font-semibold">{c.name}</p><p className="text-sm text-gray-500">{c.institution}</p><p className="text-xs text-gray-400">{c.effectiveDate&&`From ${fmtDate(c.effectiveDate)}`}{c.effectiveDate&&c.expirationDate&&' · '}{c.expirationDate&&`Expires ${fmtDate(c.expirationDate)}`}</p></div><button onClick={()=>delProfItem('certifications',c._id)} className="text-red-400 hover:text-red-600 p-1.5"><FaTrash className="w-3 h-3"/></button></div>))}
                      <div className="border-t border-gray-100 pt-3"><div className="grid grid-cols-2 gap-2 mb-2"><input placeholder="Certification Name *" value={newCert.name} onChange={e=>setNewCert(p=>({...p,name:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"/><input placeholder="Institution" value={newCert.institution} onChange={e=>setNewCert(p=>({...p,institution:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"/><div><label className="text-xs text-gray-400 mb-1 block">Effective Date *</label><input type="date" value={newCert.effectiveDate} onChange={e=>setNewCert(p=>({...p,effectiveDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/></div><div><label className="text-xs text-gray-400 mb-1 block">Expiry Date</label><input type="date" value={newCert.expirationDate} onChange={e=>setNewCert(p=>({...p,expirationDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/></div></div><button onClick={()=>addProfItem('certifications',newCert,()=>setNewCert({name:'',institution:'',effectiveDate:'',expirationDate:''}))} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"><FaPlus className="w-3 h-3"/> Add Certification</button></div>
                    </div>
                  )}
                </div>

                {/* Technical + Functional Skills */}
                {['tech','func'].map(type => {
                  const isT = type === 'tech';
                  const key = isT ? 'technicalSkills' : 'functionalSkills';
                  const sec = isT ? 'technical-skills' : 'functional-skills';
                  const st  = isT ? newTSkill : newFSkill;
                  const setSt = isT ? setNewTSkill : setNewFSkill;
                  const color = isT ? 'indigo' : 'purple';
                  return (
                    <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <SecHead id={type} label={isT ? 'Technical Skills' : 'Functional Skills'} count={prof[key]?.length}/>
                      {expandedSec === type && (
                        <div className="p-4 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {(prof[key]||[]).map((s:any)=>(<div key={s._id} className={`flex items-center gap-1.5 bg-${color}-50 border border-${color}-100 text-${color}-700 rounded-full px-3 py-1 text-sm`}>{s.skill}<span className={`text-${color}-400`}>·{s.proficiency}</span><button onClick={()=>delProfItem(sec,s._id)} className={`text-${color}-300 hover:text-red-500 ml-1`}><FaTimes className="w-2.5 h-2.5"/></button></div>))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <input placeholder="Skill name *" value={st.skill} onChange={e=>setSt((p:any)=>({...p,skill:e.target.value}))} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                            <select value={st.proficiency} onChange={e=>setSt((p:any)=>({...p,proficiency:e.target.value}))} className="w-24 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none"><option value="">Level</option>{['1','2','3','4','5'].map(l=><option key={l}>{l}</option>)}</select>
                            <button onClick={()=>addProfItem(sec,st,()=>setSt({skill:'',proficiency:''}))} className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"><FaPlus/></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Honors */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <SecHead id="honors" label="Honors / Awards / Publications" count={prof.honorsAwards?.length}/>
                  {expandedSec === 'honors' && (
                    <div className="p-4 space-y-3">
                      {(prof.honorsAwards||[]).map((h:any)=>(<div key={h._id} className="flex items-start justify-between border border-gray-100 rounded-xl p-3"><div><p className="font-semibold">{h.title}</p><p className="text-sm text-gray-500">{h.institution}</p>{h.issueDate&&<p className="text-xs text-gray-400">{fmtDate(h.issueDate)}</p>}</div><button onClick={()=>delProfItem('honors',h._id)} className="text-red-400 hover:text-red-600 p-1.5"><FaTrash className="w-3 h-3"/></button></div>))}
                      <div className="border-t border-gray-100 pt-3"><div className="grid grid-cols-2 gap-2 mb-2"><input placeholder="Title *" value={newHonor.title} onChange={e=>setNewHonor(p=>({...p,title:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/><input placeholder="Institution" value={newHonor.institution} onChange={e=>setNewHonor(p=>({...p,institution:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/><div className="col-span-2"><label className="text-xs text-gray-400 mb-1 block">Issue Date</label><input type="date" value={newHonor.issueDate} onChange={e=>setNewHonor(p=>({...p,issueDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/></div></div><button onClick={()=>addProfItem('honors',newHonor,()=>setNewHonor({title:'',institution:'',issueDate:''}))} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"><FaPlus className="w-3 h-3"/> Add</button></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ────────────────────────────────────────────────── */}
        {tab === 'security' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><FaLock className="text-indigo-500"/> Change Password</h3>
            <form onSubmit={async e => { e.preventDefault(); if (pwForm.newPw.length < 6) return toast.error('Min 6 characters'); if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match'); setSavingPw(true); try { const r = await api.patch('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw }); toast.success(r.data.message); setPwForm({ current:'', newPw:'', confirm:'' }); } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); } finally { setSavingPw(false); } }} className="space-y-4">
              {[{ key: 'current', label: 'Current Password', showKey: 'curr' as const }, { key: 'newPw', label: 'New Password', showKey: 'new_' as const }, { key: 'confirm', label: 'Confirm Password', showKey: 'conf' as const }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{f.label}</label>
                  <div className="relative">
                    <input type={showPw[f.showKey] ? 'text' : 'password'} value={(pwForm as any)[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" required/>
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [f.showKey]: !p[f.showKey] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw[f.showKey] ? <FaEyeSlash className="w-4 h-4"/> : <FaEye className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={savingPw} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50">
                {savingPw ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}