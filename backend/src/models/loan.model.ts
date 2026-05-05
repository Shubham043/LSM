import mongoose, { Document, Schema } from "mongoose";

export type LoanStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "disbursed"
  | "closed";

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;

  // Loan configuration
  amount: number;       // Principal (₹50,000 – ₹5,00,000)
  tenure: number;       // Days (30 – 365)
  interestRate: number; // Fixed 12% p.a.

  // Calculated at creation using SI formula
  simpleInterest: number;       // (P × R × T) / (365 × 100)
  totalRepayment: number;       // P + SI
  totalPaid: number;            // Running total of payments received
  outstandingBalance: number;   // totalRepayment - totalPaid

  // Status
  status: LoanStatus;
  rejectionReason?: string;

  // Timestamps for each stage (audit trail)
  appliedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  disbursedAt?: Date;
  closedAt?: Date;

  // Executive who handled each stage
  sanctionedBy?: mongoose.Types.ObjectId;
  disbursedBy?: mongoose.Types.ObjectId;

  // Uploaded salary slip
  salarySlipUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenure: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },
    interestRate: {
      type: Number,
      default: 12, // Fixed at 12% p.a.
    },
    simpleInterest: {
      type: Number,
      required: true,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "disbursed", "closed"],
      default: "pending",
    },
    rejectionReason: { type: String },
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: "User" },
    disbursedBy: { type: Schema.Types.ObjectId, ref: "User" },
    salarySlipUrl: { type: String },
  },
  { timestamps: true }
);

// Index for fast queries by status (each dashboard module filters by status)
LoanSchema.index({ status: 1, createdAt: -1 });
LoanSchema.index({ borrower: 1 });

export default mongoose.model<ILoan>("Loan", LoanSchema);