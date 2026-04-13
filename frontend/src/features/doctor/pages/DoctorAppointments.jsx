import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarDays, UserRound, Phone, Siren } from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import { getDoctorAppointments } from "../services/doctor.service";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDoctorAppointments();
      setAppointments(response.success ? response.data : []);
    } catch {
      setError("Unable to load appointments right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: appointments.filter((item) => new Date(item.appointmentTime).getTime() >= now),
      past: appointments.filter((item) => new Date(item.appointmentTime).getTime() < now),
    };
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading appointments...</p>
      </div>
    );
  }

  const renderCards = (list) => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {list.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
                <UserRound size={14} className="text-blue-600" />
                {item.patient?.name || "Unknown patient"}
              </p>
              <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-2">
                <Phone size={13} className="text-gray-400" />
                {item.patient?.phone || "No contact"}
              </p>
            </div>
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                item.status === "BOOKED" && "bg-blue-100 text-blue-700",
                item.status === "CANCELLED" && "bg-red-100 text-red-700"
              )}
            >
              {item.status}
            </span>
          </div>

          <div className="mt-4 text-sm text-gray-600 space-y-2">
            <p className="inline-flex items-center gap-2">
              <CalendarDays size={14} className="text-gray-500" />
              {new Date(item.appointmentTime).toLocaleString("en-IN")}
            </p>
            <p>Slot Duration: {item.slotDuration} mins</p>
            {item.isEmergency && (
              <p className="inline-flex items-center gap-2 text-red-600 font-semibold">
                <Siren size={14} />
                Emergency Appointment
              </p>
            )}
          </div>
        </div>
      ))}
      {list.length === 0 && (
        <div className="xl:col-span-2 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center py-10 text-gray-500">
          No records in this section.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500">View upcoming and historical appointment slots.</p>
        </div>
        <Button variant="outline" onClick={fetchAppointments}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Upcoming</h2>
        {renderCards(upcoming)}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Past</h2>
        {renderCards(past)}
      </section>
    </div>
  );
};

export default DoctorAppointments;
