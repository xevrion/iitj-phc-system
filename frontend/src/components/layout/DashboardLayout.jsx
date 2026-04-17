import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  LogOut, 
  Menu, 
  X
} from "lucide-react";
import { cn } from "../../utils/cn";
import useAuthStore from "../../store/useAuthStore";
import NotificationCenter from "../ui/NotificationCenter";

const DashboardLayout = ({ children, role, navItems }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const desktopSidebarWidthClass = isSidebarOpen ? "lg:pl-64" : "lg:pl-20";

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0 lg:w-64" : "-translate-x-full lg:w-20"
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
      <div className={cn("flex h-full flex-1 flex-col overflow-hidden", desktopSidebarWidthClass)}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 min-h-16 flex items-center justify-between px-4 sm:px-6 py-3 z-30 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="text-gray-700 font-semibold uppercase text-xs sm:text-sm tracking-wider truncate">
              {role.replace("_", " ")} Dashboard
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <NotificationCenter />
            <div className="flex items-center gap-3 sm:gap-4 border-l border-gray-100 pl-3 sm:pl-6 min-w-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                  {role.replace("_", " ")}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {user?.patient?.name?.split(" ")[0] || user?.doctor?.name?.split(" ").pop() || user?.ldapId || "User"}
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {(user?.patient?.name || user?.doctor?.name?.replace("Dr. ", "") || user?.ldapId || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
