import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  FaPlus, FaTimes, FaTrash, FaFilePdf, FaImage,
  FaExternalLinkAlt, FaDownload, FaUpload, FaEdit, FaCheck,
} from 'react-icons/fa';

interface Doc {
  _id:string; name:string; category:string;
  fileUrl:string; filePath:string; fileName:string;
  fileSize:number; mimeType:string; notes:string; createdAt:string;
}

const CATEGORIES = ['Resume','Portfolio','Educational','Cover Letter','Professional','Personal/KYC','Bank','Accomplishment','Other'];
const CAT_ICONS: Record<string,string> = {
  Resume:'📄', Portfolio:'🗂️', Educational:'🎓', 'Cover Letter':'✉️',
  Professional:'💼', 'Personal/KYC':'🪪', Bank:'🏦', Accomplishment:'🏆', Other:'📁',
};
const BASE = (import.meta as any).env?.VITE_API_URL || 'https://dordod-1.onrender.com';

const fmtSize = (bytes:number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
};

const isImage = (fileName:string, mimeType:string) =>
  ['jpg','jpeg','png','gif','webp'].some(ext => fileName?.toLowerCase().endsWith(ext)) ||
  mimeType?.startsWith('image/');

const isPdf = (fileName:string, mimeType:string) =>
  fileName?.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

export default function Resourcespage() {
  const [docs, setDocs]             = useState<Doc[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('All');
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);

  // Upload form
  const [form, setForm]             = useState({ name:'', category:'', fileUrl:'', notes:'' });
  const [uploadFile, setUploadFile] = useState<File|null>(null);
  const [uploadMode, setUploadMode] = useState<'file'|'url'>('file');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileRef                     = useRef<HTMLInputElement>(null);

  // Edit form
  const [editDoc, setEditDoc]       = useState<Doc|null>(null);
  const [editForm, setEditForm]     = useState({ name:'', category:'', notes:'' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Lightbox
  const [lightbox, setLightbox]     = useState<string|null>(null);

  useEffect(() => {
    api.get('/documents')
      .then(r => setDocs(r.data.data || []))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? docs : docs.filter(d => d.category === filter);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(d => d.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Doc[]>);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type — only images and PDF
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const allowed = ['pdf','jpg','jpeg','png','gif','webp'];
    if (!allowed.includes(ext)) {
      toast.error('Only images (JPG, PNG, GIF, WebP) and PDF files are allowed');
      e.target.value = '';
      return;
    }

    // Validate size — 10MB max
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      e.target.value = '';
      return;
    }

    setUploadFile(file);
    // Auto-fill name from filename if empty
    if (!form.name) {
      setForm(p => ({ ...p, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
    // Set preview for images
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl('');
    }
  };

  const validate = () => {
    if (!form.name.trim())  return 'Document name is required';
    if (!form.category)     return 'Please select a category';
    if (uploadMode === 'file' && !uploadFile) return 'Please select a file to upload';
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
      const res = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocs(p => [res.data.data, ...p]);
      setForm({ name:'', category:'', fileUrl:'', notes:'' });
      setUploadFile(null);
      setPreviewUrl('');
      if (fileRef.current) fileRef.current.value = '';
      setShowModal(false);
      toast.success('Document added!');
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Failed to add document');
    } finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    if (!editForm.name.trim()) return toast.error('Document name is required');
    if (!editForm.category)    return toast.error('Please select a category');
    setSavingEdit(true);
    try {
      const res = await api.put(`/documents/${editDoc._id}`, editForm);
      setDocs(p => p.map(d => d._id === editDoc._id ? { ...d, ...editForm } : d));
      setEditDoc(null);
      toast.success('Updated!');
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Failed to update');
    } finally { setSavingEdit(false); }
  };

  const del = async (id:string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs(p => p.filter(d => d._id !== id));
      toast.success('Deleted!');
    } catch { toast.error('Failed to delete'); }
  };

  const getDocUrl = (doc:Doc) => {
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
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            <p className="text-sm text-gray-500 mt-0.5">Upload and manage your documents — Images & PDF only</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2">
            <FaPlus className="w-3 h-3"/> Add Document
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
              {CAT_ICONS[cat] || ''} {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FaFilePdf className="text-5xl mx-auto mb-3 text-gray-200"/>
            <p className="text-lg font-semibold text-gray-700">No documents yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload images or PDF files to get started</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Add First Document
            </button>
          </div>
        )}

        {/* Grouped document cards */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
              {CAT_ICONS[cat]} {cat}
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
            </h3>
            <div className="space-y-3">
              {items.map(doc => {
                const url    = getDocUrl(doc);
                const docIsImg = isImage(doc.fileName, doc.mimeType);
                const docIsPdf = isPdf(doc.fileName, doc.mimeType);
                return (
                  <div key={doc._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                    {/* Thumbnail / Icon */}
                    <div
                      onClick={() => docIsImg && url && setLightbox(url)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${docIsImg ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300' : ''}`}>
                      {docIsImg && url ? (
                        <img src={url} alt={doc.name} className="w-12 h-12 object-cover rounded-xl"/>
                      ) : docIsPdf ? (
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <FaFilePdf className="text-red-500 text-xl"/>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                          <span className="text-xl">{CAT_ICONS[doc.category] || '📄'}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {doc.fileName && (
                          <span className="text-xs text-gray-400 truncate max-w-[160px]">{doc.fileName}</span>
                        )}
                        {doc.fileSize > 0 && (
                          <span className="text-xs text-gray-400">{fmtSize(doc.fileSize)}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docIsPdf ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {docIsPdf ? 'PDF' : 'Image'}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{doc.notes}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {url && (
                        <>
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Open">
                            <FaExternalLinkAlt className="w-3.5 h-3.5"/>
                          </a>
                          <a href={url} download={doc.fileName || doc.name}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Download">
                            <FaDownload className="w-3.5 h-3.5"/>
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => { setEditDoc(doc); setEditForm({ name:doc.name, category:doc.category, notes:doc.notes||'' }); }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                        <FaEdit className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={() => del(doc._id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
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
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md my-auto shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Document</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Images (JPG, PNG, GIF, WebP) and PDF only • Max 10MB</p>
                </div>
                <button onClick={() => { setShowModal(false); setUploadFile(null); setPreviewUrl(''); setForm({ name:'', category:'', fileUrl:'', notes:'' }); }}>
                  <FaTimes className="text-gray-400 w-4 h-4"/>
                </button>
              </div>

              <div className="space-y-4">
                {/* Document Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    Document Name <span className="text-red-400">*</span>
                  </label>
                  <input placeholder="e.g. My Resume 2026" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" autoFocus/>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    <option value="">Please select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>

                {/* Upload mode toggle */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                    File Source <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setUploadMode('file')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${uploadMode === 'file' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                      <FaUpload className="w-3.5 h-3.5"/> Upload File
                    </button>
                    <button onClick={() => setUploadMode('url')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${uploadMode === 'url' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                      <FaExternalLinkAlt className="w-3.5 h-3.5"/> URL Link
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                {uploadMode === 'file' && (
                  <div>
                    <input ref={fileRef} type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,application/pdf"
                      className="hidden" onChange={handleFileChange}/>

                    {!uploadFile ? (
                      <div onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <FaFilePdf className="text-red-500 text-xl"/>
                          </div>
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <FaImage className="text-green-500 text-xl"/>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Click to upload</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, GIF, WebP</p>
                        <p className="text-xs text-gray-300 mt-0.5">Maximum 10MB</p>
                      </div>
                    ) : (
                      <div className="border-2 border-indigo-200 bg-indigo-50 rounded-xl p-4">
                        {previewUrl ? (
                          <div className="relative mb-3">
                            <img src={previewUrl} alt="Preview" className="w-full max-h-40 object-cover rounded-xl"/>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                              <FaFilePdf className="text-white text-lg"/>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{uploadFile.name}</p>
                              <p className="text-xs text-gray-500">{fmtSize(uploadFile.size)}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <FaCheck className="w-3 h-3"/> Ready to upload
                          </span>
                          <button onClick={() => { setUploadFile(null); setPreviewUrl(''); if (fileRef.current) fileRef.current.value = ''; }}
                            className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Input */}
                {uploadMode === 'url' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      File URL <span className="text-red-400">*</span>
                    </label>
                    <input placeholder="https://drive.google.com/..." value={form.fileUrl}
                      onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
                    <p className="text-xs text-gray-400 mt-1">Paste a Google Drive, Dropbox, or any public link</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notes (optional)</label>
                  <textarea placeholder="Any notes about this document..." value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"/>
                </div>

                <button onClick={add} disabled={saving}
                  className="bg-indigo-600 text-white w-full py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all">
                  {saving ? 'Uploading...' : '+ Add Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT MODAL ──────────────────────────────────────────────────── */}
        {editDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md my-auto shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaEdit className="text-indigo-500"/> Edit Document
                </h2>
                <button onClick={() => setEditDoc(null)}><FaTimes className="text-gray-400 w-4 h-4"/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    Document Name <span className="text-red-400">*</span>
                  </label>
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" autoFocus/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none">
                    <option value="">Please select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"/>
                </div>
                <button onClick={saveEdit} disabled={savingEdit}
                  className="bg-indigo-600 text-white w-full py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingEdit ? 'Saving...' : <><FaCheck className="w-3 h-3"/> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="Preview" className="max-w-full max-h-full rounded-xl object-contain"/>
            <button onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
              <FaTimes className="w-4 h-4"/>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}