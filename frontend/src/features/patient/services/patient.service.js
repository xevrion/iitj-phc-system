import api from "../../../services/api";

export const getMyProfile = async () => {
  const response = await api.get("/patients/me");
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await api.put("/patients/me", data);
  return response.data;
};

export const getMyVisits = async (id) => {
  const response = await api.get(`/patients/${id}/visits`);
  return response.data;
};

export const getMyLabReports = async () => {
  const response = await api.get("/patients/me/lab-reports");
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

export const bookAppointment = async (data) => {
  const response = await api.post("/appointments", data);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get("/appointments/my");
  return response.data;
};
