import React, { useState, useEffect } from "react";
import { Package, AlertCircle, Loader2, Edit2, Check, X } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { getMedicines, updateMedicineStock } from "../services/pharmacy.service";

const MedicineInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(null);

  const fetchMedicines = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMedicines();
      if (res.success) setMedicines(res.data);
    } catch {
      setError("Failed to load medicine inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedicines(); }, []);

  const startEdit = (med) => {
    setEditing(med.id);
    setEditValue(med.stockQuantity?.toString() ?? "0");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const handleSave = async (id) => {
    const qty = parseInt(editValue, 10);
    if (isNaN(qty) || qty < 0) return;
    setSaving(id);
    try {
      const res = await updateMedicineStock(id, qty);
      if (res.success) {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, stockQuantity: qty } : m));
      }
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stock.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicine Inventory</h1>
          <p className="text-gray-500">View and update stock levels.</p>
        </div>
        <Button variant="outline" onClick={fetchMedicines}>Refresh</Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dosage</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {medicines.map(med => (
                <tr key={med.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Package size={14} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{med.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{med.dosage || "—"}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">₹{Number(med.unitPrice || 0).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    {editing === med.id ? (
                      <input
                        type="number"
                        min="0"
                        className="w-24 h-8 rounded-md border border-blue-400 px-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") handleSave(med.id); if (e.key === "Escape") cancelEdit(); }}
                      />
                    ) : (
                      <span className={cn(
                        "text-sm font-bold",
                        (med.stockQuantity ?? 0) === 0 ? "text-red-600" :
                        (med.stockQuantity ?? 0) < 20 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {med.stockQuantity ?? 0} units
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editing === med.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleSave(med.id)}
                          disabled={saving === med.id}
                          className="p-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-md transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(med)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-gray-400 text-sm">No medicines found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedicineInventory;
