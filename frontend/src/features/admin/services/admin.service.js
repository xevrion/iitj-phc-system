import api from "../../../services/api";

export const listUsers = async (role) => {
  const params = role ? { role } : {};
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/admin/users", data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const getUsageReport = async () => {
  const response = await api.get("/admin/reports/usage");
  return response.data;
};

export const getAttendanceReport = async () => {
  const response = await api.get("/admin/reports/attendance");
  return response.data;
};

export const publishEvent = async (data) => {
  const response = await api.post("/admin/events", data);
  return response.data;
};

export const getEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};
