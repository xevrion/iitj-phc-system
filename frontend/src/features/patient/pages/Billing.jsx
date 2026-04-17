import React, { useState, useEffect } from "react";
import { Receipt, CreditCard, Calendar, Clock, Loader2, CheckCircle2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatDoctorName } from "../../../utils/doctorName";
import Button from "../../../components/ui/Button";
import { getMyBills } from "../services/patient.service";

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const handlePrint = (bill) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Invoice #${bill.id.slice(-8).toUpperCase()}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:600px;margin:auto}
      h2{color:#1d4ed8}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}th{background:#f9fafb}
      .total{text-align:right;font-weight:bold;margin-top:12px;font-size:1.1em}
      .header{border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px}
      .status{display:inline-block;padding:2px 10px;border-radius:99px;font-size:0.85em;background:${bill.paymentStatus === "PAID" ? "#d1fae5" : "#fef3c7"};color:${bill.paymentStatus === "PAID" ? "#065f46" : "#92400e"}}
      </style></head><body>
      <div class="header"><h2>IIT Jodhpur PHC — Invoice</h2>
      <p>Invoice ID: <strong>#${bill.id.slice(-8).toUpperCase()}</strong></p>
      <p>Date: ${new Date(bill.createdAt).toLocaleDateString("en-IN")}</p>
      <p>Visit Type: ${bill.visit?.visitType || "OPD"}</p>
      <p>Status: <span class="status">${bill.paymentStatus}</span></p></div>
      <table><tr><th>Medicine</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
      ${(bill.items || []).map(item => `<tr><td>${item.medicine?.name || "Item"}</td><td>${item.quantity}</td><td>₹${Number(item.medicine?.unitPrice || 0).toFixed(2)}</td><td>₹${Number(item.price || 0).toFixed(2)}</td></tr>`).join("")}
      </table><p class="total">Grand Total: ₹${Number(bill.totalAmount).toFixed(2)}</p>
      <p style="margin-top:32px;font-size:0.8em;color:#6b7280">Payments are accepted at the PHC pharmacy counter.</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  useEffect(() => {
    const fetchAllBills = async () => {
      try {
        const res = await getMyBills();
        if (res.success) setBills(res.data);
      } catch (err) {
        setError("Failed to load billing history.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllBills();
  }, []);

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
                  <React.Fragment key={bill.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
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
                          <p className="text-xs text-gray-500">
                            {formatDoctorName(bill.visit?.doctor?.name, "PHC Physician")}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">₹{Number(bill.totalAmount).toFixed(2)}</p>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full text-blue-600 hover:bg-blue-50"
                            title="View Details"
                            onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                          >
                            {expandedId === bill.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full text-gray-600 hover:bg-gray-50"
                            title="Print Invoice"
                            onClick={() => handlePrint(bill)}
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === bill.id && (
                      <tr className="bg-blue-50/20">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Bill Items</p>
                          <div className="space-y-2">
                            {(bill.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm bg-white rounded-lg px-4 py-2 border border-gray-100">
                                <span className="font-medium text-gray-800">{item.medicine?.name || "Item"}</span>
                                <span className="text-gray-500">Qty: {item.quantity}</span>
                                <span className="font-bold text-gray-900">₹{Number(item.price).toFixed(2)}</span>
                              </div>
                            ))}
                            {(!bill.items || bill.items.length === 0) && (
                              <p className="text-sm text-gray-400">No item details available.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
