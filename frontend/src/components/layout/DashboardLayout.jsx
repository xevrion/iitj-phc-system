import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  FlaskConical, 
  User, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  Clock
} from "lucide-react";
import { cn } from "../../utils/cn";
import useAuthStore from "../../store/useAuthStore";
import Button from "../ui/Button";
import NotificationCenter from "../ui/NotificationCenter";

const DashboardLayout = ({ children, role, navItems }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col z-40",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className={cn("font-bold text-blue-600 truncate", !isSidebarOpen && "hidden")}>
            IITJ PHC
          </div>
          <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded-md">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 p-3 w-full rounded-lg text-red-500 hover:bg-red-50 transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-30">
          <div className="text-gray-700 font-semibold uppercase text-sm tracking-wider">
            {role.replace("_", " ")} Dashboard
          </div>
          <div className="flex items-center gap-6">
            <NotificationCenter />
            <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                  {role.replace("_", " ")}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {user?.patient?.name?.split(" ")[0] || user?.doctor?.name?.split(" ")[0] || user?.ldapId || "User"}
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {(user?.patient?.name || user?.doctor?.name || user?.ldapId || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
