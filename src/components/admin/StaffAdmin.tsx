import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, X } from "lucide-react";
import { useI18n } from "../../pages/AdminApp";
import { useDialog } from "../CustomDialogContext";
import { db } from "../../lib/db";

export function StaffAdmin({ currentStaff }: { currentStaff?: any }) {
  const [staff, setStaff] = useState<{id: string, name: string, email: string, role: string, status: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useI18n();
  const { showAlert } = useDialog();
  const [showModal, setShowModal] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("worker");
  const [status, setStatus] = useState("pending_approval");

  const isSuperAdmin = currentStaff?.role === "super_admin";
  const isHR = currentStaff?.role === "human_resources";

  const loadData = async () => {
    setLoading(true);
    const data = await db.getStaff();
    setStaff(data as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = (s?: any) => {
    if (s) {
      if (!isSuperAdmin && s.role === 'super_admin') {
        showAlert("You do not have permission to edit Super Admin", "error");
        return;
      }
      setEditId(s.id);
      setName(s.name);
      setEmail(s.email);
      setRole(s.role || "worker");
      setStatus(s.status || "pending_approval");
    } else {
      setEditId(null);
      setName("");
      setEmail("");
      setRole("worker");
      setStatus(isSuperAdmin ? "active" : "pending_approval");
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated = [];
    
    const finalStatus = isSuperAdmin ? status : (editId ? status : "pending_approval");
    
    if (editId) {
      updated = staff.map(s => s.id === editId ? {id: editId, name, email: email.trim().toLowerCase(), role, status: finalStatus} : s);
    } else {
      updated = [...staff, {id: Date.now().toString(), name, email: email.trim().toLowerCase(), role, status: finalStatus}];
    }
    setStaff(updated);
    await db.saveStaff(updated as any);
    showAlert("Staff updated successfully", "success");
    setShowModal(false);
  };

  const removeStaff = async (id: string, name: string) => {
    const s = staff.find(x => x.id === id);
    if (!isSuperAdmin && s?.role === 'super_admin') {
      showAlert("Cannot remove Super Admin", "error");
      return;
    }
    if (!confirm(`Remove staff member ${name}?`)) return;
    const updated = staff.filter(x => x.id !== id);
    setStaff(updated);
    await db.saveStaff(updated as any);
    showAlert("Staff member removed", "success");
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading staff...</div>;
  }

  if (!isSuperAdmin && !isHR) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm" id="staff-admin-panel">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Staff & HR Management
        </h2>
        <button
          onClick={() => handleOpen()}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition hover:opacity-95 shadow-sm cursor-pointer border-none outline-none"
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-700">Name</th>
              <th className="px-4 py-3 font-bold text-slate-700">Email</th>
              <th className="px-4 py-3 font-bold text-slate-700">Role</th>
              <th className="px-4 py-3 font-bold text-slate-700">Status</th>
              <th className="px-4 py-3 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-4 font-bold text-slate-800">
                  {s.name}
                </td>
                <td className="px-4 py-4 text-slate-600">{s.email}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${s.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : s.status === 'frozen' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {s.status || 'active'}
                  </span>
                </td>
                <td className="px-4 py-4 space-x-2 text-right">
                  <button
                    onClick={() => handleOpen(s)}
                    className="text-slate-400 hover:text-blue-500 transition cursor-pointer disabled:opacity-50 inline-flex"
                    disabled={!isSuperAdmin && s.role === 'super_admin'}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => removeStaff(s.id, s.name)}
                    className="text-slate-400 hover:text-red-500 transition cursor-pointer disabled:opacity-50 inline-flex"
                    disabled={s.role === "super_admin" && staff.filter(x => x.role === "super_admin").length === 1}
                  >
                    <Trash size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                  No staff added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm shadow-xl">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">
                {editId ? "Edit Staff" : "Add Staff"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer border-none outline-none bg-transparent"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">
                  Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-primary font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">
                  Email (Supabase Auth Email)
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-primary font-medium"
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">
                  Role
                </label>
                <select
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-primary font-medium"
                  disabled={!isSuperAdmin && editId && staff.find(s=>s.id===editId)?.role === 'super_admin'}
                >
                  <option value="worker">Worker (Restricted)</option>
                  <option value="support">Support Agent (Messages/Customers)</option>
                  <option value="accountant">Accountant (Orders/Payouts)</option>
                  <option value="human_resources">Human Resources (Staff)</option>
                  {isSuperAdmin && <option value="super_admin">Super Admin (Full Access)</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">
                  Status
                </label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-primary font-medium"
                  disabled={!isSuperAdmin}
                >
                  <option value="pending_approval">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="frozen">Frozen (No Access)</option>
                </select>
                {!isSuperAdmin && (
                  <p className="text-xs text-slate-500 mt-1">Only Super Admin can change status (Freeze/Activate).</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white hover:opacity-90 transition rounded-xl font-bold cursor-pointer border-none"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
