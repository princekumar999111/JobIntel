import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  listAdminRoles,
  getAdminRole,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  addPermissionToRole,
  removePermissionFromRole,
  listAllPermissions,
} from '../controllers/adminRoleController';

const router = express.Router();

// ===========================
// ADMIN ROLE ROUTES
// ===========================

// Require SUPER_ADMIN for all role management routes
const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * GET /api/admin/roles
 * List all admin roles
 */
router.get('/', authenticateToken, requireRole('admin'), listAdminRoles);

/**
 * GET /api/admin/roles/:id
 * Get specific role by ID
 */
router.get('/:id', authenticateToken, requireRole('admin'), getAdminRole);

/**
 * POST /api/admin/roles
 * Create new admin role (SUPER_ADMIN only)
 */
router.post('/', authenticateToken, requireSuperAdmin, createAdminRole);

/**
 * PUT /api/admin/roles/:id
 * Update admin role (SUPER_ADMIN only)
 */
router.put('/:id', authenticateToken, requireSuperAdmin, updateAdminRole);

/**
 * DELETE /api/admin/roles/:id
 * Delete admin role (SUPER_ADMIN only)
 */
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteAdminRole);

/**
 * POST /api/admin/roles/:roleId/permissions
 * Add permission to role (SUPER_ADMIN only)
 */
router.post('/:roleId/permissions', authenticateToken, requireSuperAdmin, addPermissionToRole);

/**
 * DELETE /api/admin/roles/:roleId/permissions/:permissionCode
 * Remove permission from role (SUPER_ADMIN only)
 */
router.delete('/:roleId/permissions/:permissionCode', authenticateToken, requireSuperAdmin, removePermissionFromRole);

/**
 * GET /api/admin/permissions
 * List all available permissions
 */
router.get('/list/permissions', authenticateToken, requireRole('admin'), listAllPermissions);

export default router;
