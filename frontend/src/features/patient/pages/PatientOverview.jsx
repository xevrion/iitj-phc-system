import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  FileText, 
  FlaskConical, 
  PlusCircle, 
  ArrowRight,
  ClipboardList,
  Clock,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { cn } from "../../../utils/cn";
import OverviewCard from "../components/OverviewCard";
import Button from "../../../components/ui/Button";
import useAuthStore from "../../../store/useAuthStore";
import { getMyVisits, getMyAppointments, getMyLabReports } from "../services/patient.service";

const PatientOverview = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState({
    visits: [],
    appointments: [],
    labReports: [],
    loading: true
  });

  const fetchDashboardData = async () => {
    if (!user?.patient?.id) return;
    setData(prev => ({ ...prev, loading: true }));
    try {
      const [vRes, aRes, lRes] = await Promise.all([
        getMyVisits(user.patient.id, { limit: 5 }),
        getMyAppointments(),
        getMyLabReports({ limit: 5 })
      ]);

      setData({
        visits: vRes.success ? vRes.data : [],
        appointments: aRes.success ? aRes.data : [],
        labReports: lRes.success ? lRes.data : [],
        loading: false
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (data.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Synchronizing your health records...</p>
      </div>
    );
  }

  const upcomingAppt = data.appointments.find(
    (appointment) =>
      appointment.status !== "CANCELLED" &&
      new Date(appointment.appointmentTime).getTime() > Date.now()
  );
  const pendingLabs = data.labReports.filter(l => l.status === "PENDING").length;
  const latestVisit = data.visits[0];

  const stats = [
    {
      title: "Next Appointment",
      value: upcomingAppt
        ? new Date(upcomingAppt.appointmentTime).toLocaleDateString("en-IN", {
            dateStyle: "medium",
          })
        : "None Scheduled",
      subtext: upcomingAppt
        ? `With ${upcomingAppt.doctor?.name || "your doctor"}`
        : "Book a slot today",
      icon: Calendar,
      colorClass: "bg-blue-500",
    },
    {
      title: "Total Visits",
      value: data.visits.length.toString(),
      subtext: latestVisit ? `Last visit: ${new Date(latestVisit.createdAt).toLocaleDateString()}` : "No history yet",
      icon: Clock,
      colorClass: "bg-emerald-500",
    },
    {
      title: "Lab Requests",
      value: data.labReports.length.toString(),
      subtext: `${pendingLabs} results pending`,
      icon: FlaskConical,
      colorClass: "bg-amber-500",
    },
  ];

  // Combine all for recent activity
  const activities = [
    ...data.visits.slice(0, 2).map(v => ({ id: v.id, type: "Visit", title: "Medical Consultation", date: new Date(v.createdAt).toLocaleDateString(), status: v.status })),
    ...data.appointments.slice(0, 1).map(a => ({ id: a.id, type: "Appt", title: "Specialist Appointment", date: new Date(a.appointmentTime).toLocaleDateString(), status: a.status })),
    ...data.labReports.slice(0, 1).map(l => ({ id: l.id, type: "Lab", title: l.testName, date: new Date(l.createdAt).toLocaleDateString(), status: l.status }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.patient?.name || user?.fullName || "Patient"}!
          </h1>
          <p className="text-gray-500">Your health overview and recent activities at IITJ PHC.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex gap-2" onClick={fetchDashboardData}>
            <Clock size={18} />
            Sync Records
          </Button>
          <Button className="flex gap-2" onClick={() => navigate("/patient/appointments")}>
            <PlusCircle size={18} />
            My Appointments
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <OverviewCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <Link to="/patient/visits" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    activity.type === "Visit" ? "bg-blue-50 text-blue-600" :
                    activity.type === "Lab" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                  )}>
                    {activity.type === "Visit" ? <Clock size={18} /> : 
                     activity.type === "Lab" ? <FlaskConical size={18} /> : <Calendar size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium",
                  activity.status === "COMPLETED" || activity.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" :
                  activity.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                )}>
                  {activity.status}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>

        {/* Quick Links / Info */}
        <div className="bg-blue-600 rounded-xl p-8 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">Need Help?</h2>
          <p className="text-blue-100 mb-6 text-sm leading-relaxed">
            In case of emergency, please contact the PHC reception or call the 24/7 campus helpline.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">Reception</p>
              <p className="font-mono">+91 291 280 1192</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">Emergency</p>
              <p className="font-mono">102 (Internal: 111)</p>
            </div>
          </div>
          <Link to="/patient/profile" className="mt-8 block text-center py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors">
            Update My Contact Info
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
