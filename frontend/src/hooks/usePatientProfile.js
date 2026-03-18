import { useCallback, useEffect, useState } from "react";
import { api } from "../api/endpoints";

export function usePatientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.patients.myProfile();
      setProfile(res.data);
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to load profile");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return {
    profile,
    setProfile,
    loading,
    error,
    refresh,
  };
}
