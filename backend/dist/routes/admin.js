"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const adminController_1 = require("../controllers/adminController");
const notificationController_1 = require("../controllers/notificationController");
const adminSettingsController_1 = require("../controllers/adminSettingsController");
const adminUsersController_1 = require("../controllers/adminUsersController");
const router = express_1.default.Router();
// Stats endpoints
router.get('/stats', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.getAdminStats);
router.get('/analytics/jobs', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.getJobAnalytics);
router.get('/analytics/users', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.getUserAnalytics);
router.get('/users/stats', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.getUserStats);
router.get('/analytics/revenue', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.getRevenueAnalytics);
router.get('/notifications', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.getNotifications);
// Send a test SMTP email (admin only)
router.post('/notifications/test-email', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), notificationController_1.testEmail);
// Verify SMTP connection/auth (admin only)
router.post('/notifications/verify-smtp', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), notificationController_1.verifySmtp);
// Existing endpoints
router.get('/jobs/pending', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.listPendingJobs);
router.post('/jobs/:id/approve', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.approveJob);
router.get('/reports/revenue', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.revenueReport);
router.get('/audit', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.auditLogs);
router.delete('/gdpr/delete-user/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.gdprDeleteUser);
router.post('/scrape/run', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminController_1.runCrawlers);
// Admin-managed skills
router.get('/skills', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.listAdminSkills);
router.post('/skills', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.createAdminSkill);
router.delete('/skills/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.deleteAdminSkill);
// Admin-managed profile fields
router.get('/profile-fields', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.listProfileFields);
router.post('/profile-fields', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.createProfileField);
router.put('/profile-fields/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.updateProfileField);
router.delete('/profile-fields/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminSettingsController_1.deleteProfileField);
// User management endpoints
router.get('/users-list', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.listUsersWithRoles);
router.get('/users/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.getUserDetails);
router.post('/users/assign-role', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.assignAdminRole);
router.post('/users/remove-role', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.removeAdminRole);
router.get('/admin-users', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.listAdminUsers);
router.put('/users/:userId/admin-role', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.updateUserAdminRole);
router.get('/users/:userId/activity-stats', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminUsersController_1.getUserActivityStats);
exports.default = router;
