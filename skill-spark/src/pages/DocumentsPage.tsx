import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaTrash,
  FaFileAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

interface Doc {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
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

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Resume",
    fileUrl: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/documents")
      .then((r) => setDocs(r.data.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All" ? docs : docs.filter((d) => d.category === filter);

  // Group by category for display
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const items = filtered.filter((d) => d.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<string, Doc[]>,
  );

  const add = async () => {
    if (!form.name.trim()) return toast.error("Document name is required");
    setSaving(true);
    try {
      const res = await api.post("/documents", form);
      setDocs((p) => [res.data.data, ...p]);
      setForm({ name: "", category: "Resume", fileUrl: "", notes: "" });
      setShowModal(false);
      toast.success("Document added!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocs((p) => p.filter((d) => d._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Documents</h1>
            <p className="text-foreground-muted mt-1">
              Manage all your documents
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> Add Document
          </button>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
            >
              {CAT_ICONS[c] || "📋"} {c}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <FaFileAlt className="text-4xl mx-auto mb-3 opacity-30" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm mt-1">Upload your first document!</p>
          </div>
        )}

        {/* Grouped by category */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card-elevated">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>{CAT_ICONS[cat]}</span> {cat}{" "}
              <span className="text-xs text-foreground-muted">
                ({items.length})
              </span>
            </h3>
            <div className="space-y-2">
              {items.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="text-primary text-sm" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      {doc.notes && (
                        <p className="text-xs text-foreground-muted">
                          {doc.notes}
                        </p>
                      )}
                      <p className="text-xs text-foreground-muted">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="w-3 h-3" /> View
                      </a>
                    )}
                    <button
                      onClick={() => del(doc._id)}
                      className="text-foreground-muted hover:text-destructive"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Add Document</h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Document name *"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="input-field"
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="input-field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  placeholder="File URL (optional)"
                  value={form.fileUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fileUrl: e.target.value }))
                  }
                  className="input-field"
                />
                <textarea
                  placeholder="Notes (optional)"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="input-field min-h-[60px]"
                />
                <button
                  onClick={add}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Document"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
