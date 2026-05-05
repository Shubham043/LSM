import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../models/user.model";

/**
 * requireRoles(...roles) → middleware that allows only listed roles through.
 * Returns 403 (Forbidden) — not 401 (Unauthenticated) — when role doesn't match.
 * This distinction matters: 401 means "who are you?", 403 means "I know who you are, you just can't do this."
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

// Convenience shorthands used in routes
export const adminOnly = requireRoles("admin");
export const borrowerOnly = requireRoles("borrower");
export const salesOrAdmin = requireRoles("sales", "admin");
export const sanctionOrAdmin = requireRoles("sanction", "admin");
export const disbursementOrAdmin = requireRoles("disbursement", "admin");
export const collectionOrAdmin = requireRoles("collection", "admin");

// Dashboard roles (anyone with an internal role)
export const dashboardAccess = requireRoles(
  "admin", "sales", "sanction", "disbursement", "collection"
);