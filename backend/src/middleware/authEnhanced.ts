import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AdminRole } from "../models/AdminRole";
import dotenv from "dotenv";

// Ensure env is loaded
if (!process.env.JWT_SECRET) {
  dotenv.config();
}

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_9f3a2b4c";

export interface AuthRequest extends Request {
  user?: any;
  adminRole?: any;
  permissions?: string[];
}

/**
 * Enhanced middleware that populates admin role and permissions
 */
export async function authenticateTokenEnhanced(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = (req as any).headers["authorization"] as string | undefined;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub)
      .select("email roles tier adminRole")
      .populate('adminRole', 'name tier permissions');

    if (!user) return res.status(401).json({ message: "User not found" });
    
    req.user = user;
    
    // If user has adminRole, populate permissions
    if (user.adminRole) {
      const roleData = user.adminRole as any;
      req.adminRole = roleData;
      req.permissions = (roleData && roleData.permissions) ? roleData.permissions : [];
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Backward compatible middleware (existing auth)
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = (req as any).headers["authorization"] as string | undefined;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select("email roles tier");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Check if user has specific role (backward compatible)
 */
export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

/**
 * Check if user has specific permission
 * Usage: app.get('/api/endpoint', requirePermission('jobs.approve'))
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is SUPER_ADMIN (has 'admin' role)
    if (req.user.roles && req.user.roles.includes('admin')) {
      return next(); // Admins have all permissions
    }
    
    // Check permissions array
    if (!req.permissions || !req.permissions.includes(permissionCode)) {
      return res.status(403).json({ 
        message: "Forbidden",
        error: `Missing permission: ${permissionCode}`
      });
    }
    
    next();
  };
}

/**
 * Check if user has ANY of the specified permissions
 * Usage: app.get('/api/endpoint', requireAnyPermission(['jobs.view', 'jobs.approve']))
 */
export function requireAnyPermission(permissionCodes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is SUPER_ADMIN
    if (req.user.roles && req.user.roles.includes('admin')) {
      return next();
    }
    
    // Check if user has any of the permissions
    if (req.permissions && req.permissions.some(p => permissionCodes.includes(p))) {
      return next();
    }
    
    return res.status(403).json({ 
      message: "Forbidden",
      error: `Missing one of required permissions: ${permissionCodes.join(', ')}`
    });
  };
}

/**
 * Check if user has ALL of the specified permissions
 * Usage: app.post('/api/endpoint', requireAllPermissions(['jobs.create', 'jobs.approve']))
 */
export function requireAllPermissions(permissionCodes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is SUPER_ADMIN
    if (req.user.roles && req.user.roles.includes('admin')) {
      return next();
    }
    
    // Check if user has all permissions
    const hasAll = permissionCodes.every(p => req.permissions?.includes(p));
    if (hasAll) {
      return next();
    }
    
    return res.status(403).json({ 
      message: "Forbidden",
      error: `Missing required permissions: ${permissionCodes.join(', ')}`
    });
  };
}
