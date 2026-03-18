import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("phc_access_token"));
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(Boolean(token));
  const navigate = useNavigate();

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setIsHydrating(false);
        return;
      }
      try {
        const res = await api.auth.me();
        setUser(res.data);
      } catch {
        localStorage.removeItem("phc_access_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsHydrating(false);
      }
    };
    hydrate();
  }, [token]);

  const login = async (ldapId, password) => {
    const res = await api.auth.login({ ldapId, password });
    const nextToken = res.data.token;
    localStorage.setItem("phc_access_token", nextToken);
    setToken(nextToken);
    setUser(res.data.user);
    navigate("/app", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("phc_access_token");
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({ token, user, setUser, login, logout, isHydrating }),
    [token, user, isHydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
