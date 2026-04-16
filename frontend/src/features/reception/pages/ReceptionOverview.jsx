import React, { useState, useEffect } from "react";
import {
  Clock,
  Stethoscope,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Loader2,
  Calendar,
  ClipboardList,
  TimerReset,
} from "lucide-react";
import { useNavigate } from "react-router";
import OverviewCard from "../../patient/components/OverviewCard";
import Button from "../../../components/ui/Button";
import { getAvailableDoctors, getLiveQueue } from "../services/reception.service";
import { cn } from "../../../utils/cn";

const formatVisitStatus = (status) => status?.replace("_", " ") || "UNKNOWN";

const ReceptionOverview = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState({
    summary: {
      todayVisits: 0,
      waitingCount: 0,
      inConsultationCount: 0,
      averageWaitMinutes: 0,
    },
    waitingVisits: [],
    consultationVisits: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [doctorRes, queueRes] = await Promise.all([
          getAvailableDoctors(),
          getLiveQueue(),
        ]);

        if (doctorRes.success) {
          setDoctors(doctorRes.data);
        }

        if (queueRes.success) {
          setQueue(queueRes.data);
        }
      } catch (err) {
        console.error("Overview data fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const stats = [
    {
      title: "Today's Visits",
      value: queue.summary.todayVisits.toString(),
      subtext: "Visits created today",
      icon: TrendingUp,
      colorClass: "bg-blue-500",
    },
    {
      title: "Patients Waiting",
      value: queue.summary.waitingCount.toString(),
      subtext: `Avg. wait: ${queue.summary.averageWaitMinutes} min`,
      icon: Clock,
      colorClass: "bg-amber-500",
    },
    {
      title: "Doctors Online",
      value: doctors.length.toString(),
      subtext: `${doctors.filter((doctor) => doctor.doctorType === "SPECIALIST").length} specialists`,
      icon: Stethoscope,
      colorClass: "bg-emerald-500",
    },
  ];

  const liveVisits = [...queue.consultationVisits, ...queue.waitingVisits];

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
          <p className="text-gray-500">Manage patient registrations and monitor the live PHC queue.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/reception-staff/checkin")}>
          <UserPlus size={18} />
          New Patient Check-in
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <OverviewCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Live Queue</h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">
                Reception View
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {liveVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center font-bold",
                        visit.visitStatus === "IN_CONSULTATION"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {visit.patient?.name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {visit.patient?.name || "Unknown Patient"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {visit.doctor?.name
                          ? `Doctor: ${visit.doctor.name}`
                          : "Doctor assignment pending"}
                        {" · "}
                        {visit.visitType}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm md:items-end">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                          visit.visitStatus === "IN_CONSULTATION"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {formatVisitStatus(visit.visitStatus)}
                      </span>
                      {visit.queuePosition ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700">
                          Queue #{visit.queuePosition}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">Waiting {visit.waitMinutes} min</p>
                  </div>
                </div>
              ))}
              {liveVisits.length === 0 && (
                <div className="p-10 text-center text-gray-500 text-sm">
                  No active visits are currently in queue or consultation.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Available Doctors</h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                Live Status
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {doctor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Dr. {doctor.name}</p>
                      <p className="text-xs text-gray-500">
                        {doctor.specialization || doctor.doctorType}
                      </p>
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
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              Queue Snapshot
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Waiting</p>
                <p className="text-sm text-amber-900 font-medium">
                  {queue.summary.waitingCount} patient{queue.summary.waitingCount === 1 ? "" : "s"} in queue
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
                  In Consultation
                </p>
                <p className="text-sm text-blue-900 font-medium">
                  {queue.summary.inConsultationCount} active consultation
                  {queue.summary.inConsultationCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Average Wait</p>
                <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  <TimerReset size={14} className="text-gray-400" />
                  {queue.summary.averageWaitMinutes} minutes
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Duty Shifts
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Morning Shift
                </p>
                <p className="text-sm text-gray-700 font-medium">08:00 AM - 02:00 PM</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Evening Shift
                </p>
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
              For critical emergency cases, prioritize immediate doctor assignment and bypass the
              standard waiting queue. Use the `Emergency` visit type during check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionOverview;
