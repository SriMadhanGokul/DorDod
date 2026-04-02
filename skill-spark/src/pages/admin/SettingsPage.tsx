import AdminLayout from "@/components/admin/AdminLayout";
import { useState } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [making, setMaking] = useState(false);
  const [email, setEmail] = useState("");

  const makeAdmin = async () => {
    if (!email) return toast.error("Enter email");
    setMaking(true);
    try {
      const res = await api.get(`/admin/users?search=${email}&limit=5`);
      const user = res.data.data.users[0];
      if (!user) return toast.error("User not found");
      await api.patch(`/admin/users/${user._id}/role`, { role: "admin" });
      toast.success(`${user.name} is now an admin!`);
      setEmail("");
    } catch {
      toast.error("Failed");
    } finally {
      setMaking(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 text-sm">Admin panel configuration</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Promote User to Admin
          </h2>
          <div className="flex gap-3">
            <input
              placeholder="User email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={makeAdmin}
              disabled={making}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {making ? "..." : "Promote"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ Admin users have full access to all data
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-2">API Base URL</h2>
          <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block text-gray-600">
            http://localhost:5000/api
          </code>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-2">Admin Route</h2>
          <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block text-gray-600">
            /admin/* → Protected by adminProtect middleware
          </code>
        </div>
      </div>
    </AdminLayout>
  );
}
