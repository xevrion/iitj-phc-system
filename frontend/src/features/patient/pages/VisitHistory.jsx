import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  Calendar, 
  User, 
  Activity 
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const VisitHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Static data for now
  const visits = [
    { 
      id: "v1", 
      date: "Mar 25, 2026", 
      doctor: "Dr. Ananya Sharma", 
      specialty: "Physician", 
      reason: "Seasonal Flu & Fever", 
      status: "COMPLETED",
      vitals: "BP: 120/80, Temp: 101F"
    },
    { 
      id: "v2", 
      date: "Feb 10, 2026", 
      doctor: "Dr. Rajesh Kumar", 
      specialty: "Orthopedic", 
      reason: "Knee Pain after fall", 
      status: "COMPLETED",
      vitals: "BP: 118/75, Weight: 72kg"
    },
    { 
      id: "v3", 
      date: "Jan 15, 2026", 
      doctor: "Dr. Ananya Sharma", 
      specialty: "Physician", 
      reason: "Regular Health Checkup", 
      status: "COMPLETED",
      vitals: "BP: 122/82, Temp: 98.6F"
    },
  ];

  const filteredVisits = visits.filter(visit => 
    visit.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Button variant="outline" className="flex gap-2">
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
                        <p className="text-sm font-bold text-gray-900">{visit.date}</p>
                        <p className="text-xs text-gray-500">{visit.doctor}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-900 font-medium">{visit.reason}</p>
                      <p className="text-xs text-gray-500">{visit.specialty}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                      <Activity size={14} className="text-blue-500" />
                      {visit.vitals}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
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
