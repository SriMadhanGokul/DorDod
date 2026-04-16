import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  FaCheck, FaPlus, FaChevronDown, FaChevronUp,
  FaArrowLeft, FaPlay, FaTimes, FaTrash, FaStar, FaTag, FaEdit,
} from 'react-icons/fa';

interface CareerPath { id:string; title:string; subtitle:string; emoji:string; demand:string; totalSkills:number; }
interface UserSkill  { _id:string; name:string; status:'learned'|'learning'|'to-learn'; category:string; addedToGoal:boolean; }
interface SkillPath  { careerPath:string; skills:UserSkill[]; }
interface CustomSkill {
  _id:string; skillName:string; alreadyKnows:any[]; wantsToLearn:any[];
  description:string; category:string; status:string; currentLevel?:string;
}

function TagInput({ tags, onChange, placeholder }: { tags:string[]; onChange:(t:string[])=>void; placeholder:string }) {
  const [input, setInput] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const add = (v:string) => { const t=v.trim(); if(!t||tags.includes(t)) return; onChange([...tags,t]); setInput(''); };
  const onKey = (e:React.KeyboardEvent) => {
    if(e.key==='Enter'||e.key===','){e.preventDefault();add(input);}
    if(e.key==='Backspace'&&!input&&tags.length>0) onChange(tags.slice(0,-1));
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 border border-border rounded-xl bg-card min-h-[44px] cursor-text"
      onClick={()=>ref.current?.focus()}>
      {tags.map((tag,i)=>(
        <span key={i} className="flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-lg">
          {tag}<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))}><FaTimes className="w-2.5 h-2.5 hover:text-destructive"/></button>
        </span>
      ))}
      <input ref={ref} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} onBlur={()=>add(input)}
        placeholder={tags.length===0?placeholder:'Add more...'} className="flex-1 min-w-[100px] outline-none text-sm bg-transparent placeholder:text-foreground-muted/60"/>
    </div>
  );
}

const DEMAND_COLOR: Record<string,string> = {
  'Very High':'bg-red-100 text-red-600','Exploding':'bg-purple-100 text-purple-600',
  'High':'bg-blue-100 text-blue-600','Increasing Fast':'bg-orange-100 text-orange-600',
};
const STATUS_CONFIG = {
  'learned':  { color:'bg-success/20 text-success border-success/40',    dot:'bg-success' },
  'learning': { color:'bg-primary/20 text-primary border-primary/40',    dot:'bg-primary' },
  'to-learn': { color:'bg-muted text-foreground-muted border-border',    dot:'bg-foreground-muted' },
};
const CUSTOM_STATUS_COLOR: Record<string,string> = {
  completed:'bg-success/20 text-success border-success/40',
  current:  'bg-primary/20 text-primary border-primary/40',
  planned:  'bg-muted text-foreground-muted border-border',
};

const SKILL_LEVELS = [
  'Beginner (Awareness Level)',
  'Intermediate (Application Level)',
  'Advanced (Mastery Level)',
  'Expert (Intuitive Level)',
  'Master / Innovator (Creation Level)',
];

const EMPTY_CUSTOM = {
  skillName:'', alreadyKnows:[] as string[], wantsToLearn:[] as string[],
  description:'', category:'Technical', status:'current', currentLevel:'Beginner (Awareness Level)',
};

export default function SkillsPage() {
  const [view, setView]                   = useState<'select'|'detail'|'track'>('select');
  const [careers, setCareers]             = useState<CareerPath[]>([]);
  const [careerDetail, setCareerDetail]   = useState<any>(null);
  const [skillPath, setSkillPath]         = useState<SkillPath|null>(null);
  const [loading, setLoading]             = useState(true);
  const [selecting, setSelecting]         = useState(false);
  const [expandedCat, setExpandedCat]     = useState<string|null>(null);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [search, setSearch]               = useState('');
  const [customSkills, setCustomSkills]   = useState<CustomSkill[]>([]);
  const [showModal, setShowModal]         = useState(false);
  const [savingCustom, setSavingCustom]   = useState(false);
  const [customForm, setCustomForm]       = useState({...EMPTY_CUSTOM});
  // Edit state
  const [editSkill, setEditSkill]         = useState<CustomSkill|null>(null);
  const [editForm, setEditForm]           = useState({...EMPTY_CUSTOM});
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, spRes, csRes] = await Promise.all([
          api.get('/skill-path/careers'),
          api.get('/skill-path'),
          api.get('/custom-skills'),
        ]);
        setCareers(cRes.data.data);
        if (spRes.data.data) { setSkillPath(spRes.data.data); setView('track'); }
        setCustomSkills((csRes.data.data||[]).map((s:any)=>({
          ...s,
          alreadyKnows: Array.isArray(s.alreadyKnows) ? s.alreadyKnows : (s.alreadyKnows||'').split(',').map((x:string)=>x.trim()).filter(Boolean),
          wantsToLearn: Array.isArray(s.wantsToLearn) ? s.wantsToLearn : (s.wantsToLearn||'').split(',').map((x:string)=>x.trim()).filter(Boolean),
        })));
      } catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleViewCareer = async (career: CareerPath) => {
    try { const res = await api.get(`/skill-path/careers/${career.id}`); setCareerDetail(res.data.data); setView('detail'); }
    catch { toast.error('Failed to load career details'); }
  };

  const handleSelectPath = async (careerId: string) => {
    setSelecting(true);
    try {
      const res = await api.post('/skill-path/select', { careerId });
      setSkillPath(res.data.data); toast.success(res.data.message); setView('track');
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSelecting(false); }
  };

  const handleStatusChange = async (skillId: string, status: string) => {
    try { const res = await api.patch(`/skill-path/skills/${skillId}`, { status }); setSkillPath(res.data.data); }
    catch { toast.error('Failed to update skill'); }
  };

  const handleAddToGoal = async (skillId: string) => {
    try {
      const res = await api.post(`/skill-path/skills/${skillId}/add-goal`);
      setSkillPath(res.data.data); toast.success(res.data.message);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  // Validate mandatory fields for custom skill
  const validateCustom = (f: typeof EMPTY_CUSTOM) => {
    if (!f.skillName.trim()) return 'Skill name is required';
    if (!f.category)         return 'Category is required';
    if (!f.status)           return 'Current status is required';
    if (!f.currentLevel)     return 'Current level is required';
    return null;
  };

  const addCustomSkill = async () => {
    const err = validateCustom(customForm);
    if (err) return toast.error(err);
    setSavingCustom(true);
    try {
      const res = await api.post('/custom-skills', {
        ...customForm,
        alreadyKnows: customForm.alreadyKnows,
        wantsToLearn: customForm.wantsToLearn,
      });
      setCustomSkills(p => [res.data.data, ...p]);
      setCustomForm({...EMPTY_CUSTOM}); setShowModal(false);
      toast.success('Skill added!');
    } catch { toast.error('Failed to add skill'); }
    finally { setSavingCustom(false); }
  };

  const openEditCustom = (s: CustomSkill) => {
    setEditSkill(s);
    setEditForm({
      skillName: s.skillName,
      alreadyKnows: (s.alreadyKnows||[]).map((t:any)=>typeof t==='string'?t:t?.name||'').filter(Boolean),
      wantsToLearn: (s.wantsToLearn||[]).map((t:any)=>typeof t==='string'?t:t?.name||'').filter(Boolean),
      description: s.description, category: s.category, status: s.status,
      currentLevel: s.currentLevel || 'Beginner (Awareness Level)',
    });
  };

  const saveEditCustom = async () => {
    if (!editSkill) return;
    const err = validateCustom(editForm);
    if (err) return toast.error(err);
    setSavingCustom(true);
    try {
      const res = await api.put(`/custom-skills/${editSkill._id}`, editForm);
      setCustomSkills(p => p.map(s => s._id === editSkill._id ? { ...res.data.data, alreadyKnows: editForm.alreadyKnows, wantsToLearn: editForm.wantsToLearn } : s));
      setEditSkill(null); toast.success('Skill updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSavingCustom(false); }
  };

  const addTagToGoal = async (skillId: string, tagId: string, tagName: string) => {
    try {
      await api.post(`/custom-skills/${skillId}/tags/${tagId}/add-goal`);
      setCustomSkills(prev => prev.map(s => s._id === skillId ? {
        ...s, wantsToLearn: s.wantsToLearn.map((t:any) => t._id === tagId ? { ...t, addedToGoal:true } : t)
      } : s));
      toast.success(`🎯 "Learn ${tagName}" added to Goals!`);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const deleteCustomSkill = async (id: string) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await api.delete(`/custom-skills/${id}`);
      setCustomSkills(p => p.filter(s => s._id !== id));
      toast.success('Skill deleted!');
    } catch { toast.error('Failed'); }
  };

  const stats = skillPath ? {
    learned:  skillPath.skills.filter(s=>s.status==='learned').length,
    learning: skillPath.skills.filter(s=>s.status==='learning').length,
    total:    skillPath.skills.length,
    pct:      skillPath.skills.length ? Math.round((skillPath.skills.filter(s=>s.status==='learned').length/skillPath.skills.length)*100) : 0,
  } : { learned:0,learning:0,total:0,pct:0 };

  const grouped = (() => {
    if (!skillPath) return {};
    let skills = skillPath.skills;
    if (filterStatus!=='all') skills = skills.filter(s=>s.status===filterStatus);
    if (search) skills = skills.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()));
    return skills.reduce((acc,skill)=>{ if(!acc[skill.category])acc[skill.category]=[]; acc[skill.category].push(skill); return acc; },{} as Record<string,UserSkill[]>);
  })();

  // Shared custom skill form fields
  const CustomFormFields = ({ form, setForm }: { form:any; setForm:any }) => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-foreground-muted">Skill Name <span className="text-destructive">*</span></label>
        <input placeholder="e.g. Video Editing, Public Speaking" value={form.skillName}
          onChange={e=>setForm((p:any)=>({...p,skillName:e.target.value}))} className="input-field mt-1"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">Category <span className="text-destructive">*</span></label>
          <select value={form.category} onChange={e=>setForm((p:any)=>({...p,category:e.target.value}))} className="input-field mt-1">
            {['Technical','Leadership','Soft Skills','Creative','Language','Design','Business','Other'].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground-muted">Current Status <span className="text-destructive">*</span></label>
          <select value={form.status} onChange={e=>setForm((p:any)=>({...p,status:e.target.value}))} className="input-field mt-1">
            <option value="planned">⏳ Planned</option>
            <option value="current">📖 Currently Learning</option>
            <option value="completed">✅ Completed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">Current Level <span className="text-destructive">*</span></label>
        <select value={form.currentLevel} onChange={e=>setForm((p:any)=>({...p,currentLevel:e.target.value}))} className="input-field mt-1">
          {SKILL_LEVELS.map(l=><option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted flex items-center gap-1"><FaTag className="w-3 h-3"/> Already Know <span className="font-normal opacity-60">(Enter to add)</span></label>
        <TagInput tags={form.alreadyKnows} onChange={tags=>setForm((p:any)=>({...p,alreadyKnows:tags}))} placeholder="e.g. React, Node.js"/>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted flex items-center gap-1"><FaTag className="w-3 h-3"/> Want to Learn <span className="font-normal opacity-60">(Enter to add)</span></label>
        <TagInput tags={form.wantsToLearn} onChange={tags=>setForm((p:any)=>({...p,wantsToLearn:tags}))} placeholder="e.g. TypeScript, GraphQL"/>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">Description (optional)</label>
        <textarea placeholder="Why are you learning this?" value={form.description}
          onChange={e=>setForm((p:any)=>({...p,description:e.target.value}))} className="input-field min-h-[60px] mt-1"/>
      </div>
    </div>
  );

  if (loading) return <DashboardLayout><div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Career path selector */}
        {view === 'select' && (
          <>
            <div><h1 className="text-2xl md:text-3xl font-bold">Choose Your Career Path</h1>
              <p className="text-foreground-muted mt-1">Select the path — we'll track all your skills</p></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {careers.map(career => (
                <div key={career.id} onClick={() => handleViewCareer(career)}
                  className="card-elevated hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-primary/30">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{career.emoji}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${DEMAND_COLOR[career.demand]||'bg-muted text-foreground-muted'}`}>🔥 {career.demand}</span>
                  </div>
                  <h3 className="font-bold text-base group-hover:text-primary">{career.title}</h3>
                  <p className="text-sm text-foreground-muted mb-3">{career.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-muted">{career.totalSkills} skills</span>
                    <span className="text-xs text-primary font-medium">View Path →</span>
                  </div>
                </div>
              ))}
            </div>
            {skillPath && <button onClick={() => setView('track')} className="btn-secondary flex items-center gap-2"><FaArrowLeft/> Back to My Skills</button>}
          </>
        )}

        {/* Career detail */}
        {view === 'detail' && careerDetail && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setView('select')} className="text-foreground-muted hover:text-foreground p-2"><FaArrowLeft/></button>
              <div><h1 className="text-2xl font-bold">{careerDetail.emoji} {careerDetail.title}</h1>
                <p className="text-foreground-muted text-sm">{careerDetail.subtitle}</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {careerDetail.categories?.map((cat:any) => (
                <div key={cat.name} className="card-elevated">
                  <h3 className="font-semibold text-sm mb-3 text-primary border-b border-border pb-2">{cat.name}</h3>
                  <div className="flex flex-wrap gap-2">{cat.skills.map((skill:string) => <span key={skill} className="text-xs bg-muted px-3 py-1.5 rounded-full">{skill}</span>)}</div>
                </div>
              ))}
            </div>
            <button onClick={() => handleSelectPath(careerDetail.id)} disabled={selecting}
              className="btn-primary w-full text-base py-4 disabled:opacity-50">
              {selecting ? 'Setting up...' : `🚀 Start ${careerDetail.title} Path`}
            </button>
          </>
        )}

        {/* Skill tracker */}
        {view === 'track' && skillPath && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div><h1 className="text-2xl md:text-3xl font-bold">My Skill Tracker</h1>
                <p className="text-foreground-muted mt-1">Path: <strong>{skillPath.careerPath}</strong></p></div>
              <button onClick={() => setView('select')} className="btn-secondary text-sm">🔄 Change Path</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{val:stats.learned,label:'✅ Learned',color:'text-success'},{val:stats.learning,label:'📖 Learning',color:'text-primary'},{val:stats.total-stats.learned-stats.learning,label:'⏳ To Learn',color:'text-foreground-muted'},{val:`${stats.pct}%`,label:'🎯 Mastered',color:'text-secondary'}].map((s,i)=>(
                <div key={i} className="stat-card text-center"><p className={`text-3xl font-bold ${s.color}`}>{s.val}</p><p className="text-xs text-foreground-muted mt-1">{s.label}</p></div>
              ))}
            </div>
            <div className="card-elevated">
              <div className="flex justify-between mb-2 text-sm"><span className="font-medium">Overall Progress</span><span className="text-foreground-muted">{stats.learned}/{stats.total}</span></div>
              <div className="w-full bg-muted rounded-full h-3"><div className="bg-gradient-to-r from-primary to-success rounded-full h-3 transition-all duration-700" style={{width:`${stats.pct}%`}}/></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input placeholder="🔍 Search skills..." value={search} onChange={e=>setSearch(e.target.value)} className="input-field flex-1"/>
              <div className="flex gap-2 flex-wrap">
                {['all','learned','learning','to-learn'].map(f=>(
                  <button key={f} onClick={()=>setFilterStatus(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus===f?'bg-primary text-primary-foreground':'bg-muted text-foreground-muted hover:bg-accent'}`}>
                    {f==='all'?'All':f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, skills]) => {
                const lc = skills.filter(s=>s.status==='learned').length;
                const pct = Math.round((lc/skills.length)*100);
                return (
                  <div key={category} className="card-elevated">
                    <button onClick={()=>setExpandedCat(expandedCat===category?null:category)} className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-3"><h3 className="font-semibold">{category}</h3><span className="text-xs text-foreground-muted">{lc}/{skills.length}</span></div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-muted rounded-full h-1.5 hidden sm:block"><div className="bg-success rounded-full h-1.5 transition-all" style={{width:`${pct}%`}}/></div>
                        {expandedCat===category?<FaChevronUp className="text-foreground-muted"/>:<FaChevronDown className="text-foreground-muted"/>}
                      </div>
                    </button>
                    {expandedCat===category && (
                      <div className="mt-4 space-y-2">
                        {skills.map(skill => {
                          const cfg = STATUS_CONFIG[skill.status];
                          return (
                            <div key={skill._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${cfg.color}`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}/>
                                <span className="text-sm font-medium truncate">{skill.name}</span>
                                {skill.addedToGoal && <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full shrink-0">✓ Goal</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <select value={skill.status} onChange={e=>handleStatusChange(skill._id,e.target.value)}
                                  className="text-xs border border-current rounded-lg px-2 py-1 bg-transparent cursor-pointer">
                                  <option value="to-learn">⏳ To Learn</option><option value="learning">📖 Learning</option><option value="learned">✅ Learned</option>
                                </select>
                                <button onClick={()=>navigate(`/learning?skill=${encodeURIComponent(skill.name)}`)}
                                  className="text-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                                  <FaPlay className="w-2 h-2"/> Learn
                                </button>
                                {!skill.addedToGoal && (
                                  <button onClick={()=>handleAddToGoal(skill._id)}
                                    className="text-xs border border-border text-foreground-muted hover:text-secondary hover:border-secondary px-2 py-1 rounded-lg transition-all flex items-center gap-1 bg-card">
                                    <FaPlus className="w-2.5 h-2.5"/> Goal
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Other Skills section */}
        {(view==='track'||view==='select') && (
          <div className="card-elevated border-2 border-dashed border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg flex items-center gap-2"><FaStar className="text-secondary"/> My Other Skills</h2>
                <p className="text-xs text-foreground-muted mt-0.5">Skills outside your career path</p>
              </div>
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
                <FaPlus className="w-3 h-3"/> Add Other Skill
              </button>
            </div>

            {customSkills.length === 0 ? (
              <div className="text-center py-10 text-foreground-muted">
                <FaStar className="text-4xl mx-auto mb-3 opacity-20"/>
                <p className="font-medium">No other skills added yet</p>
                <button onClick={() => setShowModal(true)} className="btn-secondary text-sm mt-4 flex items-center gap-2 mx-auto">
                  <FaPlus className="w-3 h-3"/> Add Your First Skill
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {customSkills.map(s => {
                  const knowTags: string[] = (s.alreadyKnows||[]).map((t:any)=>typeof t==='string'?t:t?.name||'').filter(Boolean);
                  const learnTags: {name:string;_id?:string;addedToGoal:boolean}[] = (s.wantsToLearn||[]).map((t:any)=>
                    typeof t==='string'?{name:t,_id:undefined,addedToGoal:false}:{name:t?.name||'',_id:t?._id,addedToGoal:!!t?.addedToGoal}
                  ).filter(x=>x.name);
                  return (
                    <div key={s._id} className={`p-4 rounded-xl border transition-all ${CUSTOM_STATUS_COLOR[s.status]||CUSTOM_STATUS_COLOR.planned}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{s.skillName}</h3>
                          <span className="text-xs bg-card/70 px-2 py-0.5 rounded-full">{s.status==='current'?'📖 Learning':s.status==='completed'?'✅ Done':'⏳ Planned'}</span>
                          <span className="text-xs bg-card/70 px-2 py-0.5 rounded-full">{s.category}</span>
                          {s.currentLevel && <span className="text-xs bg-card/70 px-2 py-0.5 rounded-full">🎯 {s.currentLevel.split('(')[0].trim()}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => navigate(`/learning?skill=${encodeURIComponent(s.skillName)}`)}
                            className="text-xs border border-current px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                            <FaPlay className="w-2 h-2"/> Learn
                          </button>
                          <button onClick={() => openEditCustom(s)}
                            className="text-foreground-muted hover:text-primary p-1 hover:bg-primary/10 rounded-lg transition-all">
                            <FaEdit className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => deleteCustomSkill(s._id)} className="text-foreground-muted hover:text-destructive p-1">
                            <FaTrash className="w-3 h-3"/>
                          </button>
                        </div>
                      </div>
                      {s.description && <p className="text-xs opacity-70 mb-3 italic">{s.description}</p>}
                      {knowTags.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold opacity-70 mb-1.5">✅ Already know:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {knowTags.map((tag,i)=><span key={i} className="text-xs bg-success/20 text-success border border-success/30 px-2.5 py-1 rounded-full font-medium">{tag}</span>)}
                          </div>
                        </div>
                      )}
                      {learnTags.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold opacity-70 mb-1.5">🎯 Want to learn:</p>
                          <div className="flex flex-wrap gap-2">
                            {learnTags.map((tag,i)=>(
                              <div key={tag._id||i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${tag.addedToGoal?'bg-success/15 border-success/40 text-success':'bg-primary/10 border-primary/30 text-primary'}`}>
                                <span className="text-xs font-medium">{tag.name}</span>
                                {tag.addedToGoal?<span className="text-xs flex items-center gap-0.5 ml-1 opacity-80"><FaCheck className="w-2.5 h-2.5"/> Added</span>
                                 :tag._id?<button onClick={()=>addTagToGoal(s._id,tag._id!,tag.name)} className="flex items-center gap-0.5 text-xs bg-primary text-primary-foreground hover:bg-primary/80 px-1.5 py-0.5 rounded-lg transition-all ml-1"><FaPlus className="w-2 h-2"/> Goal</button>:null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Custom Skill Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-5">
                <div><h2 className="text-lg font-bold flex items-center gap-2"><FaStar className="text-secondary"/> Add Other Skill</h2>
                  <p className="text-xs text-foreground-muted mt-0.5">Fields marked <span className="text-destructive">*</span> are required</p></div>
                <button onClick={()=>setShowModal(false)}><FaTimes/></button>
              </div>
              <CustomFormFields form={customForm} setForm={setCustomForm}/>
              <button onClick={addCustomSkill} disabled={savingCustom||!customForm.skillName.trim()} className="btn-primary w-full mt-4 disabled:opacity-50">
                {savingCustom?'Adding...':'+ Add Custom Skill'}
              </button>
            </div>
          </div>
        )}

        {/* Edit Custom Skill Modal */}
        {editSkill && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2"><FaEdit className="text-primary"/> Edit Skill</h2>
                <button onClick={()=>setEditSkill(null)}><FaTimes/></button>
              </div>
              <CustomFormFields form={editForm} setForm={setEditForm}/>
              <button onClick={saveEditCustom} disabled={savingCustom} className="btn-primary w-full mt-4 disabled:opacity-50">
                {savingCustom?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 