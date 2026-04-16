import api from "../../../services/api";

export const getPendingPrescriptions = async () => {
  const response = await api.get("/prescriptions/pending");
  return response.data;
};

export const dispensePrescription = async (id) => {
  const response = await api.put(`/prescriptions/${id}/dispense`);
  return response.data;
};

export const generateBillForVisit = async (visitId, items) => {
  const response = await api.post(`/visits/${visitId}/bill`, { items });
  return response.data;
};

export const getUnpaidBills = async () => {
  const response = await api.get("/bills/unpaid");
  return response.data;
};

export const payBill = async (billId) => {
  const response = await api.put(`/bills/${billId}/pay`);
  return response.data;
};

export const getMedicines = async () => {
  const response = await api.get("/medicines");
  return response.data;
};

export const updateMedicineStock = async (id, stockQuantity) => {
  const response = await api.put(`/medicines/${id}/stock`, { stockQuantity });
  return response.data;
};
