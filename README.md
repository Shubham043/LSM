# 🏦 Loan Management System

**Full-stack lending platform with role-based access control and automated loan lifecycle management**

> **Assignment Submission** | Built with Next.js, Node.js, TypeScript, and MongoDB

---

## 📹 Demo Video

**[Watch 8-min walkthrough](https://www.loom.com/share/f3aab5211ff541eb98a4d144e0fae857)** — Shows complete flow from borrower application to loan closure

---

## 🎯 What This System Does

A complete loan management platform handling the entire lending lifecycle:

1. **Borrowers** apply for loans through a multi-step form with real-time eligibility checks
2. **Sales team** tracks leads and conversions
3. **Sanction executives** approve/reject applications
4. **Disbursement team** releases funds
5. **Collection executives** record payments and auto-close fully repaid loans

**Key Features:**
- ✅ Business Rules Engine (BRE) with age, salary, PAN, and employment validation
- ✅ Live loan calculator with simple interest (updates as sliders move)
- ✅ File upload with validation (salary slips, max 5MB)
- ✅ Role-based access control on frontend + backend
- ✅ Payment tracking with UTR uniqueness enforcement
- ✅ Auto-closure when loans are fully repaid
- ✅ Floating-point precision handling for financial calculations

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.x
- MongoDB >= 5.x
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/lms.git
cd lms

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Seed Database

```bash
cd backend
npx ts-node seed.ts
```

This creates test accounts for all roles (see credentials below).

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 🔐 Test Credentials

Login at `http://localhost:3000/login` with these accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@lms.com | admin123 | All modules |
| **Sales** | sales@lms.com | sales123 | Sales module only |
| **Sanction** | sanction@lms.com | sanction123 | Sanction module only |
| **Disbursement** | disburse@lms.com | disburse123 | Disbursement module only |
| **Collection** | collection@lms.com | collection123 | Collection module only |
| **Borrower** | borrower@lms.com | borrower123 | Application portal only |

---

### API Endpoints

**Authentication**
```
POST   /api/auth/register       - Create new borrower account
POST   /api/auth/login          - Login with JWT token
GET    /api/auth/me             - Get current user info
```

**Borrower Flow**
```
POST   /api/borrower/personal   - Submit personal details + BRE check
POST   /api/borrower/upload     - Upload salary slip
POST   /api/loans/apply         - Submit loan application
GET    /api/loans/my-loan       - Get borrower's active loan
```

**Dashboard - Sales**
```
GET    /api/dashboard/sales     - List all registered users (leads)
```

**Dashboard - Sanction**
```
GET    /api/dashboard/sanction              - List applied loans
PUT    /api/dashboard/sanction/:id/approve  - Approve a loan
PUT    /api/dashboard/sanction/:id/reject   - Reject with reason
```

**Dashboard - Disbursement**
```
GET    /api/dashboard/disbursement          - List sanctioned loans
PUT    /api/dashboard/disbursement/:id      - Mark as disbursed
```

**Dashboard - Collection**
```
GET    /api/dashboard/collection            - List disbursed loans
POST   /api/loans/:loanId/payments          - Record a payment
GET    /api/loans/:loanId/payments          - Get payment history
```

---

## 🧮 Business Logic Implementation

### Business Rules Engine (BRE)
**Design Decision:** BRE runs on backend only (not client-side) to prevent bypass via DevTools.


### Payment Handling & Auto-Closure

**Key Features:**
1. **UTR Uniqueness:** MongoDB unique index on `utrNumber` prevents duplicate payments
2. **Balance Tracking:** Each payment records `balanceBefore` and `balanceAfter` for audit trail
3. **Floating-Point Safety:** All amounts rounded to 2 decimals to avoid precision errors
4. **Auto-Closure:** When `outstandingBalance <₹1`, loan status changes to `closed`



**Why < ₹1 instead of === 0?** Prevents edge cases where borrower can't close loan due to 48 paisa remaining (floating-point precision issue).

---

## 🔒 Role-Based Access Control (RBAC)

### Frontend Protection
- Route guards in Next.js middleware
- Conditional rendering of dashboard modules
- Role-based navigation menus

**Security Note:** Every protected endpoint has both:
1. Authentication check (valid JWT)
2. Authorization check (correct role)

---

## 🎨 UI/UX Highlights

- **Live Loan Calculator:** Real-time updates as sliders move (debounced for performance)
- **Multi-Step Form:** Clear progress indicator, back/next navigation
- **File Upload Preview:** Shows uploaded salary slip with file size
- **Responsive Design:** Works on mobile, tablet, desktop
- **Error Handling:** Clear validation messages for BRE failures
- **Loading States:** Skeleton loaders during API calls

---

## 📂 Project Structure

```
LMS/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, Multer setup
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth + RBAC middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic (BRE, calculations)
│   │   └── index.ts         # Server entry point
│   ├── uploads/             # File storage (gitignored)
│   ├── seed.ts              # Database seeding script
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/             # Next.js App Router pages
    │   ├── components/      # Reusable React components
    │   ├── lib/             # API client, utilities
    │   └── middleware.ts    # Route protection
    └── package.json
```

---

## 🧪 Testing the Complete Flow

### Scenario 1: Successful Loan (End-to-End)

1. **Borrower applies:**
   - Login as `borrower@lms.com`
   - Fill personal details (age 25, salary ₹30,000, valid PAN, salaried)
   - Upload salary slip PDF
   - Configure loan: ₹1,00,000 for 180 days
   - Submit → Loan created with status `applied`

2. **Sanction approves:**
   - Login as `sanction@lms.com`
   - View applied loans → Approve the loan
   - Status changes to `sanctioned`

3. **Disbursement releases funds:**
   - Login as `disburse@lms.com`
   - View sanctioned loans → Mark as disbursed
   - Status changes to `disbursed`

4. **Collection records payment:**
   - Login as `collection@lms.com`
   - View disbursed loans → Record payment
   - Enter UTR: `PAY123456`, Amount: ₹1,05,917.81, Date: today
   - Loan auto-closes, status changes to `closed`

### Scenario 2: BRE Rejection

1. Login as `borrower@lms.com`
2. Fill personal details with age 22 (below 23)
3. Submit → BRE rejects with "Age must be between 23 and 50 years"
4. Cannot proceed to upload step

### Scenario 3: Payment Validation

1. Try to record payment with duplicate UTR → Error: "UTR already exists"
2. Try to record payment exceeding outstanding balance → Error: "Payment exceeds balance"
3. Record payment of ₹50,000 → Outstanding updates, loan remains `disbursed`
4. Record final payment → Auto-closes when balance < ₹1

---

## 🛠️ Technical Decisions & Rationale

### Why BRE on Backend Only?
- **Security:** Client-side checks can be bypassed via browser DevTools
- **Single source of truth:** All validation logic centralized
- **Audit trail:** Server logs all BRE decisions

### Why Simple Interest?
- Assignment requirement (12% p.a. fixed rate)
- Easier for borrowers to understand vs. compound interest
- Formula: `SI = (P × R × T) / (365 × 100)`


### Why Separate Payments Collection?
- Easier to query payment history
- Supports future features (payment methods, gateway integration)
- Clear audit trail with `balanceBefore`/`balanceAfter` snapshots

### Why Auto-Close at < ₹1?
- Prevents floating-point precision issues (0.48 paisa remaining)
- Better UX (borrower doesn't need to track exact paisa)
- Common practice in fintech (write-off negligible amounts)

---

## 🚧 Known Limitations & Future Enhancements

**Current Limitations:**
- No email notifications (would add SendGrid for loan status updates)
- No document verification (would integrate OCR for salary slip parsing)
- No credit score integration (would add Experian/CIBIL API)
- File storage on local disk (would move to S3 for production)

**Future Enhancements:**
- SMS notifications for payment reminders
- Automated EMI scheduling
- Dashboard analytics (charts for collection efficiency, default rates)
- Export reports to Excel/PDF
- WhatsApp integration for status updates

---

## 📊 Assignment Checklist

- [x] **End-to-end flow works** — Borrower apply → Approve → Disburse → Pay → Close
- [x] **TypeScript everywhere** — Strict types, no `any` (except error handling)
- [x] **BRE correct** — Age, salary, PAN, employment validation
- [x] **Loan math correct** — Simple interest formula, live calculator
- [x] **RBAC frontend + backend** — Middleware checks, route guards
- [x] **Responsive UI** — Tailwind CSS, mobile-friendly
- [x] **README complete** — Setup steps, credentials, architecture docs
- [x] **Seed script** — Pre-creates all test accounts
- [x] **UTR uniqueness** — MongoDB unique index
- [x] **Auto-close logic** — Loans close when fully repaid

---

## 📧 Questions?

**Shubham**  
- GitHub: [@yourusername](https://github.com/Shubham043)  
- Email: rawanshubham@example.com  

---
