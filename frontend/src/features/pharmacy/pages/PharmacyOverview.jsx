import React, { useState, useEffect } from "react";
import { Pill, Receipt, CheckCircle2, Loader2, AlertCircle, Package } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { getPendingPrescriptions, dispensePrescription, getUnpaidBills, payBill } from "../services/pharmacy.service";

const PharmacyOverview = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispensing, setDispensing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [tab, setTab] = useState("prescriptions");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [presRes, billRes] = await Promise.all([
        getPendingPrescriptions(),
        getUnpaidBills(),
      ]);
      if (presRes.success) setPrescriptions(presRes.data);
      if (billRes.success) setBills(billRes.data);
    } catch {
      setError("Failed to load pharmacy queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDispense = async (id) => {
    setDispensing(id);
    try {
      await dispensePrescription(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to dispense prescription.");
    } finally {
      setDispensing(null);
    }
  };

  const handlePay = async (billId) => {
    setPaying(billId);
    try {
      await payBill(billId);
      setBills(prev => prev.filter(b => b.id !== billId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process payment.");
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading pharmacy queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Desk</h1>
          <p className="text-gray-500">Dispense prescriptions and collect payments.</p>
        </div>
        <Button variant="outline" onClick={fetchData}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Pending Prescriptions", value: prescriptions.length, color: "text-blue-600" },
          { label: "Unpaid Bills", value: bills.length, color: "text-amber-600" },
          { label: "Total Outstanding", value: `₹${bills.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0).toFixed(2)}`, color: "text-rose-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "prescriptions", label: "Prescriptions", count: prescriptions.length },
          { key: "bills", label: "Unpaid Bills", count: bills.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all",
              tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold",
                tab === t.key ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "prescriptions" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Pill size={18} className="text-blue-500" /> Pending Prescriptions
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {prescriptions.map(p => (
              <div key={p.id} className="p-5 flex items-start justify-between hover:bg-gray-50 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Pill size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {p.visit?.patient?.name || "Patient"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {p.items?.map((item, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                          {item.medicine?.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Visit: {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDispense(p.id)}
                  isLoading={dispensing === p.id}
                  className="shrink-0"
                >
                  Dispense
                </Button>
              </div>
            ))}
            {prescriptions.length === 0 && (
              <div className="py-16 flex flex-col items-center text-center">
                <CheckCircle2 size={36} className="text-emerald-400 mb-3" />
                <p className="font-bold text-gray-900">No pending prescriptions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "bills" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Receipt size={18} className="text-amber-500" /> Unpaid Bills
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bills.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {b.visit?.patient?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {b.visit?.createdAt
                        ? new Date(b.visit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">₹{Number(b.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => handlePay(b.id)}
                        isLoading={paying === b.id}
                      >
                        Mark Paid
                      </Button>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-gray-400 text-sm">
                      No unpaid bills.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyOverview;
