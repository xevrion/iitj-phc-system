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
import {
  getDoctorQueue,
  getDoctorAppointments,
  updateMyAvailability,
  checkInDoctor,
  checkOutDoctor,
} from "../services/doctor.service";

const DoctorOverview = () => {
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const [queueRes, appointmentsRes] = await Promise.all([
        getDoctorQueue(),
        getDoctorAppointments(),
      ]);

      setQueue(queueRes.success ? queueRes.data : []);
      setAppointments(appointmentsRes.success ? appointmentsRes.data : []);
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

  const handleAvailability = async (nextValue) => {
    setSaving(true);
    setError("");
    try {
      await updateMyAvailability(nextValue);
      await checkAuth();
    } catch {
      setError("Could not update availability. Please retry.");
    } finally {
      setSaving(false);
    }
  };

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
            Welcome, Dr. {user?.doctor?.name || user?.ldapId || "Doctor"}
          </h1>
          <p className="text-gray-500">Track queue, appointments, and your current duty status.</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Synced at {lastUpdated.toLocaleTimeString("en-IN")}</p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={fetchOverview} isLoading={loading || saving}>
            Refresh Data
          </Button>
          <Button
            variant={user?.doctor?.isAvailable ? "secondary" : "primary"}
            onClick={() => handleAvailability(!user?.doctor?.isAvailable)}
            isLoading={saving}
          >
            {user?.doctor?.isAvailable ? "Set Unavailable" : "Set Available"}
          </Button>
          <Button variant="outline" onClick={handleCheckIn} isLoading={saving}>
            Check In
          </Button>
          <Button variant="outline" onClick={handleCheckOut} isLoading={saving}>
            Check Out
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Availability</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {user?.doctor?.isAvailable ? (
              <CircleCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <CircleX className="w-5 h-5 text-red-600" />
            )}
            {user?.doctor?.isAvailable ? "Available" : "Unavailable"}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Next Appointment</h2>
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
            <p className="text-gray-500 text-sm">No upcoming appointments scheduled.</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
