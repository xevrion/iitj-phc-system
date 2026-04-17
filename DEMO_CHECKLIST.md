# Demo Checklist

## Accounts

- `patient01`
- `doctor01`
- `reception01`
- `pharmacy01`
- `lab01`
- `admin01`

## Demo Flow

1. Login
   - Show role-based routing and dashboard guards.

2. Reception
   - Identify patient by QR.
   - Create a visit.
   - Show live queue updates.

3. Doctor
   - Check in for attendance.
   - Open consultations separately from attendance.
   - Claim queue visit.
   - Save consultation notes.
   - Add prescription.
   - Add lab request.

4. Pharmacy
   - Generate bill from prescription.
   - Mark bill paid.
   - Dispense medicine.

5. Lab
   - Upload lab report file.

6. Patient
   - View current queue status.
   - View appointments.
   - View billing.
   - Open uploaded lab report.
   - Upload and delete a document from the vault.

7. Admin
   - Create/deactivate a user.
   - Publish an event.
   - Open usage/attendance reports.

## Demo Prep

1. Start LDAP and backend.
2. Ensure frontend is running.
3. Run seed if the environment is empty.
4. Keep one sample PDF ready for:
   - patient vault
   - lab report upload
5. Confirm Cloudinary env vars are valid.
6. Confirm `doctor01` is checked out before the demo starts.

## Recovery Notes

- If `doctor01` is already checked in, call `POST /api/v1/doctors/me/checkout`.
- If queue state is messy, create a fresh visit from reception.
- If lab upload fails, verify Cloudinary env vars and restart backend.
