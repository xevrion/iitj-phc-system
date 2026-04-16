import api from "../../../services/api";

export const getMyProfile = async () => {
  const response = await api.get("/patients/me");
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await api.put("/patients/me", data);
  return response.data;
};

export const getMyVisits = async (id, { limit } = {}) => {
  const response = await api.get(`/patients/${id}/visits`, { params: limit ? { limit } : {} });
  return response.data;
};

export const getMyLabReports = async ({ limit } = {}) => {
  const response = await api.get("/patients/me/lab-reports", { params: limit ? { limit } : {} });
  return response.data;
};

export const getPrescriptionByVisit = async (visitId) => {
  const response = await api.get(`/visits/${visitId}/prescription`);
  return response.data;
};

export const getDoctors = async () => {
  const response = await api.get("/doctors");
  return response.data;
};

export const getAllDoctors = async () => {
  const response = await api.get("/admin/users?role=DOCTOR");
  return response.data;
};

export const bookAppointment = async (data) => {
  const response = await api.post("/appointments", data);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get("/appointments/my");
  return response.data;
};

export const getNotifications = async ({ since } = {}) => {
  const response = await api.get("/notifications/mine", { params: since ? { since } : {} });
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const getBillByVisit = async (visitId) => {
  const response = await api.get(`/visits/${visitId}/bill`);
  return response.data;
};

export const getMyBills = async () => {
  const response = await api.get("/bills/mine");
  return response.data;
};

export const getMyDocuments = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/documents`);
  return response.data;
};

export const uploadDocument = async (patientId, data) => {
  const response = await api.post(`/patients/${patientId}/documents`, data);
  return response.data;
};

export const deleteDocument = async (patientId, docId) => {
  const response = await api.delete(`/patients/${patientId}/documents/${docId}`);
  return response.data;
};
