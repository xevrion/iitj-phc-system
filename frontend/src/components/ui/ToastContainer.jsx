import React from "react";
import { X, Bell, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/cn";
import useToastStore from "../../store/useToastStore";

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-right-10 duration-300 flex gap-3 relative overflow-hidden group"
        >
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-blue-600 animate-out fade-out duration-5000 origin-left scale-x-0" />
          
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            toast.type === "error" ? "bg-red-100 text-red-600" : 
            toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
          )}>
            {toast.type === "error" ? <AlertCircle size={20} /> : 
             toast.type === "success" ? <CheckCircle2 size={20} /> : <Bell size={20} />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 pr-6">{toast.title}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
