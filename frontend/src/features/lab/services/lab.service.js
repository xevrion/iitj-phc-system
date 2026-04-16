import api from "../../../services/api";

export const getPendingLabRequests = async () => {
  const response = await api.get("/lab-requests/pending");
  return response.data;
};

export const getLabRequestById = async (id) => {
  const response = await api.get(`/lab-requests/${id}`);
  return response.data;
};

export const uploadLabReport = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/lab-requests/${id}/report`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
