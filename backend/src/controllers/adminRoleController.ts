import { Request, Response } from 'express';
import { AdminRole } from '../models/AdminRole';
import { AdminPermission } from '../models/AdminPermission';
import { AdminActivityLog } from '../models/AdminActivityLog';
import { User } from '../models/User';

// ========================
// ADMIN ROLE CONTROLLERS
// ========================

/**
 * Get all admin roles with their permissions
 */
export async function listAdminRoles(req: Request, res: Response) {
  try {
    const roles = await AdminRole.find()
      .select('-__v')
      .sort({ tier: 1, name: 1 });

    res.json({
      success: true,
      data: roles,
      total: roles.length,
    });
  } catch (err) {
    console.error('Error listing admin roles:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admin roles' 
    });
  }
}

/**
 * Get a specific admin role by ID
 */
export async function getAdminRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const role = await AdminRole.findById(id);

    if (!role) {
      return res.status(404).json({ 
        success: false, 
        error: 'Role not found' 
      });
    }

    // Fetch permission details
    const permissions = await AdminPermission.find({
      code: { $in: role.permissions }
    });

    res.json({
      success: true,
      data: {
        ...role.toObject(),
        permissionDetails: permissions,
      },
    });
  } catch (err) {
    console.error('Error fetching admin role:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admin role' 
    });
  }
}

/**
 * Create a new admin role
 */
export async function createAdminRole(req: Request, res: Response) {
  try {
    const { 
      name, 
      description, 
      tier, 
      permissions,
      canManageRoles,
      canManageAdmins,
      canEditSettings,
      canViewAudit,
      canDeleteAudit,
    } = req.body;

    // Validate tier
    if (![0, 1, 2, 3].includes(tier)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tier. Must be 0, 1, 2, or 3' 
      });
    }

    // Check if role name already exists
    const existing = await AdminRole.findOne({ name });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: `Role '${name}' already exists` 
      });
    }

    // Validate permissions exist
    if (permissions && permissions.length > 0) {
      const validPermissions = await AdminPermission.find({
        code: { $in: permissions }
      });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'One or more permissions do not exist' 
        });
      }
    }

    const newRole = await AdminRole.create({
      name,
      description,
      tier,
      permissions: permissions || [],
      canManageRoles: canManageRoles || false,
      canManageAdmins: canManageAdmins || false,
      canEditSettings: canEditSettings || false,
      canViewAudit: canViewAudit || false,
      canDeleteAudit: canDeleteAudit || false,
      createdBy: (req as any).user?.id,
    });

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'role_created',
      resource: 'role',
      resourceId: newRole._id,
      resourceName: name,
      changes: { after: newRole.toObject() },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      method: 'POST',
      endpoint: '/api/admin/roles',
      status: 'success',
      severity: 'high',
    });

    res.status(201).json({
      success: true,
      data: newRole,
      message: `Role '${name}' created successfully`,
    });
  } catch (err) {
    console.error('Error creating admin role:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create admin role' 
    });
  }
}

/**
 * Update an admin role
 */
export async function updateAdminRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const role = await AdminRole.findById(id);
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        error: 'Role not found' 
      });
    }

    // Cannot update default roles tier
    if (role.isDefault && updates.tier !== undefined && updates.tier !== role.tier) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot change tier of default roles' 
      });
    }

    // Validate permissions if updating
    if (updates.permissions && updates.permissions.length > 0) {
      const validPermissions = await AdminPermission.find({
        code: { $in: updates.permissions }
      });
      if (validPermissions.length !== updates.permissions.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'One or more permissions do not exist' 
        });
      }
    }

    const oldData = role.toObject();
    const updatedRole = await AdminRole.findByIdAndUpdate(
      id,
      { ...updates, lastUpdatedBy: (req as any).user?.id },
      { new: true }
    );

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'role_updated',
      resource: 'role',
      resourceId: id,
      resourceName: role.name,
      changes: { before: oldData, after: updatedRole?.toObject() },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      method: 'PUT',
      endpoint: `/api/admin/roles/${id}`,
      status: 'success',
      severity: 'high',
    });

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully',
    });
  } catch (err) {
    console.error('Error updating admin role:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update admin role' 
    });
  }
}

/**
 * Delete an admin role
 */
export async function deleteAdminRole(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const role = await AdminRole.findById(id);
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        error: 'Role not found' 
      });
    }

    // Cannot delete default roles
    if (role.isDefault) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete default admin roles' 
      });
    }

    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ adminRole: id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete role. ${usersWithRole} user(s) have this role assigned.` 
      });
    }

    const deletedRole = await AdminRole.findByIdAndDelete(id);

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'role_deleted',
      resource: 'role',
      resourceId: id,
      resourceName: deletedRole?.name || 'Unknown',
      changes: { before: deletedRole?.toObject() },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      method: 'DELETE',
      endpoint: `/api/admin/roles/${id}`,
      status: 'success',
      severity: 'critical',
    });

    res.json({
      success: true,
      message: `Role '${role.name}' deleted successfully`,
    });
  } catch (err) {
    console.error('Error deleting admin role:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete admin role' 
    });
  }
}

/**
 * Add a permission to a role
 */
export async function addPermissionToRole(req: Request, res: Response) {
  try {
    const { roleId } = req.params;
    const { permissionCode } = req.body;

    const role = await AdminRole.findById(roleId);
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        error: 'Role not found' 
      });
    }

    // Check if permission exists
    const permission = await AdminPermission.findOne({ code: permissionCode });
    if (!permission) {
      return res.status(404).json({ 
        success: false, 
        error: 'Permission not found' 
      });
    }

    // Check if already added
    if (role.permissions.includes(permissionCode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Permission already assigned to this role' 
      });
    }

    role.permissions.push(permissionCode);
    await role.save();

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'permission_added',
      resource: 'role',
      resourceId: roleId,
      resourceName: role.name,
      changes: { after: { permission: permissionCode } },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      method: 'POST',
      endpoint: `/api/admin/roles/${roleId}/permissions`,
      status: 'success',
      severity: 'medium',
    });

    res.json({
      success: true,
      data: role,
      message: `Permission '${permissionCode}' added to role '${role.name}'`,
    });
  } catch (err) {
    console.error('Error adding permission to role:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add permission' 
    });
  }
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(req: Request, res: Response) {
  try {
    const { roleId, permissionCode } = req.params;

    const role = await AdminRole.findById(roleId);
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        error: 'Role not found' 
      });
    }

    const index = role.permissions.indexOf(permissionCode);
    if (index === -1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Permission not assigned to this role' 
      });
    }

    role.permissions.splice(index, 1);
    await role.save();

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'permission_removed',
      resource: 'role',
      resourceId: roleId,
      resourceName: role.name,
      changes: { before: { permission: permissionCode } },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      method: 'DELETE',
      endpoint: `/api/admin/roles/${roleId}/permissions/${permissionCode}`,
      status: 'success',
      severity: 'medium',
    });

    res.json({
      success: true,
      data: role,
      message: `Permission '${permissionCode}' removed from role '${role.name}'`,
    });
  } catch (err) {
    console.error('Error removing permission:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove permission' 
    });
  }
}

/**
 * Get all available permissions
 */
export async function listAllPermissions(req: Request, res: Response) {
  try {
    const permissions = await AdminPermission.find()
      .sort({ category: 1, resource: 1, action: 1 });

    // Group by category for easier consumption
    const grouped: Record<string, typeof permissions> = {};
    permissions.forEach(perm => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });

    res.json({
      success: true,
      data: permissions,
      grouped,
      total: permissions.length,
    });
  } catch (err) {
    console.error('Error listing permissions:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch permissions' 
    });
  }
}
