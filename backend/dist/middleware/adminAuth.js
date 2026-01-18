"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminRole = requireAdminRole;
/**
 * Admin role verification middleware
 * Assumes authenticateToken has already been called
 */
function requireAdminRole(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!user.roles || !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}
