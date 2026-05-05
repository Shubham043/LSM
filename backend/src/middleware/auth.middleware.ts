import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser, UserRole } from "../models/user.model";

// Extend Express Request to carry the authenticated user
export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({ success: false, message: "JWT secret not configured" });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};