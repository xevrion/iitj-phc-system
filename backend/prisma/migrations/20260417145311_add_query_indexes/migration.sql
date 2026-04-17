-- Doctor availability dashboards
CREATE INDEX "Doctor_isAvailable_doctorType_idx" ON "Doctor"("isAvailable", "doctorType");

-- Visit queues, history, and patient current-visit lookups
CREATE INDEX "Visit_patientId_createdAt_idx" ON "Visit"("patientId", "createdAt");
CREATE INDEX "Visit_patientId_visitStatus_createdAt_idx" ON "Visit"("patientId", "visitStatus", "createdAt");
CREATE INDEX "Visit_doctorId_visitStatus_createdAt_idx" ON "Visit"("doctorId", "visitStatus", "createdAt");
CREATE INDEX "Visit_visitStatus_createdAt_idx" ON "Visit"("visitStatus", "createdAt");

-- Appointment listings
CREATE INDEX "Appointment_doctorId_appointmentTime_idx" ON "Appointment"("doctorId", "appointmentTime");
CREATE INDEX "Appointment_patientId_appointmentTime_idx" ON "Appointment"("patientId", "appointmentTime");
CREATE INDEX "Appointment_status_appointmentTime_idx" ON "Appointment"("status", "appointmentTime");

-- Prescription queues
CREATE INDEX "Prescription_isDispensed_createdAt_idx" ON "Prescription"("isDispensed", "createdAt");
CREATE INDEX "Prescription_doctorId_createdAt_idx" ON "Prescription"("doctorId", "createdAt");

-- Lab queues and visit drill-down
CREATE INDEX "LabRequest_visitId_idx" ON "LabRequest"("visitId");
CREATE INDEX "LabRequest_doctorId_idx" ON "LabRequest"("doctorId");
CREATE INDEX "LabRequest_status_idx" ON "LabRequest"("status");

-- Inventory list sorting
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");

-- Billing queues
CREATE INDEX "Bill_paymentStatus_createdAt_idx" ON "Bill"("paymentStatus", "createdAt");

-- Attendance and availability checks
CREATE INDEX "DoctorAttendance_doctorId_checkOut_idx" ON "DoctorAttendance"("doctorId", "checkOut");
CREATE INDEX "DoctorAttendance_doctorId_checkIn_idx" ON "DoctorAttendance"("doctorId", "checkIn");

-- Upcoming event listing
CREATE INDEX "PHCEvent_eventDate_idx" ON "PHCEvent"("eventDate");

-- Notification polling and read-state updates
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_doctorId_idx" ON "Notification"("doctorId");
CREATE INDEX "Notification_appointmentId_idx" ON "Notification"("appointmentId");
