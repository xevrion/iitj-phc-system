import React from "react";
import { FileText, Download, Printer, User, Calendar, ExternalLink } from "lucide-react";
import Button from "../../../components/ui/Button";

const Prescriptions = () => {
  // Static data
  const prescriptions = [
    {
      id: "pres-001",
      date: "Mar 25, 2026",
      doctor: "Dr. Ananya Sharma",
      medicines: ["Paracetamol 500mg", "Cetirizine 10mg", "Amoxicillin 500mg"],
      instructions: "Take medicines after food. Drink plenty of water.",
    },
    {
      id: "pres-002",
      date: "Feb 10, 2026",
      doctor: "Dr. Rajesh Kumar",
      medicines: ["Ibuprofen 400mg", "Pantoprazole 40mg"],
      instructions: "Apply ointment twice daily. Avoid heavy lifting.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-500">Access and download your digital prescriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prescriptions.map((pres) => (
          <div key={pres.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{pres.id}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> {pres.date}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <Printer size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <Download size={16} />
                </Button>
              </div>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prescribed By</p>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <User size={16} className="text-gray-400" />
                  {pres.doctor}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Medicines</p>
                <ul className="space-y-1.5">
                  {pres.medicines.map((med, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {med}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">General Instructions</p>
                <p className="text-xs text-gray-500 italic">"{pres.instructions}"</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-50 bg-gray-50/30">
              <Button variant="outline" className="w-full gap-2 text-sm font-bold border-blue-100 text-blue-600 hover:bg-blue-50">
                <ExternalLink size={14} />
                View Full Prescription
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prescriptions;
