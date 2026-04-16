import React, { useState, useEffect } from "react";
import { Pill, Receipt, CheckCircle2, Loader2, AlertCircle, Package } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { getPendingPrescriptions, dispensePrescription, getUnpaidBills, payBill, generateBillForVisit } from "../services/pharmacy.service";

const PAYMENT_STATUS_COLORS = {
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const PharmacyOverview = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispensing, setDispensing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [billing, setBilling] = useState(null);
  const [tab, setTab] = useState("prescriptions");
  const [billDrafts, setBillDrafts] = useState({});

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
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reach the backend. Start the server and refresh the pharmacy desk."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    setBillDrafts((current) => {
      const next = { ...current };

      prescriptions.forEach((prescription) => {
        if (prescription.visit?.bill || next[prescription.id]) {
          return;
        }

        next[prescription.id] = Object.fromEntries(
          (prescription.items || []).map((item) => [item.medicineId, "1"])
        );
      });

      return next;
    });
  }, [prescriptions]);

  const handleDispense = async (id) => {
    setDispensing(id);
    try {
      await dispensePrescription(id);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to dispense prescription.");
    } finally {
      setDispensing(null);
    }
  };

  const handleBillQtyChange = (prescriptionId, medicineId, value) => {
    setBillDrafts((current) => ({
      ...current,
      [prescriptionId]: {
        ...current[prescriptionId],
        [medicineId]: value,
      },
    }));
  };

  const handleGenerateBill = async (prescription) => {
    const draft = billDrafts[prescription.id] || {};
    const items = (prescription.items || []).map((item) => ({
      medicineId: item.medicineId,
      quantity: Number.parseInt(draft[item.medicineId] || "0", 10),
    }));

    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      setError("Enter a valid quantity for each medicine before generating the bill.");
      return;
    }

    setBilling(prescription.id);
    setError("");

    try {
      await generateBillForVisit(prescription.visit.id, items);
      await fetchData();
      setTab("bills");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate bill.");
    } finally {
      setBilling(null);
    }
  };

  const handlePay = async (billId) => {
    setPaying(billId);
    try {
      await payBill(billId);
      await fetchData();
      setTab("prescriptions");
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
          <p className="text-gray-500">Generate medicine bills, collect payment, then dispense medicines.</p>
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

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        `Generate Bill` creates the unpaid bill and deducts medicine stock.
        `Mark Paid` settles that bill.
        `Dispense` is the final step and is only allowed after payment.
      </div>

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
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-900 text-sm">
                      {p.visit?.patient?.name || "Patient"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Visit: {p.visit?.createdAt
                        ? new Date(p.visit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    <div className="space-y-2">
                      {p.items?.map((item) => (
                        <div key={item.id} className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-blue-900">{item.medicine?.name || "Medicine"}</p>
                              <p className="text-xs text-blue-700">
                                Dosage: {item.dosage || "N/A"} | Duration: {item.duration || "N/A"}
                              </p>
                            </div>

                            {!p.visit?.bill && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  className="w-20 h-9 rounded-md border border-blue-200 bg-white px-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                  value={billDrafts[p.id]?.[item.medicineId] || "1"}
                                  onChange={(event) => handleBillQtyChange(p.id, item.medicineId, event.target.value)}
                                />
                              </div>
                            )}

                            {p.visit?.bill && (
                              <div className="text-right">
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Billed Qty</p>
                                <p className="text-sm font-semibold text-blue-900">
                                  {p.visit.bill.items?.find((billItem) => billItem.medicineId === item.medicineId)?.quantity || 0}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {p.visit?.bill && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-600">Bill:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold",
                          PAYMENT_STATUS_COLORS[p.visit.bill.paymentStatus] || "bg-gray-100 text-gray-600"
                        )}>
                          {p.visit.bill.paymentStatus}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          ₹{Number(p.visit.bill.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {!p.visit?.bill && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateBill(p)}
                      isLoading={billing === p.id}
                    >
                      Generate Bill
                    </Button>
                  )}

                  {p.visit?.bill?.paymentStatus === "UNPAID" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTab("bills")}
                    >
                      Open Unpaid Bill
                    </Button>
                  )}

                  {p.visit?.bill?.paymentStatus === "PAID" && (
                    <Button
                      size="sm"
                      onClick={() => handleDispense(p.id)}
                      isLoading={dispensing === p.id}
                      className="shrink-0"
                    >
                      Dispense
                    </Button>
                  )}
                </div>
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
          <div className="divide-y divide-gray-100">
            {bills.map((bill) => (
              <div key={bill.id} className="p-5 space-y-4 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-gray-900">
                        {bill.visit?.patient?.name || "Patient"}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        UNPAID
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <p>
                        Bill ID: <span className="font-medium text-gray-800">#{bill.id.slice(-8).toUpperCase()}</span>
                      </p>
                      <p>
                        Visit ID: <span className="font-medium text-gray-800">#{bill.visit?.id?.slice(-8).toUpperCase() || "N/A"}</span>
                      </p>
                      <p>
                        Bill Created:{" "}
                        <span className="font-medium text-gray-800">
                          {new Date(bill.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </p>
                      <p>
                        Visit Date:{" "}
                        <span className="font-medium text-gray-800">
                          {bill.visit?.createdAt
                            ? new Date(bill.visit.createdAt).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </span>
                      </p>
                      <p>
                        Visit Type: <span className="font-medium text-gray-800">{bill.visit?.visitType || "—"}</span>
                      </p>
                      <p>
                        Doctor: <span className="font-medium text-gray-800">{bill.visit?.doctor?.name || "—"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <div className="text-left lg:text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount Due</p>
                      <p className="text-2xl font-bold text-gray-900">₹{Number(bill.totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePay(bill.id)}
                      isLoading={paying === bill.id}
                    >
                      Mark Paid
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Medicines</p>
                  <div className="space-y-2">
                    {bill.items?.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg bg-white border border-amber-100 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.medicine?.name || "Medicine"}</p>
                          <p className="text-xs text-gray-500">
                            Qty {item.quantity} × ₹{Number(item.medicine?.unitPrice || 0).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">₹{Number(item.price || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {bills.length === 0 && (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                No unpaid bills.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyOverview;
