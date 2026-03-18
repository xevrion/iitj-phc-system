import { apiClient } from "./client";

const unwrap = async (promise) => {
  const { data } = await promise;
  return data;
};

export const api = {
  healthcheck: () => unwrap(apiClient.get("/healthcheck")),

  auth: {
    login: (payload) => unwrap(apiClient.post("/auth/login", payload)),
    me: () => unwrap(apiClient.get("/auth/me")),
  },

  patients: {
    myProfile: () => unwrap(apiClient.get("/patients/me")),
    updateMyProfile: (payload) => unwrap(apiClient.put("/patients/me", payload)),
    byId: (id) => unwrap(apiClient.get(`/patients/${id}`)),
    byQr: (qrCode) => unwrap(apiClient.get(`/patients/qr/${encodeURIComponent(qrCode)}`)),
    visitHistory: (id) => unwrap(apiClient.get(`/patients/${id}/visits`)),
  },

  doctors: {
    list: () => unwrap(apiClient.get("/doctors")),
    byId: (id) => unwrap(apiClient.get(`/doctors/${id}`)),
    updateAvailability: (isAvailable) =>
      unwrap(apiClient.put("/doctors/me/availability", { isAvailable })),
    checkin: () => unwrap(apiClient.post("/doctors/me/checkin")),
    checkout: () => unwrap(apiClient.post("/doctors/me/checkout")),
    myAppointments: () => unwrap(apiClient.get("/doctors/me/appointments")),
    attendance: (doctorId) =>
      unwrap(apiClient.get("/doctors/attendance/records", { params: { doctorId } })),
    appointmentsByDoctor: (id) => unwrap(apiClient.get(`/doctors/${id}/appointments`)),
  },

  appointments: {
    book: (payload) => unwrap(apiClient.post("/appointments", payload)),
    my: () => unwrap(apiClient.get("/appointments/my")),
    cancel: (id) => unwrap(apiClient.put(`/appointments/${id}/cancel`)),
  },

  visits: {
    create: (payload) => unwrap(apiClient.post("/visits", payload)),
    myQueue: () => unwrap(apiClient.get("/visits/my-queue")),
    byId: (id) => unwrap(apiClient.get(`/visits/${id}`)),
    vitals: (id, payload) => unwrap(apiClient.post(`/visits/${id}/vitals`, payload)),
    claim: (id) => unwrap(apiClient.put(`/visits/${id}/claim`)),
    consultation: (id, consultationNotes) =>
      unwrap(apiClient.put(`/visits/${id}/consultation`, { consultationNotes })),
    complete: (id) => unwrap(apiClient.put(`/visits/${id}/complete`)),
    cancel: (id) => unwrap(apiClient.put(`/visits/${id}/cancel`)),
  },

  prescriptions: {
    create: (visitId, payload) =>
      unwrap(apiClient.post(`/visits/${visitId}/prescription`, payload)),
    byVisit: (visitId) => unwrap(apiClient.get(`/visits/${visitId}/prescription`)),
    pending: () => unwrap(apiClient.get("/prescriptions/pending")),
    dispense: (id) => unwrap(apiClient.put(`/prescriptions/${id}/dispense`)),
  },

  lab: {
    create: (visitId, payload) => unwrap(apiClient.post(`/visits/${visitId}/lab-requests`, payload)),
    byVisit: (visitId) => unwrap(apiClient.get(`/visits/${visitId}/lab-requests`)),
    pending: () => unwrap(apiClient.get("/lab-requests/pending")),
    uploadReport: (id, payload) => unwrap(apiClient.post(`/lab-requests/${id}/report`, payload)),
  },

  medicines: {
    list: () => unwrap(apiClient.get("/medicines")),
    byId: (id) => unwrap(apiClient.get(`/medicines/${id}`)),
    create: (payload) => unwrap(apiClient.post("/medicines", payload)),
    updateStock: (id, payload) => unwrap(apiClient.put(`/medicines/${id}/stock`, payload)),
  },

  billing: {
    create: (visitId, payload) => unwrap(apiClient.post(`/visits/${visitId}/bill`, payload)),
    byVisit: (visitId) => unwrap(apiClient.get(`/visits/${visitId}/bill`)),
    unpaid: () => unwrap(apiClient.get("/bills/unpaid")),
    pay: (billId) => unwrap(apiClient.put(`/bills/${billId}/pay`)),
  },

  checkin: {
    create: (payload) => unwrap(apiClient.post("/checkin", payload)),
  },

  documents: {
    upload: (patientId, payload) => unwrap(apiClient.post(`/patients/${patientId}/documents`, payload)),
    list: (patientId) => unwrap(apiClient.get(`/patients/${patientId}/documents`)),
  },
};
