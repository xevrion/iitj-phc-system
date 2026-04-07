import React, { useState } from "react";
import { Lock, User } from "lucide-react";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { login } from "../services/auth.service";
import useAuthStore from "../../../store/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [ldapId, setLdapId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await login(ldapId, password);
      
      // Based on common ApiResponse structure: { success: true, data: { user, accessToken }, message: "..." }
      if (response.success) {
        const { user, accessToken } = response.data;
        setAuth(user, accessToken);
        
        // Success redirection - based on role
        const rolePath = user.role.toLowerCase().replace("_", "-");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 bg-blue-600 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">IITJ PHC</h1>
          <p className="text-blue-100">Integrated Digital System</p>
        </div>

        <div className="p-8">
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
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
              <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
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
