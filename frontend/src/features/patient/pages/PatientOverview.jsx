import React from "react";
import { 
  Calendar, 
  FileText, 
  FlaskConical, 
  PlusCircle, 
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "../../../utils/cn";
import OverviewCard from "../components/OverviewCard";
import { 
  Clock 
} from "lucide-react";
import Button from "../../../components/ui/Button";

const PatientOverview = () => {
  // Static data for now, will be fetched from API later
  const stats = [
    {
      title: "Next Appointment",
      value: "Apr 12, 10:30 AM",
      subtext: "With Dr. Sharma (Physician)",
      icon: Calendar,
      colorClass: "bg-blue-500",
    },
    {
      title: "Recent Prescription",
      value: "Paracetamol + 2 more",
      subtext: "Issued on Mar 25, 2026",
      icon: FileText,
      colorClass: "bg-emerald-500",
    },
    {
      title: "Pending Lab Tests",
      value: "CBC, Blood Sugar",
      subtext: "Requested on Mar 24",
      icon: FlaskConical,
      colorClass: "bg-amber-500",
    },
  ];

  const recentActivities = [
    { id: 1, type: "Visit", title: "General Consultation", date: "Mar 25, 2026", status: "Completed" },
    { id: 2, type: "Lab", title: "Blood Test Report Uploaded", date: "Mar 20, 2026", status: "Available" },
    { id: 3, type: "Appointment", title: "Follow-up Scheduled", date: "Mar 18, 2026", status: "Upcoming" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Patient!</h1>
          <p className="text-gray-500">Your health overview and recent activities at IITJ PHC.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex gap-2">
            <ClipboardList size={18} />
            View Records
          </Button>
          <Button className="flex gap-2">
            <PlusCircle size={18} />
            Book Appointment
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
            {recentActivities.map((activity) => (
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
                  activity.status === "Completed" ? "bg-gray-100 text-gray-600" :
                  activity.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                )}>
                  {activity.status}
                </span>
              </div>
            ))}
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
