import api from "../../../services/api";

export const getDoctorQueue = async () => {
  const response = await api.get("/visits/my-queue");
  return response.data;
};

export const getDoctorAppointments = async () => {
  const response = await api.get("/doctors/me/appointments");
  return response.data;
};

export const updateMyAvailability = async (isAvailable) => {
  const response = await api.put("/doctors/me/availability", { isAvailable });
  return response.data;
};

export const checkInDoctor = async () => {
  const response = await api.post("/doctors/me/checkin");
  return response.data;
};

export const checkOutDoctor = async () => {
  const response = await api.post("/doctors/me/checkout");
  return response.data;
};

export const claimVisit = async (visitId) => {
  const response = await api.put(`/visits/${visitId}/claim`);
  return response.data;
};

export const completeVisit = async (visitId) => {
  const response = await api.put(`/visits/${visitId}/complete`);
  return response.data;
};

export const getVisitById = async (visitId) => {
  const response = await api.get(`/visits/${visitId}`);
  return response.data;
};

export const saveConsultationNotes = async (visitId, notes) => {
  const response = await api.put(`/visits/${visitId}/consultation`, { consultationNotes: notes });
  return response.data;
};

export const createPrescription = async (visitId, data) => {
  const response = await api.post(`/visits/${visitId}/prescription`, data);
  return response.data;
};

export const createLabRequest = async (visitId, testName) => {
  const response = await api.post(`/visits/${visitId}/lab-requests`, { testName });
  return response.data;
};

export const getMedicines = async () => {
  const response = await api.get("/medicines");
  return response.data;
};

export const getDoctorAttendance = async (doctorId) => {
  const response = await api.get(`/doctors/attendance/records?doctorId=${doctorId}`);
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};
