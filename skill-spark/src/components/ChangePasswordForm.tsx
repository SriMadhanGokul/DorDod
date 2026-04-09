import { useState } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [show, setShow] = useState({ curr: false, new_: false, conf: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 6)
      return toast.error("New password must be at least 6 characters");
    if (form.newPassword !== form.confirm)
      return toast.error("Passwords do not match");
    setSaving(true);
    try {
      const res = await api.patch("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(res.data.message);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "input-field pl-11 pr-11";

  return (
    <div className="card-elevated">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FaLock className="text-primary" /> Change Password
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          {
            key: "currentPassword",
            label: "Current Password",
            showKey: "curr" as const,
          },
          {
            key: "newPassword",
            label: "New Password",
            showKey: "new_" as const,
          },
          {
            key: "confirm",
            label: "Confirm New Password",
            showKey: "conf" as const,
          },
        ].map((field) => (
          <div key={field.key} className="relative">
            <label className="text-xs text-foreground-muted font-medium">
              {field.label}
            </label>
            <div className="relative mt-1">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted w-3.5 h-3.5" />
              <input
                type={show[field.showKey] ? "text" : "password"}
                value={(form as any)[field.key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [field.key]: e.target.value }))
                }
                className={inputClass}
                required={field.key !== "currentPassword" || true}
              />
              <button
                type="button"
                onClick={() =>
                  setShow((p) => ({ ...p, [field.showKey]: !p[field.showKey] }))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {show[field.showKey] ? (
                  <FaEyeSlash className="w-3.5 h-3.5" />
                ) : (
                  <FaEye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}

        {form.newPassword.length > 0 && (
          <div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    form.newPassword.length >= i * 3
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
            <p className="text-xs text-foreground-muted mt-1">
              {form.newPassword.length < 6
                ? "Too short"
                : form.newPassword.length < 9
                  ? "Weak"
                  : form.newPassword.length < 12
                    ? "Good"
                    : "Strong"}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
