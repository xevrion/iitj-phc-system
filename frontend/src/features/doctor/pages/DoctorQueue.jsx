import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Loader2,
  Thermometer,
  HeartPulse,
  ClipboardCheck,
  FilePenLine,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { getDoctorQueue, claimVisit } from "../services/doctor.service";
import useAuthStore from "../../../store/useAuthStore";

const DoctorQueue = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDoctorQueue();
      setQueue(response.success ? response.data : []);
      setLastUpdated(new Date());
    } catch {
      setError("Unable to load waiting queue right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const waitingVisits = useMemo(
    () => queue.filter((visit) => visit.visitStatus === "WAITING"),
    [queue]
  );

  const activeConsultations = useMemo(
    () => queue.filter((visit) => visit.visitStatus === "IN_CONSULTATION"),
    [queue]
  );

  const handleClaim = async (visitId) => {
    if (!user?.doctor?.isAvailable) {
      setError("Open consultations before claiming patients from the queue.");
      return;
    }

    setClaimingId(visitId);
    setError("");
    try {
      await claimVisit(visitId);
      navigate(`/doctor/consultation/${visitId}`);
    } catch {
      setError("Could not claim this visit. It may already be in consultation.");
    } finally {
      setClaimingId(null);
    }
  };

  const openConsultation = (visitId) => {
    navigate(`/doctor/consultation/${visitId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading waiting queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Queue</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Updated {lastUpdated.toLocaleTimeString("en-IN")}</p>
          )}
        </div>
        <Button variant="outline" onClick={fetchQueue}>Refresh</Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}

      {!user?.doctor?.isAvailable && (
        <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-100">
          Consultations are currently paused. Waiting patients assigned earlier should be re-routed
          back to the reception live queue for reassignment.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 gap-4 border-b border-gray-100 bg-gray-50/60 px-6 py-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Waiting Visits</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{waitingVisits.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Consultations</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{activeConsultations.length}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vitals</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Queued At</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{visit.patient?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">Visit ID: {visit.id.slice(-8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        visit.visitStatus === "IN_CONSULTATION"
                          ? "inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700"
                          : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700"
                      }
                    >
                      {visit.visitStatus === "IN_CONSULTATION"
                        ? "In Consultation"
                        : "Waiting"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{visit.visitType}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1">
                        <HeartPulse size={14} className="text-rose-500" />
                        BP: {visit.vitals?.bloodPressure || "NA"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Thermometer size={14} className="text-amber-500" />
                        Temp: {visit.vitals?.temperature ?? "NA"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(visit.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {visit.visitStatus === "IN_CONSULTATION" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConsultation(visit.id)}
                        className="gap-2"
                      >
                        <FilePenLine size={14} />
                        Reopen Consultation
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(visit.id)}
                        isLoading={claimingId === visit.id}
                        className="gap-2"
                        disabled={!user?.doctor?.isAvailable}
                      >
                        <ClipboardCheck size={14} />
                        Claim Visit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No active visits are currently assigned to you.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorQueue;
