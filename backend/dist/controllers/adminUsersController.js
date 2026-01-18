"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersWithRoles = listUsersWithRoles;
exports.getUserDetails = getUserDetails;
exports.assignAdminRole = assignAdminRole;
exports.removeAdminRole = removeAdminRole;
exports.listAdminUsers = listAdminUsers;
exports.updateUserAdminRole = updateUserAdminRole;
exports.getUserActivityStats = getUserActivityStats;
const User_1 = require("../models/User");
const AdminRole_1 = require("../models/AdminRole");
const AdminActivityLog_1 = require("../models/AdminActivityLog");
// ========================
// ADMIN USERS CONTROLLERS
// ========================
/**
 * List all users with their admin role information
 */
async function listUsersWithRoles(req, res) {
    try {
        const { page = 1, limit = 20, role, search } = req.query;
        const skip = ((Number(page) || 1) - 1) * (Number(limit) || 20);
        const filter = {};
        if (role) {
            filter.adminRole = role;
        }
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ];
        }
        const [users, total] = await Promise.all([
            User_1.User.find(filter)
                .populate('adminRole', 'name tier description')
                .select('email name roles adminRole createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit) || 20),
            User_1.User.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / (Number(limit) || 20)),
            },
        });
    }
    catch (err) {
        console.error('Error listing users:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
        });
    }
}
/**
 * Get a specific user with full details
 */
async function getUserDetails(req, res) {
    try {
        const { id } = req.params;
        const user = await User_1.User.findById(id).populate('adminRole');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
        });
    }
}
/**
 * Assign an admin role to a user
 */
async function assignAdminRole(req, res) {
    try {
        const { userId, roleId } = req.body;
        if (!userId || !roleId) {
            return res.status(400).json({
                success: false,
                error: 'userId and roleId are required',
            });
        }
        // Get user and role
        const [user, role] = await Promise.all([
            User_1.User.findById(userId),
            AdminRole_1.AdminRole.findById(roleId),
        ]);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found',
            });
        }
        // Check if assigner has permission to assign this role
        const requesterRole = req.adminRole;
        if (requesterRole && requesterRole.tier !== 0) {
            if (role.tier <= requesterRole.tier) {
                return res.status(403).json({
                    success: false,
                    error: 'Cannot assign a role with equal or higher tier',
                });
            }
        }
        const oldAdminRole = user.adminRole;
        user.adminRole = roleId;
        if (!user.roles.includes('admin')) {
            user.roles.push('admin');
        }
        await user.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'ASSIGN_ADMIN_ROLE',
            resource: 'User',
            resourceId: userId,
            changes: {
                before: { adminRole: oldAdminRole },
                after: { adminRole: roleId },
            },
            severity: 'HIGH',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.json({
            success: true,
            message: `Admin role '${role.name}' assigned to user`,
            data: await User_1.User.findById(userId).populate('adminRole'),
        });
    }
    catch (err) {
        console.error('Error assigning admin role:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to assign admin role',
        });
    }
}
/**
 * Remove admin role from a user
 */
async function removeAdminRole(req, res) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required',
            });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const oldAdminRole = user.adminRole;
        user.adminRole = undefined;
        user.roles = user.roles.filter((r) => r !== 'admin');
        await user.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'REMOVE_ADMIN_ROLE',
            resource: 'User',
            resourceId: userId,
            changes: {
                before: { adminRole: oldAdminRole },
                after: { adminRole: null },
            },
            severity: 'HIGH',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.json({
            success: true,
            message: 'Admin role removed from user',
            data: user,
        });
    }
    catch (err) {
        console.error('Error removing admin role:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to remove admin role',
        });
    }
}
/**
 * Get all admin users (users with admin roles)
 */
async function listAdminUsers(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = ((Number(page) || 1) - 1) * (Number(limit) || 20);
        const [admins, total] = await Promise.all([
            User_1.User.find({ adminRole: { $ne: null } })
                .populate('adminRole', 'name tier description')
                .select('email name adminRole roles createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit) || 20),
            User_1.User.countDocuments({ adminRole: { $ne: null } }),
        ]);
        res.json({
            success: true,
            data: admins,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / (Number(limit) || 20)),
            },
        });
    }
    catch (err) {
        console.error('Error listing admin users:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch admin users',
        });
    }
}
/**
 * Update user admin status/role
 */
async function updateUserAdminRole(req, res) {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required',
            });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        if (roleId) {
            const role = await AdminRole_1.AdminRole.findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    error: 'Role not found',
                });
            }
        }
        const oldAdminRole = user.adminRole;
        user.adminRole = roleId ? roleId : undefined;
        if (roleId && !user.roles.includes('admin')) {
            user.roles.push('admin');
        }
        else if (!roleId) {
            user.roles = user.roles.filter((r) => r !== 'admin');
        }
        await user.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'UPDATE_ADMIN_ROLE',
            resource: 'User',
            resourceId: userId,
            changes: {
                before: { adminRole: oldAdminRole },
                after: { adminRole: roleId || null },
            },
            severity: 'HIGH',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.json({
            success: true,
            message: 'User admin role updated',
            data: await User_1.User.findById(userId).populate('adminRole'),
        });
    }
    catch (err) {
        console.error('Error updating user admin role:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update user admin role',
        });
    }
}
/**
 * Get admin activity statistics for a user
 */
async function getUserActivityStats(req, res) {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        const activities = await AdminActivityLog_1.AdminActivityLog.find({
            adminId: userId,
            createdAt: { $gte: startDate },
        }).sort({ createdAt: -1 });
        const actionCounts = activities.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
                totalActions: activities.length,
                actions: actionCounts,
                recentActivities: activities.slice(0, 10),
                period: `Last ${days} days`,
            },
        });
    }
    catch (err) {
        console.error('Error fetching user activity stats:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user activity statistics',
        });
    }
}
