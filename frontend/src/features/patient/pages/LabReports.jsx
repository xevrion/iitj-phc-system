import React from "react";
import { FlaskConical, Download, Calendar, Activity, CheckCircle2, Clock } from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";

const LabReports = () => {
  // Static data
  const reports = [
    {
      id: "LR-1024",
      testName: "Complete Blood Count (CBC)",
      date: "Mar 20, 2026",
      status: "COMPLETED",
      orderedBy: "Dr. Ananya Sharma",
    },
    {
      id: "LR-1025",
      testName: "Thyroid Profile (T3, T4, TSH)",
      date: "Mar 24, 2026",
      status: "PENDING",
      orderedBy: "Dr. Ananya Sharma",
    },
    {
      id: "LR-0985",
      testName: "Urinalysis",
      date: "Feb 12, 2026",
      status: "COMPLETED",
      orderedBy: "Dr. Rajesh Kumar",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Reports</h1>
        <p className="text-gray-500">View and download your medical test results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
            <div className={cn(
              "p-6 flex flex-col items-center justify-center gap-2 sm:w-40 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/50 text-center",
              report.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"
            )}>
              <FlaskConical size={32} />
              <div className="text-xs font-bold uppercase tracking-wider">{report.status}</div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{report.testName}</h3>
                  <span className="text-xs font-mono text-gray-400">ID: {report.id}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date Requested</p>
                    <p className="text-sm text-gray-700 flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-gray-400" />
                      {report.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prescribed By</p>
                    <p className="text-sm text-gray-700 flex items-center gap-1.5 font-medium">
                      <Activity size={14} className="text-gray-400" />
                      {report.orderedBy}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {report.status === "COMPLETED" ? (
                  <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800">
                    <Download size={16} />
                    Download PDF Report
                  </Button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-100 italic">
                    <Clock size={16} />
                    Report Under Process
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabReports;
