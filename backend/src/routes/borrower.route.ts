import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { borrowerOnly } from "../middleware/rbac.middleware";
import { upload } from "../config/multer";
import {
  submitPersonalDetails,
  uploadSalarySlip,
  applyForLoan,
  getMyLoans,
} from "../controllers/borrower.controller";

const router = Router();

// All borrower routes require auth + borrower role
router.use(authenticate, borrowerOnly);

router.post("/personal-details", submitPersonalDetails);
router.post("/upload-salary-slip", upload.single("salarySlip"), uploadSalarySlip);
router.post("/apply", applyForLoan);
router.get("/my-loans", getMyLoans);

export default router;