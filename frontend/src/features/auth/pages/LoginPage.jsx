import React, { useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { login } from "../services/auth.service";
import useAuthStore from "../../../store/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  
  const [ldapId, setLdapId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await login(ldapId, password);
      
      if (response.success) {
        const { user, token } = response.data;
        // Set basic auth first
        useAuthStore.getState().setAuth(user, token);
        
        // Fetch full profile (with patient info) before navigating
        await useAuthStore.getState().checkAuth();
        
        const currentUser = useAuthStore.getState().user;
        const rolePath = currentUser.role.toLowerCase().replace("_", "-");
        navigate(`/${rolePath}`);
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        "Unable to connect to the server. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mx-auto">
        <div className="p-6 sm:p-8 bg-blue-600 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">IITJ PHC</h1>
          <p className="text-blue-100">Integrated Digital System</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <Input
                label="LDAP ID"
                placeholder="e.g. b22cs001"
                value={ldapId}
                onChange={(e) => setLdapId(e.target.value)}
                required
                className="pl-10"
              />
              <User className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-11"
              />
              <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-8.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Login to Portal
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By logging in, you agree to the institution's IT policy and data privacy guidelines.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-gray-400 text-sm">
        &copy; 2026 IIT Jodhpur PHC Management System
      </div>
    </div>
  );
};

export default LoginPage;
