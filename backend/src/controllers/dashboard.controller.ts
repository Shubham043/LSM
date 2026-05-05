import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/user.model";
import Loan, { LoanStatus } from "../models/loan.model";
import Payment from "../models/payment.model";

/* ─── SALES MODULE ─────────────────────────────────────────────────────────
   Shows borrowers who registered but haven't applied for a loan yet.
   This is the lead tracking view.
───────────────────────────────────────────────────────────────────────────── */
export const getSalesLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all borrower user IDs who have at least one loan
    const usersWithLoans = await Loan.distinct("borrower");

    // Borrowers with NO loans = leads for sales team
    const leads = await User.find({
      role: "borrower",
      _id: { $nin: usersWithLoans },
    })
      .select("email fullName pan monthlySalary employmentMode breStatus createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── SANCTION MODULE ──────────────────────────────────────────────────────
   Shows loans in "pending" status. Executive can approve or reject.
───────────────────────────────────────────────────────────────────────────── */
export const getPendingLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: "pending" })
      .populate("borrower", "email fullName pan monthlySalary employmentMode salarySlipUrl")
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sanctionLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const { action, rejectionReason } = req.body; // action: "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }

    // State machine guard — can only sanction pending loans
    if (loan.status !== "pending") {
      res.status(409).json({
        success: false,
        message: `Cannot sanction a loan with status: ${loan.status}`,
      });
      return;
    }

    if (action === "approve") {
      loan.status = "approved";
      loan.approvedAt = new Date();
      loan.sanctionedBy = req.user!._id;
    } else {
      if (!rejectionReason) {
        res.status(400).json({ success: false, message: "Rejection reason is required" });
        return;
      }
      loan.status = "rejected";
      loan.rejectedAt = new Date();
      loan.rejectionReason = rejectionReason;
      loan.sanctionedBy = req.user!._id;
    }

    await loan.save();
    res.status(200).json({ success: true, message: `Loan ${action}d successfully`, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── DISBURSEMENT MODULE ──────────────────────────────────────────────────
   Shows approved loans. Executive marks them as disbursed.
───────────────────────────────────────────────────────────────────────────── */
export const getApprovedLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: "approved" })
      .populate("borrower", "email fullName pan")
      .populate("sanctionedBy", "email")
      .sort({ approvedAt: -1 });

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }

    // State machine guard
    if (loan.status !== "approved") {
      res.status(409).json({
        success: false,
        message: `Cannot disburse a loan with status: ${loan.status}`,
      });
      return;
    }

    loan.status = "disbursed";
    loan.disbursedAt = new Date();
    loan.disbursedBy = req.user!._id;
    await loan.save();

    res.status(200).json({ success: true, message: "Loan disbursed successfully", loan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── COLLECTION MODULE ────────────────────────────────────────────────────
   Shows disbursed loans. Executive records payments.
   Auto-closes loan when totalPaid >= totalRepayment.
───────────────────────────────────────────────────────────────────────────── */
export const getDisbursedLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: "disbursed" })
      .populate("borrower", "email fullName pan")
      .sort({ disbursedAt: -1 });

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const { utrNumber, amount, paymentDate, notes } = req.body;
    console.log("Recording payment request:", { loanId, utrNumber, amount, paymentDate, notes });
    
    if (!utrNumber || !amount || !paymentDate) {
      res.status(400).json({ success: false, message: "UTR number, amount, and date are required" });
      return;
    }

    const loan = await Loan.findById(loanId).populate("borrower");
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }

    console.log("Loan found:", { status: loan.status, outstandingBalance: loan.outstandingBalance });

    if (loan.status !== "disbursed") {
      res.status(409).json({ success: false, message: `Cannot record payment for loan with status: ${loan.status}` });
      return;
    }

    const paymentAmount = Math.round(Number(amount) * 100) / 100;
    const outstandingBalance = Math.round(loan.outstandingBalance * 100) / 100;
    
    console.log("Payment validation:", { paymentAmount, outstandingBalance });
    
    if (paymentAmount <= 0) {
      res.status(400).json({ success: false, message: "Payment amount must be greater than 0" });
      return;
    }

    if (paymentAmount > outstandingBalance + 0.01) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${paymentAmount}) exceeds outstanding balance (₹${outstandingBalance})`,
      });
      return;
    }

    const balanceBefore = outstandingBalance;
    let balanceAfter = Math.round(Math.max(0, balanceBefore - paymentAmount) * 100) / 100;
    
    console.log("Creating payment record...");
    
    const payment = await Payment.create({
      loan: loan._id,
      borrower: loan.borrower,
      recordedBy: req.user!._id,
      utrNumber: utrNumber.toUpperCase().trim(),
      amount: paymentAmount,
      paymentDate: new Date(paymentDate),
      notes,
      balanceBefore,
      balanceAfter,
    });

    console.log("Payment created:", payment._id);

    loan.totalPaid = Math.round((loan.totalPaid + paymentAmount) * 100) / 100;
    loan.outstandingBalance = balanceAfter;

    if (balanceAfter < 1) {
      loan.status = "closed";
      loan.closedAt = new Date();
      loan.outstandingBalance = 0;
    }

    console.log("Saving loan...");
    await loan.save();
    console.log("Loan saved successfully");

    res.status(201).json({
      success: true,
      message: loan.status === "closed" ? "Payment recorded. Loan fully repaid and closed!" : "Payment recorded successfully",
      payment,
      loan: {
        status: loan.status,
        totalPaid: loan.totalPaid,
        outstandingBalance: loan.outstandingBalance,
        totalRepayment: loan.totalRepayment,
      },
    });
  } catch (err: any) {
    console.error("Payment recording error:", err); // KEY DEBUG LINE
    
    if (err.code === 11000) {
      res.status(409).json({ success: false, message: "UTR number already exists. Each payment must have a unique UTR." });
      return;
    }
    
    res.status(500).json({ success: false, message: "Server error", error: err.message }); // Return error message
  }
};

export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const payments = await Payment.find({ loan: loanId })
      .populate("recordedBy", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── ADMIN: view all loans ─────────────────────────────────────────────── */
export const getAllLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status as LoanStatus } : {};

    const loans = await Loan.find(filter)
      .populate("borrower", "email fullName pan")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};