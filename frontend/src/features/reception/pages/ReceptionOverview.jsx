import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  Stethoscope, 
  AlertCircle,
  TrendingUp,
  UserPlus,
  Loader2,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router";
import OverviewCard from "../../patient/components/OverviewCard";
import Button from "../../../components/ui/Button";
import { getAvailableDoctors } from "../services/reception.service";

const ReceptionOverview = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await getAvailableDoctors();
        if (res.success) setDoctors(res.data);
      } catch (err) {
        console.error("Overview data fetch error");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const stats = [
    {
      title: "Today's Visits",
      value: "12", // Placeholder as no list visits endpoint yet
      subtext: "+3 from yesterday",
      icon: TrendingUp,
      colorClass: "bg-blue-500",
    },
    {
      title: "Patients Waiting",
      value: "4",
      subtext: "Avg. wait: 15m",
      icon: Clock,
      colorClass: "bg-amber-500",
    },
    {
      title: "Doctors Online",
      value: doctors.length.toString(),
      subtext: `${doctors.filter(d => d.doctorType === 'SPECIALIST').length} specialists`,
      icon: Stethoscope,
      colorClass: "bg-emerald-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading reception desk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reception Desk</h1>
          <p className="text-gray-500">Manage patient registrations and visit queues.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/reception-staff/checkin")}>
          <UserPlus size={18} />
          New Patient Check-in
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <OverviewCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Doctors List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Available Doctors</h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
              Live Status
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {doctors.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Dr. {doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.specialization || doc.doctorType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  AVAILABLE
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No doctors are currently marked as available.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Notices */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Duty Shifts
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Morning Shift</p>
                <p className="text-sm text-gray-700 font-medium">08:00 AM - 02:00 PM</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Evening Shift</p>
                <p className="text-sm text-gray-700 font-medium">04:00 PM - 08:00 PM</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              Emergency Protocol
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              For critical emergency cases, prioritize immediate doctor assignment and bypass the standard waiting queue. 
              Use the 'Emergency' visit type during check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionOverview;
