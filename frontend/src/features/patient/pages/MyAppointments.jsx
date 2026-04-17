import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Clock3, Loader2, Siren, XCircle } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cancelMyAppointment, getMyAppointments } from "../services/patient.service";
import { cn } from "../../../utils/cn";
import { useNavigate } from "react-router";

const STATUS_STYLES = {
  BOOKED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const sortByTimeAsc = (appointments) =>
  [...appointments].sort(
    (left, right) =>
      new Date(left.appointmentTime).getTime() - new Date(right.appointmentTime).getTime()
  );

const sortByTimeDesc = (appointments) =>
  [...appointments].sort(
    (left, right) =>
      new Date(right.appointmentTime).getTime() - new Date(left.appointmentTime).getTime()
  );

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getMyAppointments();
      setAppointments(response.success ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const { upcoming, history, cancelled } = useMemo(() => {
    const now = Date.now();

    return {
      upcoming: sortByTimeAsc(
        appointments.filter(
          (appointment) =>
            appointment.status !== "CANCELLED" &&
            new Date(appointment.appointmentTime).getTime() >= now
        )
      ),
      history: sortByTimeDesc(
        appointments.filter(
          (appointment) =>
            appointment.status !== "CANCELLED" &&
            new Date(appointment.appointmentTime).getTime() < now
        )
      ),
      cancelled: sortByTimeDesc(
        appointments.filter((appointment) => appointment.status === "CANCELLED")
      ),
    };
  }, [appointments]);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Cancel this appointment?")) {
      return;
    }

    setCancellingId(appointmentId);
    setError("");

    try {
      await cancelMyAppointment(appointmentId);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "CANCELLED" }
            : appointment
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading your appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500">Review upcoming bookings and your appointment history.</p>
        </div>
        <Button onClick={() => navigate("/patient/appointments/book")}>
          Book Appointment
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            Upcoming Appointments <span className="text-gray-400 font-normal text-sm">({upcoming.length})</span>
          </h2>
        </div>
        <AppointmentList appointments={upcoming} onCancel={handleCancel} cancellingId={cancellingId} emptyMessage="No upcoming appointments." />
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            History <span className="text-gray-400 font-normal text-sm">({history.length})</span>
          </h2>
        </div>
        <AppointmentList appointments={history} onCancel={handleCancel} cancellingId={cancellingId} emptyMessage="No past appointment history yet." />
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            Cancelled Appointments <span className="text-gray-400 font-normal text-sm">({cancelled.length})</span>
          </h2>
        </div>
        <AppointmentList appointments={cancelled} onCancel={handleCancel} cancellingId={cancellingId} emptyMessage="No cancelled appointments." />
      </section>
    </div>
  );
};

const AppointmentList = ({ appointments, onCancel, cancellingId, emptyMessage }) => {
  if (appointments.length === 0) {
    return <div className="px-5 py-10 text-center text-gray-400 text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">
                {appointment.doctor?.name || "Doctor"}
              </p>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold",
                  STATUS_STYLES[appointment.status] || "bg-gray-100 text-gray-600"
                )}
              >
                {appointment.status}
              </span>
              {appointment.isEmergency && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                  <Siren size={12} />
                  Emergency
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} className="text-gray-400" />
                {new Date(appointment.appointmentTime).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={14} className="text-gray-400" />
                {appointment.slotDuration} minutes
              </span>
            </div>
          </div>

          {appointment.status === "BOOKED" && new Date(appointment.appointmentTime).getTime() >= Date.now() && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              isLoading={cancellingId === appointment.id}
              onClick={() => onCancel(appointment.id)}
            >
              <XCircle size={14} />
              Cancel Appointment
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyAppointments;
