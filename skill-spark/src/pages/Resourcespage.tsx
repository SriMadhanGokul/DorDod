import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import { FaPlus, FaTimes, FaTrash, FaFileAlt, FaExternalLinkAlt, FaDownload, FaUpload } from 'react-icons/fa';

interface Doc { _id:string; name:string; category:string; fileUrl:string; filePath:string; fileName:string; fileSize:number; notes:string; createdAt:string; }

const CATEGORIES = ['Resume','Portfolio','Educational','Cover Letter','Professional','Personal/KYC','Bank','Accomplishment','Other'];
const CAT_ICONS: Record<string,string> = {
  Resume:'📄', Portfolio:'🗂️', Educational:'🎓', 'Cover Letter':'✉️',
  Professional:'💼', 'Personal/KYC':'🪪', Bank:'🏦', Accomplishment:'🏆', Other:'📁',
};
const BASE = import.meta.env.VITE_API_URL || 'https://dordod-1.onrender.com';

const fmtSize = (bytes:number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
};

export default function ResourcesPage() {
  const [docs, setDocs]           = useState<Doc[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', category: '', fileUrl: '', notes: '',
  });
  const [uploadFile, setUploadFile]     = useState<File|null>(null);
  const [uploadMode, setUploadMode]     = useState<'file'|'url'>('file');

  useEffect(() => {
    api.get('/documents')
      .then(r => setDocs(r.data.data || []))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  const filtered  = filter === 'All' ? docs : docs.filter(d => d.category === filter);
  const grouped   = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(d => d.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string,Doc[]>);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Auto-fill name from filename if empty
      if (!form.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setForm(p => ({ ...p, name: nameWithoutExt }));
      }
    }
  };

  const validate = () => {
    if (!form.name.trim())  return 'Document name is required';
    if (!form.category)     return 'Please select a category';
    if (uploadMode === 'file' && !uploadFile)        return 'Please select a file to upload';
    if (uploadMode === 'url' && !form.fileUrl.trim()) return 'Please enter a file URL';
    return null;
  };

  const add = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('category', form.category);
      fd.append('notes', form.notes);
      if (uploadMode === 'file' && uploadFile) {
        fd.append('file', uploadFile);
      } else {
        fd.append('fileUrl', form.fileUrl);
      }
      const res = await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDocs(p => [res.data.data, ...p]);
      setForm({ name:'', category:'', fileUrl:'', notes:'' });
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setShowModal(false);
      toast.success('Document added!');
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed to add document'); }
    finally { setSaving(false); }
  };

  const del = async (id:string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs(p => p.filter(d => d._id !== id));
      toast.success('Deleted!');
    } catch { toast.error('Failed to delete'); }
  };

  const getDocUrl = (doc: Doc) => {
    if (doc.filePath) return `${BASE}${doc.filePath}`;
    if (doc.fileUrl)  return doc.fileUrl;
    return '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Resources</h1>
            <p className="text-foreground-muted mt-1">Manage all your documents and files</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <FaPlus/> Add Document
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground-muted hover:bg-accent'
              }`}>
              {CAT_ICONS[cat] || ''} {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-foreground-muted card-elevated">
            <FaFileAlt className="text-5xl mx-auto mb-3 opacity-20"/>
            <p className="text-lg font-medium">No documents yet</p>
            <p className="text-sm mt-1">Upload your first document to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto flex items-center gap-2">
              <FaPlus/> Add Document
            </button>
          </div>
        )}

        {/* Grouped document cards */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card-elevated">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span>{CAT_ICONS[cat]}</span> {cat}
              <span className="text-xs text-foreground-muted bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </h3>
            <div className="space-y-2">
              {items.map(doc => {
                const url = getDocUrl(doc);
                return (
                  <div key={doc._id} className="flex items-center justify-between p-3 bg-muted rounded-xl hover:bg-accent transition-all">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl shrink-0">{CAT_ICONS[doc.category] || '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {doc.fileName && (
                            <p className="text-xs text-foreground-muted truncate max-w-[160px]">{doc.fileName}</p>
                          )}
                          {doc.fileSize > 0 && (
                            <span className="text-xs text-foreground-muted">{fmtSize(doc.fileSize)}</span>
                          )}
                          <span className="text-xs text-foreground-muted">
                            {new Date(doc.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-foreground-muted italic mt-0.5 line-clamp-1">{doc.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {url && (
                        <>
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-foreground-muted hover:text-primary p-1.5 hover:bg-primary/10 rounded-lg transition-all"
                            title="Open">
                            <FaExternalLinkAlt className="w-3.5 h-3.5"/>
                          </a>
                          <a href={url} download={doc.fileName || doc.name}
                            className="text-foreground-muted hover:text-success p-1.5 hover:bg-success/10 rounded-lg transition-all"
                            title="Download">
                            <FaDownload className="w-3.5 h-3.5"/>
                          </a>
                        </>
                      )}
                      <button onClick={() => del(doc._id)}
                        className="text-foreground-muted hover:text-destructive p-1.5 hover:bg-destructive/10 rounded-lg transition-all"
                        title="Delete">
                        <FaTrash className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── ADD DOCUMENT MODAL ──────────────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FaFileAlt className="text-primary"/> Add Document
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Fields marked <span className="text-destructive">*</span> are required
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setUploadFile(null); setForm({ name:'', category:'', fileUrl:'', notes:'' }); }}>
                  <FaTimes/>
                </button>
              </div>

              <div className="space-y-4">
                {/* Document Name — mandatory */}
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Document Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    placeholder="e.g. My Resume 2026"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-field mt-1"
                    autoFocus
                  />
                </div>

                {/* Category — mandatory with Please select */}
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="input-field mt-1"
                  >
                    <option value="">Please select a category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </div>

                {/* Upload mode toggle */}
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    File Source <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setUploadMode('file')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        uploadMode === 'file' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground-muted hover:border-primary/30'
                      }`}>
                      <FaUpload className="w-3 h-3"/> Upload File
                    </button>
                    <button
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        uploadMode === 'url' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground-muted hover:border-primary/30'
                      }`}>
                      <FaExternalLinkAlt className="w-3 h-3"/> URL Link
                    </button>
                  </div>
                </div>

                {/* File upload */}
                {uploadMode === 'file' && (
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      Select File <span className="text-destructive">*</span>
                    </label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        uploadFile ? 'border-success bg-success/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'
                      }`}>
                      {uploadFile ? (
                        <div>
                          <p className="text-sm font-medium text-success">✅ {uploadFile.name}</p>
                          <p className="text-xs text-foreground-muted mt-1">{fmtSize(uploadFile.size)}</p>
                        </div>
                      ) : (
                        <div>
                          <FaUpload className="w-6 h-6 mx-auto mb-2 text-foreground-muted opacity-40"/>
                          <p className="text-sm text-foreground-muted">Click to select a file</p>
                          <p className="text-xs text-foreground-muted mt-1">PDF, DOC, DOCX, XLS, JPG, PNG, MP4 (max 10MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.txt"
                      onChange={handleFileChange}
                    />
                    {uploadFile && (
                      <button
                        onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="text-xs text-destructive hover:underline mt-1">
                        Remove file
                      </button>
                    )}
                  </div>
                )}

                {/* URL input */}
                {uploadMode === 'url' && (
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      File URL <span className="text-destructive">*</span>
                    </label>
                    <input
                      placeholder="https://drive.google.com/..."
                      value={form.fileUrl}
                      onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))}
                      className="input-field mt-1"
                    />
                    <p className="text-xs text-foreground-muted mt-1">Paste a Google Drive, Dropbox, or any public link</p>
                  </div>
                )}

                {/* Notes — optional */}
                <div>
                  <label className="text-xs font-medium text-foreground-muted">Notes (optional)</label>
                  <textarea
                    placeholder="Any additional notes about this document..."
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    className="input-field min-h-[60px] mt-1"
                  />
                </div>

                <button
                  onClick={add}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50 py-3">
                  {saving ? 'Uploading...' : '+ Add Document'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}