import React, { useState, useEffect } from "react";
import { 
  User, 
  Stethoscope, 
  Clock, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Calendar,
  Activity,
  CircleCheck,
  CircleX
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import useAuthStore from "../../../store/useAuthStore";
import { getDoctorAttendance, updateMyAvailability } from "../services/doctor.service";

const DoctorProfile = () => {
  const { user, checkAuth } = useAuthStore();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.doctor?.id) return;
      try {
        const response = await getDoctorAttendance(user.doctor.id);
        if (response.success) {
          setAttendance(response.data);
        }
      } catch (err) {
        console.error("Failed to load attendance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user]);

  const handleToggleAvailability = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const nextValue = !user?.doctor?.isAvailable;
      const res = await updateMyAvailability(nextValue);
      if (res.success) {
        await checkAuth();
        setMessage({ type: "success", text: `Status updated to ${nextValue ? "Available" : "Unavailable"}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update availability status." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading professional profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>
          <p className="text-gray-500">Manage your duty status and view clinical activity.</p>
        </div>
        <Button 
          variant={user?.doctor?.isAvailable ? "secondary" : "primary"}
          onClick={handleToggleAvailability}
          isLoading={saving}
          className="gap-2"
        >
          {user?.doctor?.isAvailable ? <CircleX size={18} /> : <CircleCheck size={18} />}
          {user?.doctor?.isAvailable ? "Go Offline" : "Set Available"}
        </Button>
      </div>

      {message.text && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2",
          message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        )}>
          {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border-4 border-white shadow-sm">
              {user?.doctor?.name?.replace("Dr. ", "").charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.doctor?.name}</h2>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1 bg-blue-50 px-3 py-1 rounded-full inline-block">
              {user?.doctor?.doctorType}
            </p>
            
            <div className="mt-8 space-y-4 text-left border-t border-gray-50 pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specialization</p>
                  <p className="text-sm font-semibold text-gray-700">{user?.doctor?.specialization || "General Physician"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status</p>
                  <p className={cn(
                    "text-sm font-bold",
                    user?.doctor?.isAvailable ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {user?.doctor?.isAvailable ? "Online & Available" : "Offline / On Break"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Log */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <History size={18} className="text-blue-600" />
                Recent Attendance Log
              </h3>
              <Clock size={18} className="text-gray-400" />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {new Date(record.checkIn).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">
                        {record.totalHours ? `${record.totalHours.toFixed(1)}h` : "--"}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center">
                        <Calendar size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-gray-400 font-medium">No attendance records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
