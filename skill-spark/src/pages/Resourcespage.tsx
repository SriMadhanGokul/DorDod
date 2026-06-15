import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaTrash,
  FaFilePdf,
  FaImage,
  FaExternalLinkAlt,
  FaDownload,
  FaUpload,
  FaEdit,
  FaCheck,
  FaFile,
} from "react-icons/fa";

interface Doc {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  notes: string;
  createdAt: string;
}

const CATEGORIES = [
  "Resume",
  "Portfolio",
  "Educational",
  "Cover Letter",
  "Professional",
  "Personal/KYC",
  "Bank",
  "Accomplishment",
  "Other",
];
const CAT_ICONS: Record<string, string> = {
  Resume: "📄",
  Portfolio: "🗂️",
  Educational: "🎓",
  "Cover Letter": "✉️",
  Professional: "💼",
  "Personal/KYC": "🪪",
  Bank: "🏦",
  Accomplishment: "🏆",
  Other: "📁",
};

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const fmtSize = (bytes: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getFileType = (fileName: string, mimeType: string) => {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  if (
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ||
    mimeType?.startsWith("image/")
  )
    return "image";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  return "file";
};

const FileIcon = ({
  fileName,
  mimeType,
  url,
  size = "lg",
}: {
  fileName: string;
  mimeType: string;
  url: string;
  size?: "sm" | "lg";
}) => {
  const type = getFileType(fileName, mimeType);
  const s = size === "lg" ? "w-12 h-12 text-xl" : "w-8 h-8 text-sm";
  if (type === "image" && url)
    return (
      <img
        src={url}
        alt=""
        className={`${size === "lg" ? "w-12 h-12" : "w-8 h-8"} rounded-xl object-cover shrink-0 cursor-pointer`}
      />
    );
  if (type === "pdf")
    return (
      <div
        className={`${s} bg-red-100 rounded-xl flex items-center justify-center shrink-0`}
      >
        <FaFilePdf className="text-red-500" />
      </div>
    );
  return (
    <div
      className={`${s} bg-gray-100 rounded-xl flex items-center justify-center shrink-0`}
    >
      <FaFile className="text-gray-500" />
    </div>
  );
};

export default function ResourcesPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", category: "", notes: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    api
      .get("/documents")
      .then((r) => setDocs(r.data.data || []))
      .catch(() => toast.error("Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All" ? docs : docs.filter((d) => d.category === filter);
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const items = filtered.filter((d) => d.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<string, Doc[]>,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 2MB limit
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    // Only images and PDF
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
    if (!allowed.includes(ext)) {
      toast.error(
        "Only images (JPG, PNG, GIF, WebP) and PDF files are allowed.",
      );
      e.target.value = "";
      return;
    }

    setUploadFile(file);
    if (!form.name)
      setForm((p) => ({ ...p, name: file.name.replace(/\.[^/.]+$/, "") }));
    if (file.type.startsWith("image/"))
      setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl("");
  };

  const resetModal = () => {
    setShowModal(false);
    setUploadFile(null);
    setPreviewUrl("");
    setForm({ name: "", category: "", notes: "" });
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const add = async () => {
    if (!form.name.trim()) return toast.error("Document name is required");
    if (!form.category) return toast.error("Please select a category");
    if (!uploadFile) return toast.error("Please select a file");

    setSaving(true);
    setUploading(true);
    setUploadProgress(10);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("category", form.category);
      fd.append("notes", form.notes);
      fd.append("file", uploadFile);
      setUploadProgress(40);

      const res = await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 80));
        },
      });

      setUploadProgress(100);
      setDocs((p) => [res.data.data, ...p]);
      resetModal();
      toast.success("Document uploaded! ✅");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    if (!editForm.name.trim()) return toast.error("Name is required");
    if (!editForm.category) return toast.error("Please select a category");
    setSavingEdit(true);
    try {
      await api.put(`/documents/${editDoc._id}`, editForm);
      setDocs((p) =>
        p.map((d) => (d._id === editDoc._id ? { ...d, ...editForm } : d)),
      );
      setEditDoc(null);
      toast.success("Updated!");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingEdit(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs((p) => p.filter((d) => d._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resources
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Files stored securely on Cloudinary
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
        >
          <FaPlus className="w-3 h-3" /> Add Document
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === cat
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300"
            }`}
          >
            {CAT_ICONS[cat] || ""} {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <FaUpload className="text-5xl mx-auto mb-3 text-gray-200" />
          <p className="text-lg font-semibold text-gray-700 dark:text-white">
            No documents yet
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Upload images or PDFs — max 2MB each
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            Upload First Document
          </button>
        </div>
      )}

      {/* Grouped documents */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div
          key={cat}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
        >
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            {CAT_ICONS[cat]} {cat}
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </h3>
          <div className="space-y-3">
            {items.map((doc) => {
              const type = getFileType(doc.fileName, doc.mimeType);
              return (
                <div
                  key={doc._id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
                >
                  <div
                    onClick={() =>
                      type === "image" &&
                      doc.fileUrl &&
                      setLightbox(doc.fileUrl)
                    }
                  >
                    <FileIcon
                      fileName={doc.fileName}
                      mimeType={doc.mimeType}
                      url={doc.fileUrl}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {doc.fileName && (
                        <span className="text-xs text-gray-400 truncate max-w-[160px]">
                          {doc.fileName}
                        </span>
                      )}
                      {doc.fileSize > 0 && (
                        <span className="text-xs text-gray-400">
                          {fmtSize(doc.fileSize)}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          type === "pdf"
                            ? "bg-red-100 text-red-600"
                            : type === "image"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {type.toUpperCase()}
                      </span>
                      <span className="text-xs text-indigo-500 font-medium">
                        ☁️ Cloud
                      </span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">
                        {doc.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.fileUrl && (
                      <>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Open"
                        >
                          <FaExternalLinkAlt className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={doc.fileUrl}
                          download={doc.fileName || doc.name}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Download"
                        >
                          <FaDownload className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setEditDoc(doc);
                        setEditForm({
                          name: doc.name,
                          category: doc.category,
                          notes: doc.notes || "",
                        });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => del(doc._id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ADD DOCUMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Add Document
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  ☁️ Images (JPG, PNG, WebP) & PDF only · Max {MAX_SIZE_MB}MB
                </p>
              </div>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Document Name <span className="text-red-400">*</span>
                </label>
                <input
                  placeholder="e.g. My Resume 2026"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Please select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CAT_ICONS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload area */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  File <span className="text-red-400">*</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,.pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {!uploadFile ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <FaFilePdf className="text-red-500 text-xl" />
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <FaImage className="text-green-500 text-xl" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-white">
                      Click to choose file
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, GIF, WebP, PDF
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Maximum {MAX_SIZE_MB}MB
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-32 object-cover rounded-xl mb-3"
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <FileIcon
                        fileName={uploadFile.name}
                        mimeType={uploadFile.type}
                        url={previewUrl}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {fmtSize(uploadFile.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setUploadFile(null);
                          setPreviewUrl("");
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <FaTimes className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Any notes about this document..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                />
              </div>

              {uploading && uploadProgress > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={add}
                disabled={saving}
                className="bg-indigo-600 text-white w-full py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="w-3.5 h-3.5" /> Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaEdit className="text-indigo-500" /> Edit Document
              </h2>
              <button
                onClick={() => setEditDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Document Name *
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Category *
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none"
                >
                  <option value="">Please select</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CAT_ICONS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="bg-indigo-600 text-white w-full py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingEdit ? (
                  "Saving..."
                ) : (
                  <>
                    <FaCheck className="w-3 h-3" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Preview"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
