import React, { useState, useEffect } from "react";
import { Users, Activity, Calendar, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { listUsers, getUsageReport, getAttendanceReport } from "../services/admin.service";

const AdminOverview = () => {
  const [users, setUsers] = useState([]);
  const [usage, setUsage] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, usageRes, attRes] = await Promise.all([
        listUsers(),
        getUsageReport(),
        getAttendanceReport(),
      ]);
      if (usersRes.success) setUsers(usersRes.data);
      if (usageRes.success) setUsage(usageRes.data);
      if (attRes.success) setAttendance(attRes.data);
    } catch {
      setError("Failed to load admin overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500">System-wide statistics and health metrics.</p>
        </div>
        <Button variant="outline" onClick={fetchData}>Refresh</Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Doctors", value: roleCounts["DOCTOR"] || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Patients", value: roleCounts["PATIENT"] || 0, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Visits", value: usage?.totalVisits ?? "—", color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Report */}
        {usage && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" /> Usage Summary
            </h2>
            <div className="space-y-3">
              {Object.entries(usage).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="text-sm font-bold text-gray-900">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-emerald-600" /> Recent Doctor Attendance
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {attendance.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dr. {a.doctor?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" · "}{new Date(a.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {a.checkOut && ` → ${new Date(a.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
                {a.totalHours != null && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {a.totalHours}h
                  </span>
                )}
              </div>
            ))}
            {attendance.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No attendance records.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
