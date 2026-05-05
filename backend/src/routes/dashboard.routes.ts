import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  salesOrAdmin,
  sanctionOrAdmin,
  disbursementOrAdmin,
  collectionOrAdmin,
  adminOnly,
} from "../middleware/rbac.middleware";
import {
  getSalesLeads,
  getPendingLoans,
  sanctionLoan,
  getApprovedLoans,
  disburseLoan,
  getDisbursedLoans,
  recordPayment,
  getLoanPayments,
  getAllLoans,
} from "../controllers/dashboard.controller";

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// ── Sales module ────────────────────────────────────────────────────────────
router.get("/sales/leads", salesOrAdmin, getSalesLeads);

// ── Sanction module ─────────────────────────────────────────────────────────
router.get("/sanction/loans", sanctionOrAdmin, getPendingLoans);
router.patch("/sanction/loans/:loanId", sanctionOrAdmin, sanctionLoan);

// ── Disbursement module ─────────────────────────────────────────────────────
router.get("/disbursement/loans", disbursementOrAdmin, getApprovedLoans);
router.patch("/disbursement/loans/:loanId/disburse", disbursementOrAdmin, disburseLoan);

// ── Collection module ────────────────────────────────────────────────────────
router.get("/collection/loans", collectionOrAdmin, getDisbursedLoans);
router.post("/collection/loans/:loanId/payments", collectionOrAdmin, recordPayment);
router.get("/collection/loans/:loanId/payments", collectionOrAdmin, getLoanPayments);

// ── Admin: see everything ────────────────────────────────────────────────────
router.get("/admin/loans", adminOnly, getAllLoans);

export default router;