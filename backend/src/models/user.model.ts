import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole =
  | "admin"
  | "sales"
  | "sanction"
  | "disbursement"
  | "collection"
  | "borrower";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  // Borrower personal info (filled in step 2)
  fullName?: string;
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: "salaried" | "self-employed" | "unemployed";
  // BRE status
  breStatus?: "pending" | "passed" | "failed";
  breRejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "sales", "sanction", "disbursement", "collection", "borrower"],
      default: "borrower",
    },
    fullName: { type: String, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ["salaried", "self-employed", "unemployed"],
    },
    breStatus: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    breRejectionReason: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;
  if (!doc.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  doc.password = await bcrypt.hash(doc.password, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

// Never expose password in JSON responses
UserSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.password = undefined;
    return ret;
  },
});

export default mongoose.model<IUser>("User", UserSchema);