import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

const signToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
  );
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    // All users who sign up through the public form are borrowers
    const user = await User.create({ email, password, role: "borrower" });
    const token = signToken(String(user._id), user.role);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    // Include password for comparison (normally stripped by toJSON transform)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = signToken(String(user._id), user.role);

    // Return user without password (toJSON transform handles this)
    const userObj = user.toJSON();

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userObj,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set by authenticate middleware
    res.status(200).json({ success: true, user: (req as any).user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};