import React, { useState, useEffect } from "react";
import { UserPlus, Edit2, Check, X, AlertCircle, Loader2, Shield } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { cn } from "../../../utils/cn";
import { listUsers, createUser, updateUser } from "../services/admin.service";

const ROLES = ["PATIENT", "DOCTOR", "RECEPTION_STAFF", "PHARMACY_STAFF", "LAB_STAFF", "ADMIN"];

const ROLE_COLORS = {
  PATIENT: "bg-blue-100 text-blue-700",
  DOCTOR: "bg-emerald-100 text-emerald-700",
  RECEPTION_STAFF: "bg-purple-100 text-purple-700",
  PHARMACY_STAFF: "bg-amber-100 text-amber-700",
  LAB_STAFF: "bg-rose-100 text-rose-700",
  ADMIN: "bg-gray-900 text-white",
};

const EMPTY_FORM = { ldapId: "", role: "PATIENT", password: "" };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [filterRole, setFilterRole] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listUsers(filterRole || undefined);
      if (res.success) setUsers(res.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await createUser(form);
      if (res.success) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        await fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await updateUser(id, { isActive: !current });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !current } : u));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus size={16} className="mr-2" />
          {showForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="LDAP ID"
              placeholder="e.g. doctor02"
              value={form.ldapId}
              onChange={e => setForm({ ...form, ldapId: e.target.value })}
              required
            />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <Input
              label="Password"
              type="password"
              placeholder="Initial password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <Button type="submit" isLoading={saving}>Create User</Button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterRole("")}
          className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
            filterRole === "" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All ({users.length})
        </button>
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length;
          if (!count && filterRole !== r) return null;
          return (
            <button
              key={r}
              onClick={() => setFilterRole(r === filterRole ? "" : r)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                filterRole === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {r.replace("_", " ")} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">LDAP ID</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-mono font-medium text-gray-900">{u.ldapId}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600")}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-xs font-bold",
                      u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-red-500")} />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className={cn(
                        "text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                        u.isActive
                          ? "text-red-500 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-gray-400 text-sm">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
