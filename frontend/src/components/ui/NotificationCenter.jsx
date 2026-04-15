import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, AlertCircle, X, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { getNotifications, markNotificationRead } from "../../features/patient/services/patient.service";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Bell size={18} className="text-blue-600" /> Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-full">
                {unreadCount} NEW
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs text-gray-400 font-medium">Checking for updates...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-4 transition-colors relative group",
                    !notif.readAt ? "bg-blue-50/30" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      notif.notificationType.includes("UNAVAILABLE") ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {notif.notificationType.includes("UNAVAILABLE") ? <AlertCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={cn("text-sm font-bold", !notif.readAt ? "text-gray-900" : "text-gray-600")}>
                          {notif.title}
                        </p>
                        {!notif.readAt && (
                          <button 
                            onClick={() => handleMarkRead(notif.id)}
                            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock size={10} /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-3">
                  <Bell size={24} />
                </div>
                <p className="text-sm font-bold text-gray-900">All caught up!</p>
                <p className="text-xs text-gray-500 mt-1 px-8">You'll see alerts here about doctor availability and appointments.</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-50 text-center bg-gray-50/30">
            <button 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
