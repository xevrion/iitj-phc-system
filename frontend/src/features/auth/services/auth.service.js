import api from "../../../services/api";

export const login = async (ldapId, password) => {
  const response = await api.post("/auth/login", { ldapId, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
