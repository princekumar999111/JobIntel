"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPermissions = seedPermissions;
exports.seedRoles = seedRoles;
exports.seedAdminSystem = seedAdminSystem;
const AdminRole_1 = require("../models/AdminRole");
const AdminPermission_1 = require("../models/AdminPermission");
/**
 * Seed default admin permissions
 */
async function seedPermissions() {
    const permissionsData = [
        // ========================
        // JOBS MANAGEMENT
        // ========================
        {
            code: 'jobs.view',
            name: 'View Jobs',
            description: 'View all job listings',
            resource: 'jobs',
            action: 'view',
            category: 'job_management',
        },
        {
            code: 'jobs.create',
            name: 'Create Jobs',
            description: 'Create new job postings',
            resource: 'jobs',
            action: 'create',
            category: 'job_management',
        },
        {
            code: 'jobs.edit',
            name: 'Edit Jobs',
            description: 'Edit existing job postings',
            resource: 'jobs',
            action: 'edit',
            category: 'job_management',
        },
        {
            code: 'jobs.delete',
            name: 'Delete Jobs',
            description: 'Delete job postings',
            resource: 'jobs',
            action: 'delete',
            category: 'job_management',
        },
        {
            code: 'jobs.approve',
            name: 'Approve Jobs',
            description: 'Approve pending job listings',
            resource: 'jobs',
            action: 'approve',
            category: 'job_management',
        },
        {
            code: 'jobs.publish',
            name: 'Publish Jobs',
            description: 'Publish approved jobs',
            resource: 'jobs',
            action: 'publish',
            category: 'job_management',
        },
        // ========================
        // USER MANAGEMENT
        // ========================
        {
            code: 'users.view',
            name: 'View Users',
            description: 'View all user accounts',
            resource: 'users',
            action: 'view',
            category: 'user_management',
        },
        {
            code: 'users.edit',
            name: 'Edit Users',
            description: 'Edit user profiles and information',
            resource: 'users',
            action: 'edit',
            category: 'user_management',
        },
        {
            code: 'users.delete',
            name: 'Delete Users',
            description: 'Delete user accounts (GDPR)',
            resource: 'users',
            action: 'delete',
            category: 'user_management',
        },
        {
            code: 'users.change_tier',
            name: 'Change User Tier',
            description: 'Change user subscription tier (free/premium)',
            resource: 'users',
            action: 'edit',
            category: 'user_management',
        },
        {
            code: 'users.export',
            name: 'Export Users',
            description: 'Export user data to CSV/JSON',
            resource: 'users',
            action: 'view',
            category: 'user_management',
        },
        // ========================
        // ADMIN MANAGEMENT
        // ========================
        {
            code: 'admins.view',
            name: 'View Admin Users',
            description: 'View all admin accounts',
            resource: 'admins',
            action: 'view',
            category: 'admin_management',
        },
        {
            code: 'admins.create',
            name: 'Create Admin',
            description: 'Create new admin user accounts',
            resource: 'admins',
            action: 'create',
            category: 'admin_management',
        },
        {
            code: 'admins.edit',
            name: 'Edit Admin',
            description: 'Edit admin accounts',
            resource: 'admins',
            action: 'edit',
            category: 'admin_management',
        },
        {
            code: 'admins.delete',
            name: 'Delete Admin',
            description: 'Delete admin accounts',
            resource: 'admins',
            action: 'delete',
            category: 'admin_management',
        },
        {
            code: 'admins.assign_role',
            name: 'Assign Admin Role',
            description: 'Assign or change admin roles',
            resource: 'admins',
            action: 'edit',
            category: 'admin_management',
        },
        // ========================
        // ROLE MANAGEMENT
        // ========================
        {
            code: 'roles.view',
            name: 'View Roles',
            description: 'View admin role definitions',
            resource: 'roles',
            action: 'view',
            category: 'role_management',
        },
        {
            code: 'roles.create',
            name: 'Create Role',
            description: 'Create new admin roles',
            resource: 'roles',
            action: 'create',
            category: 'role_management',
        },
        {
            code: 'roles.edit',
            name: 'Edit Role',
            description: 'Edit admin role definitions',
            resource: 'roles',
            action: 'edit',
            category: 'role_management',
        },
        {
            code: 'roles.delete',
            name: 'Delete Role',
            description: 'Delete admin roles',
            resource: 'roles',
            action: 'delete',
            category: 'role_management',
        },
        // ========================
        // SCRAPER MANAGEMENT
        // ========================
        {
            code: 'scraper.view',
            name: 'View Scraper',
            description: 'View scraper configuration and status',
            resource: 'scraper',
            action: 'view',
            category: 'scraper_management',
        },
        {
            code: 'scraper.configure',
            name: 'Configure Scraper',
            description: 'Configure scraper settings and parameters',
            resource: 'scraper',
            action: 'edit',
            category: 'scraper_management',
        },
        {
            code: 'scraper.run',
            name: 'Run Scraper',
            description: 'Start/run scraping jobs',
            resource: 'scraper',
            action: 'execute',
            category: 'scraper_management',
        },
        {
            code: 'scraper.stop',
            name: 'Stop Scraper',
            description: 'Stop running scraper jobs',
            resource: 'scraper',
            action: 'execute',
            category: 'scraper_management',
        },
        {
            code: 'scraper.view_costs',
            name: 'View Scraper Costs',
            description: 'View scraper API usage and costs',
            resource: 'scraper',
            action: 'view',
            category: 'scraper_management',
        },
        // ========================
        // COMPANY MANAGEMENT
        // ========================
        {
            code: 'company.view',
            name: 'View Companies',
            description: 'View company database',
            resource: 'company',
            action: 'view',
            category: 'company_management',
        },
        {
            code: 'company.create',
            name: 'Create Company',
            description: 'Add new companies to database',
            resource: 'company',
            action: 'create',
            category: 'company_management',
        },
        {
            code: 'company.edit',
            name: 'Edit Company',
            description: 'Edit company information',
            resource: 'company',
            action: 'edit',
            category: 'company_management',
        },
        {
            code: 'company.delete',
            name: 'Delete Company',
            description: 'Delete companies from database',
            resource: 'company',
            action: 'delete',
            category: 'company_management',
        },
        {
            code: 'company.import',
            name: 'Import Companies',
            description: 'Bulk import companies from CSV',
            resource: 'company',
            action: 'create',
            category: 'company_management',
        },
        // ========================
        // JOB MATCHING
        // ========================
        {
            code: 'matching.view',
            name: 'View Matching Config',
            description: 'View job matching algorithm configuration',
            resource: 'matching',
            action: 'view',
            category: 'matching_management',
        },
        {
            code: 'matching.configure',
            name: 'Configure Matching',
            description: 'Adjust algorithm weights and thresholds',
            resource: 'matching',
            action: 'edit',
            category: 'matching_management',
        },
        {
            code: 'matching.rebuild',
            name: 'Rebuild Matching',
            description: 'Rebuild job matches for all users',
            resource: 'matching',
            action: 'execute',
            category: 'matching_management',
        },
        {
            code: 'matching.test',
            name: 'Test Matching Algorithm',
            description: 'Test matching algorithm with sample data',
            resource: 'matching',
            action: 'execute',
            category: 'matching_management',
        },
        // ========================
        // NOTIFICATIONS
        // ========================
        {
            code: 'notification.view',
            name: 'View Notifications',
            description: 'View notification templates and logs',
            resource: 'notification',
            action: 'view',
            category: 'notification_management',
        },
        {
            code: 'notification.send',
            name: 'Send Notifications',
            description: 'Send notifications to users',
            resource: 'notification',
            action: 'execute',
            category: 'notification_management',
        },
        {
            code: 'notification.schedule',
            name: 'Schedule Notifications',
            description: 'Schedule notifications for later delivery',
            resource: 'notification',
            action: 'create',
            category: 'notification_management',
        },
        // ========================
        // ANALYTICS
        // ========================
        {
            code: 'analytics.view',
            name: 'View Analytics',
            description: 'View system analytics and metrics',
            resource: 'analytics',
            action: 'view',
            category: 'analytics_management',
        },
        {
            code: 'analytics.export',
            name: 'Export Analytics',
            description: 'Export analytics data to CSV/JSON',
            resource: 'analytics',
            action: 'view',
            category: 'analytics_management',
        },
        // ========================
        // AUDIT LOGS
        // ========================
        {
            code: 'audit.view',
            name: 'View Audit Logs',
            description: 'View admin activity audit logs',
            resource: 'audit',
            action: 'view',
            category: 'audit_management',
        },
        {
            code: 'audit.export',
            name: 'Export Audit Logs',
            description: 'Export audit logs to CSV/JSON',
            resource: 'audit',
            action: 'view',
            category: 'audit_management',
        },
        {
            code: 'audit.delete',
            name: 'Delete Audit Logs',
            description: 'Delete audit log entries',
            resource: 'audit',
            action: 'delete',
            category: 'audit_management',
        },
        // ========================
        // SETTINGS
        // ========================
        {
            code: 'settings.view',
            name: 'View Settings',
            description: 'View system settings',
            resource: 'settings',
            action: 'view',
            category: 'settings_management',
        },
        {
            code: 'settings.edit',
            name: 'Edit Settings',
            description: 'Edit system settings',
            resource: 'settings',
            action: 'edit',
            category: 'settings_management',
        },
    ];
    try {
        // Clear existing permissions
        await AdminPermission_1.AdminPermission.deleteMany({});
        // Insert new permissions
        const created = await AdminPermission_1.AdminPermission.insertMany(permissionsData);
        console.log(`✅ Seeded ${created.length} permissions`);
        return created;
    }
    catch (err) {
        console.error('❌ Error seeding permissions:', err);
        throw err;
    }
}
/**
 * Seed default admin roles
 */
async function seedRoles() {
    const rolesData = [
        {
            name: 'SUPER_ADMIN',
            description: 'System Super Administrator with full access',
            tier: 0,
            isDefault: true,
            permissions: [
                // All permissions
                'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.approve', 'jobs.publish',
                'users.view', 'users.edit', 'users.delete', 'users.change_tier', 'users.export',
                'admins.view', 'admins.create', 'admins.edit', 'admins.delete', 'admins.assign_role',
                'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
                'scraper.view', 'scraper.configure', 'scraper.run', 'scraper.stop', 'scraper.view_costs',
                'company.view', 'company.create', 'company.edit', 'company.delete', 'company.import',
                'matching.view', 'matching.configure', 'matching.rebuild', 'matching.test',
                'notification.view', 'notification.send', 'notification.schedule',
                'analytics.view', 'analytics.export',
                'audit.view', 'audit.export', 'audit.delete',
                'settings.view', 'settings.edit',
            ],
            canManageRoles: true,
            canManageAdmins: true,
            canEditSettings: true,
            canViewAudit: true,
            canDeleteAudit: true,
        },
        {
            name: 'ADMIN',
            description: 'General System Administrator',
            tier: 1,
            isDefault: true,
            permissions: [
                'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.approve', 'jobs.publish',
                'users.view', 'users.edit', 'users.delete', 'users.change_tier', 'users.export',
                'roles.view',
                'scraper.view',
                'company.view',
                'matching.view',
                'notification.view', 'notification.send', 'notification.schedule',
                'analytics.view', 'analytics.export',
                'audit.view', 'audit.export',
                'settings.view',
            ],
            canManageRoles: false,
            canManageAdmins: false,
            canEditSettings: false,
            canViewAudit: true,
            canDeleteAudit: false,
        },
        {
            name: 'SCRAPER_ADMIN',
            description: 'Data Operations - Manages scraping and job data',
            tier: 2,
            isDefault: true,
            permissions: [
                'jobs.view', 'jobs.edit',
                'scraper.view', 'scraper.configure', 'scraper.run', 'scraper.stop', 'scraper.view_costs',
                'company.view', 'company.create', 'company.edit', 'company.delete', 'company.import',
                'matching.view', 'matching.configure', 'matching.rebuild', 'matching.test',
                'analytics.view',
                'audit.view',
            ],
            canManageRoles: false,
            canManageAdmins: false,
            canEditSettings: false,
            canViewAudit: true,
            canDeleteAudit: false,
        },
        {
            name: 'BUSINESS_ADMIN',
            description: 'Business Operations - Analytics and reporting',
            tier: 2,
            isDefault: true,
            permissions: [
                'users.view', 'users.export',
                'company.view',
                'analytics.view', 'analytics.export',
                'audit.view',
            ],
            canManageRoles: false,
            canManageAdmins: false,
            canEditSettings: false,
            canViewAudit: true,
            canDeleteAudit: false,
        },
        {
            name: 'ANALYST',
            description: 'Data Analyst - Read-only analytics access',
            tier: 3,
            isDefault: true,
            permissions: [
                'analytics.view', 'analytics.export',
                'matching.view',
            ],
            canManageRoles: false,
            canManageAdmins: false,
            canEditSettings: false,
            canViewAudit: false,
            canDeleteAudit: false,
        },
    ];
    try {
        // Clear existing roles
        await AdminRole_1.AdminRole.deleteMany({});
        // Insert new roles
        const created = await AdminRole_1.AdminRole.insertMany(rolesData);
        console.log(`✅ Seeded ${created.length} admin roles`);
        return created;
    }
    catch (err) {
        console.error('❌ Error seeding roles:', err);
        throw err;
    }
}
/**
 * Run all seed functions
 */
async function seedAdminSystem() {
    console.log('\n🌱 Seeding Admin System...\n');
    try {
        await seedPermissions();
        await seedRoles();
        console.log('\n✅ Admin system seeding complete!\n');
    }
    catch (err) {
        console.error('\n❌ Admin system seeding failed:\n', err);
        throw err;
    }
}
