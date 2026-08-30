import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository, User } from "../database/models";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET && isProduction) {
  throw new Error(
    "JWT_SECRET environment variable is required in production. Set it before starting the server.",
  );
}

const resolvedJwtSecret = JWT_SECRET || "bd-ticketpro-secret-key-2024";

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, resolvedJwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, resolvedJwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Get user from database
  const user = UserRepository.findById(payload.userId);
  if (!user || user.status !== "active") {
    return res.status(401).json({
      success: false,
      message: "User not found or inactive",
    });
  }

  // Remove password hash from user object
  delete user.password_hash;
  req.user = user;
  next();
}

// Role-based authorization middleware
export function authorize(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
}

// Permission-based authorization
export const PERMISSIONS = {
  admin: [
    "view_buying_price",
    "edit_batches",
    "delete_batches",
    "create_batches",
    "view_profit",
    "override_locks",
    "manage_users",
    "view_all_bookings",
    "confirm_bookings",
    "confirm_sales",
    "delete_bookings",
    "system_settings",
    "manage_umrah",
  ],
  manager: [
    "view_tickets",
    "create_bookings",
    "confirm_bookings",
    "confirm_sales",
    "view_all_bookings",
    "manage_umrah",
  ],
  staff: ["view_tickets", "create_bookings", "partial_payments"],
};

export function hasPermission(role: string, permission: string): boolean {
  return (
    PERMISSIONS[role as keyof typeof PERMISSIONS]?.includes(permission) || false
  );
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' required`,
      });
    }

    next();
  };
}

// Activity logging middleware
export function logActivity(action: string, entityType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store activity info to be logged after request completion
    res.locals.activityLog = {
      action,
      entityType,
      userId: req.user?.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
    };
    next();
  };
}
