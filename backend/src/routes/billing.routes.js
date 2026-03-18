import { Router } from "express";
import { create, getByVisit, pay, unpaid } from "../controllers/billing.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Nested under /api/v1/visits/:visitId/bill
const visitBillingRouter = Router({ mergeParams: true });
visitBillingRouter.use(verifyJWT);

visitBillingRouter.post(
  "/",
  authorizeRoles("PHARMACY_STAFF", "ADMIN"),
  create
);
visitBillingRouter.get(
  "/",
  authorizeRoles("PHARMACY_STAFF", "DOCTOR", "PATIENT", "ADMIN"),
  getByVisit
);

// Top-level /api/v1/bills for pharmacy operations
const billRouter = Router();
billRouter.use(verifyJWT);

billRouter.get("/unpaid", authorizeRoles("PHARMACY_STAFF", "ADMIN"), unpaid);
billRouter.put("/:billId/pay", authorizeRoles("PHARMACY_STAFF", "ADMIN"), pay);

export { visitBillingRouter, billRouter };
