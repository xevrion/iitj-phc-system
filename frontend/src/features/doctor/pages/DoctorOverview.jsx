import React, { useEffect, useMemo, useState } from "react";
import {
  Stethoscope,
  UserRound,
  Clock3,
  CalendarDays,
  Loader2,
  CircleCheck,
  CircleX,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import useAuthStore from "../../../store/useAuthStore";
import { cn } from "../../../utils/cn";
import { formatDoctorName } from "../../../utils/doctorName";
import {
  getDoctorQueue,
  getDoctorAppointments,
  getDoctorAttendance,
  checkInDoctor,
  checkOutDoctor,
  updateMyAvailability,
} from "../services/doctor.service";

const DoctorOverview = () => {
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const [queueRes, appointmentsRes, attendanceRes] = await Promise.all([
        getDoctorQueue(),
        getDoctorAppointments(),
        getDoctorAttendance(),
      ]);

      setQueue(queueRes.success ? queueRes.data : []);
      setAppointments(appointmentsRes.success ? appointmentsRes.data : []);
      const attendance = attendanceRes.success ? attendanceRes.data : [];
      setIsCheckedIn(attendance.some((record) => !record.checkOut));
      setLastUpdated(new Date());
    } catch {
      setError("Unable to load doctor dashboard data right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return appointments.filter(
      (item) =>
        item.status !== "CANCELLED" && new Date(item.appointmentTime).getTime() >= now
    ).length;
  }, [appointments]);

  const emergencyCount = useMemo(
    () => appointments.filter((item) => item.isEmergency).length,
    [appointments]
  );

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments.find(
      (item) =>
        item.status !== "CANCELLED" && new Date(item.appointmentTime).getTime() >= now
    );
  }, [appointments]);

  const handleCheckIn = async () => {
    setSaving(true);
    setError("");
    try {
      await checkInDoctor();
      await checkAuth();
      await fetchOverview();
    } catch {
      setError("Check-in failed. You may already be checked in.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async () => {
    setSaving(true);
    setError("");
    try {
      await checkOutDoctor();
      await checkAuth();
      await fetchOverview();
    } catch {
      setError("Check-out failed. No active check-in was found.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    const nextValue = !user?.doctor?.isAvailable;
    setSaving(true);
    setError("");
    try {
      await updateMyAvailability(nextValue);
      await checkAuth();
      await fetchOverview();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update consultation availability."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading doctor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {formatDoctorName(user?.doctor?.name, user?.ldapId || "Doctor")}
          </h1>
          <p className="text-gray-500">Track queue, appointments, and your current duty status.</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Synced at {lastUpdated.toLocaleTimeString("en-IN")}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchOverview} isLoading={loading || saving}>
            Refresh Data
          </Button>
          {isCheckedIn ? (
            <Button variant="secondary" onClick={handleCheckOut} isLoading={saving}>
              Check Out
            </Button>
          ) : (
            <Button variant="primary" onClick={handleCheckIn} isLoading={saving}>
              Check In
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attendance</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {isCheckedIn ? (
              <CircleCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <CircleX className="w-5 h-5 text-red-600" />
            )}
            {isCheckedIn ? "Checked In" : "Checked Out"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Waiting Queue</p>
          <p className="text-3xl font-bold text-gray-900">{queue.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upcoming Slots</p>
          <p className="text-3xl font-bold text-gray-900">{upcomingCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Emergency Cases</p>
          <p className="text-3xl font-bold text-gray-900">{emergencyCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Consultation Availability</h2>
          <p className="text-sm text-gray-500 mt-1">
            Attendance marks whether you are present today. Availability controls whether reception and patients can send new consultations to you right now.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          <span
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide w-fit",
              !isCheckedIn
                ? "bg-slate-100 text-slate-700"
                : user?.doctor?.isAvailable
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
            )}
          >
            {!isCheckedIn
              ? "Off Duty"
              : user?.doctor?.isAvailable
                ? "Open For Consultations"
                : "Temporarily Paused"}
          </span>
          <Button
            variant={user?.doctor?.isAvailable ? "secondary" : "primary"}
            onClick={handleAvailabilityToggle}
            isLoading={saving}
            disabled={!isCheckedIn}
          >
            {user?.doctor?.isAvailable ? "Pause Consultations" : "Open Consultations"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Next Scheduled Appointment</h2>
          {nextAppointment ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-600" />
                {new Date(nextAppointment.appointmentTime).toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <UserRound size={16} className="text-gray-500" />
                {nextAppointment.patient?.name || "Unknown patient"}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-semibold">{nextAppointment.status}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">No upcoming appointments scheduled.</p>
              {queue.length > 0 && (
                <p className="text-xs text-gray-400">
                  Queue patients come from active PHC visits. They are separate from booked appointment slots.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Summary</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="flex items-center gap-2">
              <Stethoscope size={16} className="text-blue-600" />
              Doctor Type: {user?.doctor?.doctorType || "N/A"}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 size={16} className="text-blue-600" />
              Active Queue Patients: {queue.length}
            </p>
            <p>
              Total Appointments (all statuses): {appointments.length}
            </p>
            <p className="text-xs text-gray-500 pt-2">
              Queue and appointments are tracked separately: queue = active visits, appointments = booked future slots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
