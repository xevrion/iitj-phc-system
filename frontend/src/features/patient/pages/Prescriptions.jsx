import React, { useState, useEffect } from "react";
import { FileText, Download, Printer, User, Calendar, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import Button from "../../../components/ui/Button";
import { getMyVisits, getPrescriptionByVisit } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const Prescriptions = () => {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllPrescriptions = async () => {
      if (!user?.patient?.id) return;
      try {
        const visitRes = await getMyVisits(user.patient.id);
        if (visitRes.success) {
          // Fetch prescriptions for each visit that has one
          const presPromises = visitRes.data
            .filter(v => v.status === "COMPLETED")
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
        setError("Failed to load prescriptions.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllPrescriptions();
  }, [user]);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-500">Access and download your digital prescriptions.</p>
        </div>
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
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" title="Print">
                  <Printer size={16} />
                </Button>
              </div>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prescribing Doctor</p>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <User size={16} className="text-gray-400" />
                  {pres.visit?.doctor?.user?.fullName || "General Physician"}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Medications</p>
                <div className="space-y-2">
                  {pres.items?.map((item, idx) => (
                    <div key={idx} className="p-2 rounded bg-blue-50/50 border border-blue-100/50">
                      <p className="text-sm font-bold text-blue-900">{item.medicine?.name || "Medicine"}</p>
                      <p className="text-xs text-blue-700">Dosage: {item.dosage} | Freq: {item.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-50 bg-gray-50/30">
              <Button variant="outline" className="w-full gap-2 text-sm font-bold border-blue-100 text-blue-600 hover:bg-blue-50">
                <ExternalLink size={14} />
                View Full Details
              </Button>
            </div>
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
