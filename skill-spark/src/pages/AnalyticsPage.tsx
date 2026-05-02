import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  FaPlus, FaTimes, FaTrash, FaFire, FaTrophy, FaLightbulb,
  FaCheck, FaCircle, FaChevronDown, FaChevronUp, FaEdit, FaClock,
} from 'react-icons/fa';

interface Activity {
  _id:string; title:string; description:string;
  status:'todo'|'inprogress'|'done'|'Completed';
  priority:'High'|'Medium'|'Low';
  dueDate?:string; startDate?:string;
  linkedGoal?:{_id:string;title:string;category:string};
  goalTitle:string; addedToHabit:boolean; addedToAchievement:boolean;
}
interface Goal { _id:string; title:string; category:string; }

const STATUS_CFG = {
  todo:       { label:'To Do',       icon:FaCircle, color:'text-foreground-muted', bg:'bg-muted border-border',          dot:'bg-muted-foreground' },
  inprogress: { label:'In Progress', icon:FaClock,  color:'text-primary',         bg:'bg-primary/10 border-primary/30',  dot:'bg-primary'         },
  done:       { label:'Done',        icon:FaCheck,  color:'text-success',         bg:'bg-success/10 border-success/30',  dot:'bg-success'         },
  Completed:  { label:'Completed',   icon:FaCheck,  color:'text-success',         bg:'bg-success/10 border-success/30',  dot:'bg-success'         },
};
const PRI_COLOR = { High:'bg-destructive/10 text-destructive', Medium:'bg-secondary/20 text-secondary-foreground', Low:'bg-muted text-foreground-muted' };

const EMPTY = { title:'', description:'', priority:'Medium', dueDate:'', startDate:'', linkedGoal:'' };

export default function ActivitiesPage() {
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [goals, setGoals]             = useState<Goal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGoal, setFilterGoal]   = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<{title:string}[]>([]);
  const [suggestGoal, setSuggestGoal] = useState('');
  const [expandedGoals, setExpanded]  = useState<Set<string>>(new Set());
  const [habitModal, setHabitModal]   = useState<{id:string;title:string}|null>(null);
  const [achModal, setAchModal]       = useState<{id:string;title:string}|null>(null);
  const [achDesc, setAchDesc]         = useState('');
  const [form, setForm]               = useState({...EMPTY});
  const [saving, setSaving]           = useState(false);
  const [editActivity, setEditActivity] = useState<Activity|null>(null);
  const [editForm, setEditForm]       = useState({...EMPTY});

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, gRes] = await Promise.all([api.get('/activities'), api.get('/goals')]);
        setActivities(aRes.data.data);
        setGoals(gRes.data.data);
        const ids = new Set<string>(aRes.data.data.map((a:Activity) => a.linkedGoal?._id || 'ungrouped'));
        setExpanded(ids);
      } catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Validate mandatory fields per client requirement
  const validateForm = (f: typeof EMPTY) => {
    if (!f.title.trim())   return 'Title is required';
    if (!f.priority)       return 'Priority is required';
    if (!f.dueDate)        return 'Due date is required';
    if (!f.startDate)      return 'Start date is required';
    if (!f.linkedGoal)     return 'Please select a Goal to link this activity';
    return null;
  };

  const fetchSuggestions = async (goalId:string) => {
    if (!goalId) return;
    try {
      const res = await api.get(`/activities/suggestions/${goalId}`);
      setSuggestions(res.data.data); setSuggestGoal(goalId); setShowSuggest(true);
    } catch { toast.error('Failed to load suggestions'); }
  };

  const addSuggestion = async (title:string) => {
    try {
      const res = await api.post('/activities', { title, linkedGoal:suggestGoal, priority:'Medium',
        startDate: new Date().toISOString().slice(0,10),
        dueDate: new Date(Date.now()+7*86400000).toISOString().slice(0,10) });
      setActivities(p=>[res.data.data,...p]); toast.success('Activity added!');
    } catch { toast.error('Failed'); }
  };

  const create = async () => {
    const err = validateForm(form);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.post('/activities', { ...form, goalId: form.linkedGoal });
      setActivities(p=>[res.data.data,...p]);
      setForm({...EMPTY}); setShowModal(false);
      toast.success('Activity created!');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (a:Activity) => {
    setEditActivity(a);
    setEditForm({ title:a.title, description:a.description||'', priority:a.priority,
      dueDate:a.dueDate?.slice(0,10)||'', startDate:(a.startDate as any)?.slice(0,10)||'',
      linkedGoal: a.linkedGoal?._id||'' });
  };

  const saveEdit = async () => {
    if (!editActivity) return;
    const err = validateForm(editForm);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.put(`/activities/${editActivity._id}`, { ...editForm, goalId: editForm.linkedGoal });
      setActivities(p=>p.map(a=>a._id===editActivity._id?res.data.data:a));
      setEditActivity(null); toast.success('Updated!');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id:string, status:string) => {
    try {
      const res = await api.patch(`/activities/${id}/status`, { status });
      setActivities(p=>p.map(a=>a._id===id?res.data.data:a));
    } catch { toast.error('Failed'); }
  };

  const addHabit = async () => {
    if (!habitModal) return;
    try {
      await api.post(`/activities/${habitModal.id}/add-habit`, {});
      setActivities(p=>p.map(a=>a._id===habitModal.id?{...a,addedToHabit:true}:a));
      toast.success('🔥 Added as Habit!'); setHabitModal(null);
    } catch (e:any) { toast.error(e.response?.data?.message||'Failed'); }
  };

  const addAchievement = async () => {
    if (!achModal) return;
    try {
      await api.post(`/activities/${achModal.id}/add-achievement`, { description:achDesc });
      setActivities(p=>p.map(a=>a._id===achModal.id?{...a,addedToAchievement:true}:a));
      toast.success('🏆 Achievement created!'); setAchModal(null); setAchDesc('');
    } catch (e:any) { toast.error(e.response?.data?.message||'Failed'); }
  };

  const del = async (id:string) => {
    if (!confirm('Delete this activity?')) return;
    try { await api.delete(`/activities/${id}`); setActivities(p=>p.filter(a=>a._id!==id)); toast.success('Deleted!'); }
    catch { toast.error('Failed'); }
  };

  const toggleGroup = (id:string) => setExpanded(prev => {
    const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s;
  });

  const getNorm = (s:string) => {
    const low = (s||'todo').toLowerCase().replace(/[^a-z]/g,'');
    if (low==='done'||low==='completed') return 'done';
    if (low==='inprogress'||low==='inprog') return 'inprogress';
    return 'todo';
  };

  const filtered = activities.filter(a => {
    const norm = getNorm(a.status);
    const matchStatus = filterStatus==='all' || norm===filterStatus;
    const matchGoal   = !filterGoal || a.linkedGoal?._id===filterGoal;
    return matchStatus && matchGoal;
  });

  const grouped = filtered.reduce((acc,a) => {
    const key   = a.linkedGoal?._id||'ungrouped';
    const label = a.goalTitle||a.linkedGoal?.title||'No Goal';
    if (!acc[key]) acc[key]={label,items:[]};
    acc[key].items.push(a); return acc;
  },{} as Record<string,{label:string;items:Activity[]}>);

  const counts = {
    todo:       filtered.filter(a=>getNorm(a.status)==='todo').length,
    inprogress: filtered.filter(a=>getNorm(a.status)==='inprogress').length,
    done:       filtered.filter(a=>getNorm(a.status)==='done').length,
  };

  // Shared form UI
  const FormFields = ({ f, setF }:{f:any;setF:any}) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground-muted">Title <span className="text-destructive">*</span></label>
        <input placeholder="Activity title" value={f.title} onChange={e=>setF((p:any)=>({...p,title:e.target.value}))} className="input-field mt-1" autoFocus/>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">Link to Goal <span className="text-destructive">*</span></label>
        <select value={f.linkedGoal} onChange={e=>setF((p:any)=>({...p,linkedGoal:e.target.value}))} className="input-field mt-1">
          <option value="">Please select a goal</option>
          {goals.map(g=><option key={g._id} value={g._id}>{g.title}</option>)}
        </select>
        <p className="text-xs text-foreground-muted mt-0.5">Activities must be linked to a goal (21 activities per goal)</p>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">Description</label>
        <textarea placeholder="Description (optional)" value={f.description} onChange={e=>setF((p:any)=>({...p,description:e.target.value}))} className="input-field min-h-[60px] mt-1"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">Priority <span className="text-destructive">*</span></label>
          <select value={f.priority} onChange={e=>setF((p:any)=>({...p,priority:e.target.value}))} className="input-field mt-1">
            <option value="">Please select priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground-muted">Start Date <span className="text-destructive">*</span></label>
          <input type="date" value={f.startDate} onChange={e=>setF((p:any)=>({...p,startDate:e.target.value}))} className="input-field mt-1"/>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">Due Date <span className="text-destructive">*</span></label>
        <input type="date" value={f.dueDate} onChange={e=>setF((p:any)=>({...p,dueDate:e.target.value}))} className="input-field mt-1"/>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl md:text-3xl font-bold">Execution</h1>
            <p className="text-foreground-muted mt-1">21 activities per goal · linked actions drive your Alignment Score</p></div>
          <div className="flex gap-2">
            <button onClick={()=>setShowSuggest(true)} className="btn-secondary text-sm flex items-center gap-2"><FaLightbulb className="text-secondary"/> Suggest</button>
            <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><FaPlus/> Add Activity</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[{label:'To Do',val:counts.todo,color:'text-foreground-muted',bg:'bg-muted'},
            {label:'In Progress',val:counts.inprogress,color:'text-primary',bg:'bg-primary/10'},
            {label:'Done',val:counts.done,color:'text-success',bg:'bg-success/10'}].map((s,i)=>(
            <div key={i} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-foreground-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {['all','todo','inprogress','done'].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus===s?'bg-primary text-primary-foreground':'bg-muted text-foreground-muted hover:bg-accent'}`}>
                {s==='all'?'All':s==='inprogress'?'In Progress':s}
              </button>
            ))}
          </div>
          <select value={filterGoal} onChange={e=>setFilterGoal(e.target.value)} className="input-field text-sm sm:w-56">
            <option value="">All Goals</option>
            {goals.map(g=><option key={g._id} value={g._id}>{g.title}</option>)}
          </select>
        </div>

        {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}
        {!loading && filtered.length===0 && (
          <div className="text-center py-16 text-foreground-muted card-elevated">
            <FaCircle className="text-4xl mx-auto mb-3 opacity-20"/>
            <p className="font-medium">No activities yet</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={()=>setShowModal(true)} className="btn-primary text-sm">+ Add Activity</button>
              <button onClick={()=>setShowSuggest(true)} className="btn-secondary text-sm">💡 Get Suggestions</button>
            </div>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([goalKey,group])=>(
          <div key={goalKey} className="card-elevated">
            <button onClick={()=>toggleGroup(goalKey)} className="w-full flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">🎯 {group.label}</span>
                <span className="text-xs text-foreground-muted">({group.items.length}/21)</span>
              </div>
              {expandedGoals.has(goalKey)?<FaChevronUp className="text-foreground-muted w-3 h-3"/>:<FaChevronDown className="text-foreground-muted w-3 h-3"/>}
            </button>
            {expandedGoals.has(goalKey) && (
              <div className="space-y-2 mt-3">
                {group.items.map(a => {
                  const norm = getNorm(a.status);
                  const scfg = STATUS_CFG[norm as keyof typeof STATUS_CFG] || STATUS_CFG['todo'];
                  return (
                    <div key={a._id} className={`p-3 rounded-xl border transition-all ${scfg?.bg||'bg-muted border-border'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${scfg?.dot||'bg-muted-foreground'}`}/>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${norm==='done'?'line-through opacity-60':''}`}>{a.title}</p>
                            {a.description && <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{a.description}</p>}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRI_COLOR[a.priority]||''}`}>{a.priority}</span>
                              {(a as any).startDate && <span className="text-xs text-foreground-muted">▶ {new Date((a as any).startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                              {a.dueDate && <span className="text-xs text-foreground-muted">📅 {new Date(a.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                              {a.addedToHabit && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">🔥 Habit</span>}
                              {a.addedToAchievement && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">🏆 Achievement</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select value={norm==='done'?'done':a.status} onChange={e=>updateStatus(a._id,e.target.value)}
                            className="text-xs border border-current rounded-lg px-2 py-1 bg-transparent cursor-pointer">
                            <option value="todo">⬜ To Do</option>
                            <option value="inprogress">🔄 In Progress</option>
                            <option value="done">✅ Done</option>
                          </select>
                          <button onClick={()=>openEdit(a)} className="text-foreground-muted hover:text-primary p-1 hover:bg-primary/10 rounded-lg transition-all"><FaEdit className="w-3.5 h-3.5"/></button>
                          {!a.addedToHabit && (
                            <button onClick={()=>setHabitModal({id:a._id,title:a.title})}
                              className="text-xs border border-border bg-card hover:border-destructive hover:text-destructive text-foreground-muted px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                              <FaFire className="w-2.5 h-2.5"/> Habit
                            </button>
                          )}
                          {(norm==='done'||a.status==='Completed') && !a.addedToAchievement && (
                            <button onClick={()=>setAchModal({id:a._id,title:a.title})}
                              className="text-xs border border-border bg-card hover:border-secondary hover:text-secondary text-foreground-muted px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                              <FaTrophy className="w-2.5 h-2.5"/> Award
                            </button>
                          )}
                          <button onClick={()=>del(a._id)} className="text-foreground-muted hover:text-destructive p-1"><FaTrash className="w-3 h-3"/></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div><h2 className="font-bold text-lg flex items-center gap-2"><FaPlus className="text-primary"/> New Activity</h2>
                  <p className="text-xs text-foreground-muted mt-0.5">Fields marked <span className="text-destructive">*</span> are required</p></div>
                <button onClick={()=>setShowModal(false)}><FaTimes/></button>
              </div>
              <FormFields f={form} setF={setForm}/>
              <button onClick={create} disabled={saving} className="btn-primary w-full mt-4 disabled:opacity-50">{saving?'Creating...':'Create Activity'}</button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editActivity && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><FaEdit className="text-primary"/> Edit Activity</h2>
                <button onClick={()=>setEditActivity(null)}><FaTimes/></button>
              </div>
              <FormFields f={editForm} setF={setEditForm}/>
              <button onClick={saveEdit} disabled={saving} className="btn-primary w-full mt-4 disabled:opacity-50">{saving?'Saving...':'Save Changes'}</button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {showSuggest && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><FaLightbulb className="text-secondary"/> Suggestions</h2>
                <button onClick={()=>setShowSuggest(false)}><FaTimes/></button>
              </div>
              <select onChange={e=>fetchSuggestions(e.target.value)} className="input-field mb-3">
                <option value="">Please select a goal</option>
                {goals.map(g=><option key={g._id} value={g._id}>{g.title}</option>)}
              </select>
              <div className="space-y-2">
                {suggestions.map((s,i)=>{
                  const exists=activities.some(a=>a.title===s.title);
                  return (
                    <button key={i} disabled={exists} onClick={()=>addSuggestion(s.title)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${exists?'border-success/30 bg-success/10 text-success cursor-default':'border-border hover:border-primary hover:bg-primary/5'}`}>
                      {exists?'✅':'+'} {s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Habit Modal */}
        {habitModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2"><FaFire className="text-destructive"/> Add to Behavior</h2>
                <button onClick={()=>setHabitModal(null)}><FaTimes/></button>
              </div>
              <div className="bg-muted rounded-xl p-3 mb-4"><p className="text-sm font-medium">"{habitModal.title}"</p>
                <p className="text-xs text-foreground-muted mt-0.5">will become a daily habit</p></div>
              <button onClick={addHabit} className="btn-primary w-full">🔥 Add as Behavior Habit</button>
            </div>
          </div>
        )}

        {/* Achievement Modal */}
        {achModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2"><FaTrophy className="text-secondary"/> Create Outcome</h2>
                <button onClick={()=>setAchModal(null)}><FaTimes/></button>
              </div>
              <div className="bg-success/10 border border-success/30 rounded-xl p-3 mb-3">
                <p className="text-sm font-medium text-success">🏆 "{achModal.title}"</p></div>
              <textarea placeholder="Add a note (optional)" value={achDesc} onChange={e=>setAchDesc(e.target.value)} className="input-field min-h-[70px] mb-3"/>
              <button onClick={addAchievement} className="btn-primary w-full">🏆 Create Outcome</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}