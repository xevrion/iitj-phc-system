import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Calendar, Activity, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import api from "../../../services/api";

const STATUS_STYLES = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  IN_CONSULTATION: "bg-blue-100 text-blue-700",
  WAITING: "bg-amber-100 text-amber-700",
};

const PatientHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patRes, visitRes] = await Promise.all([
          api.get(`/patients/${patientId}`),
          api.get(`/patients/${patientId}/visits`),
        ]);
        if (patRes.data.success) setPatient(patRes.data.data);
        if (visitRes.data.success) setVisits(visitRes.data.data);
      } catch (err) {
        console.error("Failed to load patient history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading patient history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
          <p className="text-gray-500">{patient?.name} — {patient?.bloodGroup || "Blood group unknown"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Doctor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visits.map(visit => (
                <React.Fragment key={visit.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(visit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-500">{visit.doctor?.name || "Unassigned"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{visit.visitType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        STATUS_STYLES[visit.visitStatus] || "bg-gray-100 text-gray-700"
                      )}>
                        {visit.visitStatus?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50 gap-1"
                        onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}
                      >
                        {expandedId === visit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedId === visit.id ? "Hide" : "View"}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === visit.id && (
                    <tr className="bg-blue-50/20">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Notes</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {visit.consultationNotes || "No notes recorded."}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vitals</p>
                            {visit.vitals ? (
                              <div className="space-y-1 text-sm text-gray-700">
                                <p className="flex items-center gap-2">
                                  <Activity size={14} className="text-blue-500" />
                                  BP: {visit.vitals.bloodPressure || "N/A"} | Temp: {visit.vitals.temperature ? `${visit.vitals.temperature}°F` : "N/A"} | Weight: {visit.vitals.weight ? `${visit.vitals.weight}kg` : "N/A"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No vitals recorded.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No visit history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientHistory;
