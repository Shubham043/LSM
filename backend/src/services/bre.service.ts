/**
 * Business Rule Engine (BRE)
 *
 * Lives ONLY on the server. Even if we showed a preview on the client,
 * the canonical rejection decision always comes from here.
 * This prevents anyone from bypassing checks by manipulating frontend JS.
 */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MIN_AGE = 23;
const MAX_AGE = 50;
const MIN_SALARY = 25000;

export interface BREInput {
  pan: string;
  dateOfBirth: Date | string;
  monthlySalary: number;
  employmentMode: "salaried" | "self-employed" | "unemployed";
}

export interface BREResult {
  passed: boolean;
  rejectionReason?: string;
}

function calculateAge(dob: Date | string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  // Rule 1: Valid PAN format
  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    return {
      passed: false,
      rejectionReason: "Invalid PAN format. PAN must be in format: ABCDE1234F",
    };
  }

  // Rule 2: Age between 23 and 50
  const age = calculateAge(input.dateOfBirth);
  if (age < MIN_AGE || age > MAX_AGE) {
    return {
      passed: false,
      rejectionReason: `Age must be between ${MIN_AGE} and ${MAX_AGE} years. Your age: ${age}`,
    };
  }

  // Rule 3: Not unemployed
  if (input.employmentMode === "unemployed") {
    return {
      passed: false,
      rejectionReason: "Unemployed applicants are not eligible for a loan",
    };
  }

  // Rule 4: Minimum salary
  if (input.monthlySalary < MIN_SALARY) {
    return {
      passed: false,
      rejectionReason: `Monthly salary must be at least ₹${MIN_SALARY.toLocaleString("en-IN")}. Provided: ₹${input.monthlySalary.toLocaleString("en-IN")}`,
    };
  }

  return { passed: true };
}