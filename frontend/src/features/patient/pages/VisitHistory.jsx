import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Activity,
  Loader2,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { cn } from "../../../utils/cn";
import { getMyVisits } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const STATUS_OPTIONS = ["ALL", "WAITING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"];

const STATUS_STYLES = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  IN_CONSULTATION: "bg-blue-100 text-blue-700",
  WAITING: "bg-amber-100 text-amber-700",
};

const VisitHistory = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVisits = async () => {
      if (!user?.patient?.id) return;
      try {
        const response = await getMyVisits(user.patient.id);
        if (response.success) setVisits(response.data);
      } catch (err) {
        setError("Failed to load visit history.");
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [user]);

  const filteredVisits = visits.filter(visit => {
    const matchesSearch =
      visit.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.consultationNotes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || visit.visitStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading your medical history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search by doctor, visit type, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <Button
            variant="outline"
            className={cn("flex gap-2", showFilters && "bg-blue-50 border-blue-300 text-blue-700")}
            onClick={() => setShowFilters(v => !v)}
          >
            <Filter size={18} />
            Filters
            {statusFilter !== "ALL" && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">1</span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider self-center mr-1">Status:</span>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {s === "ALL" ? "All Visits" : s.replace("_", " ")}
              </button>
            ))}
            {statusFilter !== "ALL" && (
              <button
                onClick={() => setStatusFilter("ALL")}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Doctor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vitals</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.map((visit) => (
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
                      <p className="text-sm text-gray-900 font-medium">{visit.visitType || "OPD"}</p>
                      <p className="text-xs text-gray-500">{visit.doctor?.doctorType || "General"}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                        <Activity size={14} className="text-blue-500" />
                        {visit.vitals ? `BP: ${visit.vitals.bloodPressure || "N/A"}, T: ${visit.vitals.temperature || "N/A"}°F` : "No vitals recorded"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        STATUS_STYLES[visit.visitStatus] || "bg-gray-100 text-gray-700"
                      )}>
                        {visit.visitStatus?.replace("_", " ") || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                        onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}
                      >
                        {expandedId === visit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedId === visit.id ? "Hide" : "View Details"}
                      </Button>
                    </td>
                  </tr>

                  {expandedId === visit.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={5} className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Notes</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {visit.consultationNotes || "No consultation notes recorded."}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vitals</p>
                            {visit.vitals ? (
                              <div className="space-y-1 text-sm text-gray-700">
                                <p>Blood Pressure: <span className="font-medium">{visit.vitals.bloodPressure || "N/A"}</span></p>
                                <p>Temperature: <span className="font-medium">{visit.vitals.temperature ? `${visit.vitals.temperature}°F` : "N/A"}</span></p>
                                <p>Weight: <span className="font-medium">{visit.vitals.weight ? `${visit.vitals.weight} kg` : "N/A"}</span></p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No vitals recorded.</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Visit Info</p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p>Visit ID: <span className="font-mono font-medium">#{visit.id.slice(-8).toUpperCase()}</span></p>
                              <p>Type: <span className="font-medium">{visit.visitType}</span></p>
                              <p>Doctor: <span className="font-medium">{visit.doctor?.name || "N/A"}</span></p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== "ALL"
                      ? "No visits match your search or filter."
                      : "No visit records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitHistory;
