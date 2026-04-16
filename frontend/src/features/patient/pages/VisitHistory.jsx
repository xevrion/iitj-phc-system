import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  Activity,
  Loader2 
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { cn } from "../../../utils/cn";
import { getMyVisits } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const VisitHistory = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVisits = async () => {
      if (!user?.patient?.id) return;
      try {
        const response = await getMyVisits(user.patient.id);
        if (response.success) {
          setVisits(response.data);
        }
      } catch (err) {
        setError("Failed to load visit history.");
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [user]);

  const filteredVisits = visits.filter(visit => 
    visit.doctor?.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.consultationNotes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <p className="text-gray-500">View details of your past consultations and medical visits.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Input 
            placeholder="Search by doctor or reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <Button variant="outline" className="flex gap-2 w-full md:w-auto justify-center">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Doctor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason for Visit</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vitals Summary</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(visit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs text-gray-500">{visit.doctor?.user?.fullName || "Unassigned"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-900 font-medium truncate max-w-xs">{visit.consultationNotes || "N/A"}</p>
                      <p className="text-xs text-gray-500">{visit.doctor?.doctorType || "General"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                      <Activity size={14} className="text-blue-500" />
                      {visit.vitals ? `BP: ${visit.vitals.bloodPressure}, T: ${visit.vitals.temperature}F` : "No vitals recorded"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      visit.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No visit records found matching your search.
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
