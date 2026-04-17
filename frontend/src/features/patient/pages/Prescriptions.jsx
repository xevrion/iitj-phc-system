import React, { useState, useEffect } from "react";
import { FileText, Printer, User, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import { getMyVisits, getPrescriptionByVisit } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const Prescriptions = () => {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchAllPrescriptions = async () => {
      if (!user?.patient?.id) return;
      try {
        const visitRes = await getMyVisits(user.patient.id);
        if (visitRes.success) {
          const presPromises = visitRes.data
            .filter(v => v.visitStatus === "COMPLETED")
            .map(async (v) => {
              try {
                const res = await getPrescriptionByVisit(v.id);
                return res.success ? { ...res.data, visit: v } : null;
              } catch { return null; }
            });
          const results = await Promise.all(presPromises);
          setPrescriptions(results.filter(p => p !== null));
        }
      } catch (err) {
        console.error("Failed to load prescriptions.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPrescriptions();
  }, [user]);

  const handlePrint = (pres) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Prescription #${pres.id.slice(-8).toUpperCase()}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:600px;margin:auto}
      h2{color:#1d4ed8}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}th{background:#f9fafb}
      .header{border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px}
      </style></head><body>
      <div class="header"><h2>IIT Jodhpur PHC — Prescription</h2>
      <p>Prescription ID: <strong>#${pres.id.slice(-8).toUpperCase()}</strong></p>
      <p>Date: ${new Date(pres.createdAt).toLocaleDateString("en-IN")}</p>
      <p>Doctor: ${pres.visit?.doctor?.name || "General Physician"}</p>
      <p>Patient: ${pres.visit?.patient?.name || ""}</p></div>
      <h3>Medications</h3>
      <table><tr><th>Medicine</th><th>Dosage</th><th>Duration</th></tr>
      ${(pres.items || []).map(item => `<tr><td>${item.medicine?.name || "Medicine"}</td><td>${item.dosage || "-"}</td><td>${item.duration || "-"}</td></tr>`).join("")}
      </table></body></html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Fetching your prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prescriptions.map((pres) => (
          <div key={pres.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">#{pres.id.slice(-8)}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(pres.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                title="Print Prescription"
                onClick={() => handlePrint(pres)}
              >
                <Printer size={16} />
              </Button>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prescribing Doctor</p>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <User size={16} className="text-gray-400" />
                  {pres.visit?.doctor?.name || "General Physician"}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Medications ({pres.items?.length || 0})
                </p>
                <div className="space-y-2">
                  {(expandedId === pres.id ? pres.items : pres.items?.slice(0, 2))?.map((item, idx) => (
                    <div key={idx} className="p-2 rounded bg-blue-50/50 border border-blue-100/50">
                      <p className="text-sm font-bold text-blue-900">{item.medicine?.name || "Medicine"}</p>
                      <p className="text-xs text-blue-700">Dosage: {item.dosage || "N/A"} | Duration: {item.duration || "N/A"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {expandedId === pres.id && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prescription Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {pres.notes || "No additional notes were recorded for this prescription."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prescription Status</p>
                      <p className="text-sm font-medium text-gray-800">
                        {pres.isDispensed ? "Dispensed" : "Pending Dispense"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visit Reference</p>
                      <p className="text-sm font-medium text-gray-800">
                        #{pres.visitId?.slice(-8)?.toUpperCase() || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(pres.items?.length > 0 || pres.notes) && (
              <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm font-bold border-blue-100 text-blue-600 hover:bg-blue-50"
                  onClick={() => setExpandedId(expandedId === pres.id ? null : pres.id)}
                >
                  {expandedId === pres.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedId === pres.id ? "Show Less" : "View Details"}
                </Button>
              </div>
            )}
          </div>
        ))}
        {prescriptions.length === 0 && (
          <div className="md:col-span-2 text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No digital prescriptions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
