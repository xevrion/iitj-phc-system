import api from "../../../services/api";

export const getPendingLabRequests = async () => {
  const response = await api.get("/lab-requests/pending");
  return response.data;
};

export const getLabRequestById = async (id) => {
  const response = await api.get(`/lab-requests/${id}`);
  return response.data;
};

export const uploadLabReport = async (id, reportUrl) => {
  const response = await api.post(`/lab-requests/${id}/report`, { reportUrl });
  return response.data;
};
