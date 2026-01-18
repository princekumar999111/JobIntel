"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const adminRoleController_1 = require("../controllers/adminRoleController");
const router = express_1.default.Router();
// ===========================
// ADMIN ROLE ROUTES
// ===========================
// Require SUPER_ADMIN for all role management routes
const requireSuperAdmin = (0, auth_1.requireRole)('SUPER_ADMIN');
/**
 * GET /api/admin/roles
 * List all admin roles
 */
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminRoleController_1.listAdminRoles);
/**
 * GET /api/admin/roles/:id
 * Get specific role by ID
 */
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminRoleController_1.getAdminRole);
/**
 * POST /api/admin/roles
 * Create new admin role (SUPER_ADMIN only)
 */
router.post('/', auth_1.authenticateToken, requireSuperAdmin, adminRoleController_1.createAdminRole);
/**
 * PUT /api/admin/roles/:id
 * Update admin role (SUPER_ADMIN only)
 */
router.put('/:id', auth_1.authenticateToken, requireSuperAdmin, adminRoleController_1.updateAdminRole);
/**
 * DELETE /api/admin/roles/:id
 * Delete admin role (SUPER_ADMIN only)
 */
router.delete('/:id', auth_1.authenticateToken, requireSuperAdmin, adminRoleController_1.deleteAdminRole);
/**
 * POST /api/admin/roles/:roleId/permissions
 * Add permission to role (SUPER_ADMIN only)
 */
router.post('/:roleId/permissions', auth_1.authenticateToken, requireSuperAdmin, adminRoleController_1.addPermissionToRole);
/**
 * DELETE /api/admin/roles/:roleId/permissions/:permissionCode
 * Remove permission from role (SUPER_ADMIN only)
 */
router.delete('/:roleId/permissions/:permissionCode', auth_1.authenticateToken, requireSuperAdmin, adminRoleController_1.removePermissionFromRole);
/**
 * GET /api/admin/permissions
 * List all available permissions
 */
router.get('/list/permissions', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminRoleController_1.listAllPermissions);
exports.default = router;
