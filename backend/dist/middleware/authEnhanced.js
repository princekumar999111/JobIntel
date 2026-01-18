"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateTokenEnhanced = authenticateTokenEnhanced;
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireAllPermissions = requireAllPermissions;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure env is loaded
if (!process.env.JWT_SECRET) {
    dotenv_1.default.config();
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_9f3a2b4c";
/**
 * Enhanced middleware that populates admin role and permissions
 */
async function authenticateTokenEnhanced(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Missing token" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.User.findById(payload.sub)
            .select("email roles tier adminRole")
            .populate('adminRole', 'name tier permissions');
        if (!user)
            return res.status(401).json({ message: "User not found" });
        req.user = user;
        // If user has adminRole, populate permissions
        if (user.adminRole) {
            const roleData = user.adminRole;
            req.adminRole = roleData;
            req.permissions = (roleData && roleData.permissions) ? roleData.permissions : [];
        }
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
/**
 * Backward compatible middleware (existing auth)
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Missing token" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.User.findById(payload.sub).select("email roles tier");
        if (!user)
            return res.status(401).json({ message: "User not found" });
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
/**
 * Check if user has specific role (backward compatible)
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
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
function requirePermission(permissionCode) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
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
function requireAnyPermission(permissionCodes) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
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
function requireAllPermissions(permissionCodes) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
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
