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
