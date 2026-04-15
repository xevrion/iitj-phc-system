import React, { useState, useEffect } from "react";
import { Receipt, CreditCard, Calendar, Clock, Loader2, CheckCircle2, AlertCircle, Download, ExternalLink } from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import { getMyVisits, getBillByVisit } from "../services/patient.service";
import useAuthStore from "../../../store/useAuthStore";

const Billing = () => {
  const { user } = useAuthStore();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllBills = async () => {
      if (!user?.patient?.id) return;
      try {
        const visitRes = await getMyVisits(user.patient.id);
        if (visitRes.success) {
          const billPromises = visitRes.data
            .filter(v => v.visitStatus === "COMPLETED")
            .map(async (v) => {
              try {
                const res = await getBillByVisit(v.id);
                return res.success ? { ...res.data, visit: v } : null;
              } catch { return null; }
            });
          
          const results = await Promise.all(billPromises);
          setBills(results.filter(b => b !== null));
        }
      } catch (err) {
        setError("Failed to load billing history.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllBills();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Fetching your bills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-gray-500">View your medical expenses and payment status for PHC visits.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bill ID & Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Receipt size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">#{bill.id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(bill.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-900 font-medium">{bill.visit?.visitType || "OPD Visit"}</p>
                        <p className="text-xs text-gray-500">Dr. {bill.visit?.doctor?.name || "PHC Physician"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">₹{bill.totalAmount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold",
                        bill.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {bill.paymentStatus === "PAID" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {bill.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-blue-600 hover:bg-blue-50" title="View Details">
                          <ExternalLink size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-gray-600 hover:bg-gray-50" title="Download Invoice">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Receipt size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="font-medium">No billing records found.</p>
                      <p className="text-xs text-gray-400 mt-1">Bills are generated once your visit is completed.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Payment Notice</h3>
            <p className="text-sm text-blue-800 mt-1">
              Currently, we only support payments at the PHC pharmacy counter. Online payments will be integrated in a future update.
              Please show your digital ID QR code at the counter for billing reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
