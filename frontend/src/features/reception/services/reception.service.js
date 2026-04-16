import api from "../../../services/api";

export const identifyPatientByQR = async (qrCode) => {
  const response = await api.get(`/patients/qr/${qrCode}`);
  return response.data;
};

export const getPatientById = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const createVisit = async (data) => {
  const response = await api.post("/visits", data);
  return response.data;
};

export const updateVitals = async (visitId, vitals) => {
  const response = await api.post(`/visits/${visitId}/vitals`, vitals);
  return response.data;
};

export const getAvailableDoctors = async () => {
  const response = await api.get("/doctors");
  return response.data;
};

export const getPatientVisits = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/visits`);
  return response.data;
};
