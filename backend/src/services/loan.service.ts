/**
 * Loan calculation service
 * SI = (P × R × T) / (365 × 100)  where T = tenure in days, R = 12% p.a.
 */

const INTEREST_RATE = 12; // Fixed 12% p.a.

export interface LoanCalculation {
  principal: number;
  interestRate: number;
  tenure: number;
  simpleInterest: number;
  totalRepayment: number;
}

export function calculateLoan(principal: number, tenureDays: number): LoanCalculation {
  const simpleInterest = (principal * INTEREST_RATE * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;

  return {
    principal,
    interestRate: INTEREST_RATE,
    tenure: tenureDays,
    simpleInterest: Math.round(simpleInterest * 100) / 100,   // Round to 2 decimal places
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}