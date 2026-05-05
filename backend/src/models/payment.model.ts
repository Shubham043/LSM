import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  loan: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId; // collection executive

  utrNumber: string;   // Unique Transaction Reference — unique across ALL payments
  amount: number;
  paymentDate: Date;
  notes?: string;

  // Snapshot of outstanding balance BEFORE this payment (audit trail)
  balanceBefore: number;
  balanceAfter: number;

  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loan: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    borrower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,   // DB-level uniqueness — duplicate UTR = hard error
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      // min: 1,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    notes: { type: String },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ loan: 1, createdAt: -1 });

export default mongoose.model<IPayment>("Payment", PaymentSchema);