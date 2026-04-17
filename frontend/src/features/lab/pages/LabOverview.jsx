import React, { useState, useEffect } from "react";
import { FlaskConical, Clock, CheckCircle2, Loader2, AlertCircle, Upload, X } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { formatDoctorName } from "../../../utils/doctorName";
import { getPendingLabRequests, uploadLabReport } from "../services/lab.service";

const LabOverview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [reportFile, setReportFile] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPendingLabRequests();
      if (res.success) setRequests(res.data);
    } catch {
      setError("Failed to load pending lab requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!reportFile) return;
    setUploading(reportModal.id);
    try {
      await uploadLabReport(reportModal.id, reportFile);
      setRequests(prev => prev.filter(r => r.id !== reportModal.id));
      setReportModal(null);
      setReportFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload report.");
    } finally {
      setUploading(null);
    }
  };

  const stats = [
    { label: "Pending", value: requests.length, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed Today", value: "—", color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading lab queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Desk</h1>
        </div>
        <Button variant="outline" onClick={fetchRequests} isLoading={loading}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        {stats.map(s => (
          <div key={s.label} className={cn("rounded-xl p-4 border border-gray-100 shadow-sm bg-white")}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> Pending Lab Requests
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {requests.map(req => (
            <div key={req.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <FlaskConical size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{req.testName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Patient: <span className="font-medium">{req.visit?.patient?.name || req.visit?.patientId?.slice(-8)}</span>
                    {" · "}
                    Requested: {new Date(req.createdAt || req.visit?.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => { setReportModal(req); setReportFile(null); }}
                className="flex items-center gap-2"
              >
                <Upload size={14} /> Upload Report
              </Button>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={36} className="text-emerald-400 mb-3" />
              <p className="font-bold text-gray-900">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No pending lab requests at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Upload Lab Report</h3>
              <button onClick={() => setReportModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm font-bold text-gray-700">{reportModal.testName}</p>
              <p className="text-xs text-gray-500">
                Requested by {formatDoctorName(reportModal.doctor?.name, "—")}
              </p>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report File</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:ring-2 focus:ring-blue-600 outline-none"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400">
                  Upload a PDF or scanned image up to 5 MB. The file will be stored in Cloudinary.
                </p>
                {reportFile && (
                  <p className="text-xs text-gray-500">
                    Selected: <span className="font-medium">{reportFile.name}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setReportModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" isLoading={uploading === reportModal.id}>
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabOverview;
