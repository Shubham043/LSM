import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/user.model";
import Loan from "../models/loan.model";
import { runBRE } from "../services/bre.service";
import { calculateLoan } from "../services/loan.service";
import path from "path";

/**
 * STEP 2: Submit personal details → run BRE
 */
export const submitPersonalDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      res.status(400).json({ success: false, message: "All personal details are required" });
      return;
    }

    // Run BRE server-side
    const breResult = runBRE({
      pan,
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      employmentMode,
    });

    // Save details + BRE result regardless of pass/fail (for audit)
    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      {
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        employmentMode,
        breStatus: breResult.passed ? "passed" : "failed",
        breRejectionReason: breResult.rejectionReason,
      },
      { new: true }
    );

    if (!breResult.passed) {
      res.status(422).json({
        success: false,
        message: "Application rejected by eligibility check",
        reason: breResult.rejectionReason,
        breStatus: "failed",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Eligibility check passed",
      breStatus: "passed",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * STEP 3: Upload salary slip
 * Multer handles the file — controller just links it to the user
 */
export const uploadSalarySlip = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    // Check user passed BRE before allowing upload
    const user = await User.findById(req.user!._id);
    if (!user || user.breStatus !== "passed") {
      res.status(403).json({
        success: false,
        message: "Please complete eligibility check first",
      });
      return;
    }

    // Store relative path — serve /uploads statically from Express
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Salary slip uploaded successfully",
      fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during upload" });
  }
};

/**
 * STEP 4: Apply for loan
 */
export const applyForLoan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { amount, tenure, salarySlipUrl } = req.body;

    if (!amount || !tenure) {
      res.status(400).json({ success: false, message: "Loan amount and tenure are required" });
      return;
    }

    const principal = Number(amount);
    const tenureDays = Number(tenure);

    // Validate ranges
    if (principal < 50000 || principal > 500000) {
      res.status(400).json({ success: false, message: "Amount must be between ₹50,000 and ₹5,00,000" });
      return;
    }
    if (tenureDays < 30 || tenureDays > 365) {
      res.status(400).json({ success: false, message: "Tenure must be between 30 and 365 days" });
      return;
    }

    // Confirm user passed BRE
    const user = await User.findById(req.user!._id);
    if (!user || user.breStatus !== "passed") {
      res.status(403).json({ success: false, message: "Please complete eligibility check first" });
      return;
    }

    // Check for existing pending/active loan (one active loan per borrower)
    const existingLoan = await Loan.findOne({
      borrower: req.user!._id,
      status: { $in: ["pending", "approved", "disbursed"] },
    });
    if (existingLoan) {
      res.status(409).json({
        success: false,
        message: "You already have an active loan application",
      });
      return;
    }

    // Calculate using SI formula
    const calc = calculateLoan(principal, tenureDays);

    const loan = await Loan.create({
      borrower: req.user!._id,
      amount: principal,
      tenure: tenureDays,
      interestRate: calc.interestRate,
      simpleInterest: calc.simpleInterest,
      totalRepayment: calc.totalRepayment,
      totalPaid: 0,
      outstandingBalance: calc.totalRepayment,
      status: "pending",
      salarySlipUrl: salarySlipUrl || null,
      appliedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Loan application submitted successfully",
      loan,
      calculation: calc,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Borrower: view own loan(s)
 */
export const getMyLoans = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const loans = await Loan.find({ borrower: req.user!._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};