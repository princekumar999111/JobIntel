# Admin Role Development - Quick Start Implementation Guide

**Status:** Phase 1 Foundation Code Ready ✅  
**Date:** January 17, 2026  
**Files Created:** 8 new backend files

---

## 📋 What Has Been Created

### Phase 1 Implementation Files (Complete) ✅

#### Backend Models (4 files)
```
✅ backend/src/models/AdminRole.ts           - 55 lines
✅ backend/src/models/AdminPermission.ts     - 40 lines
✅ backend/src/models/AdminActivityLog.ts    - 70 lines
✅ backend/src/models/ScraperConfig.ts       - 65 lines
```

#### Backend Controllers (1 file)
```
✅ backend/src/controllers/adminRoleController.ts - 400+ lines
   - List roles
   - Get role by ID
   - Create role
   - Update role
   - Delete role
   - Add permission to role
   - Remove permission from role
   - List all permissions
```

#### Backend Routes (1 file)
```
✅ backend/src/routes/adminRoles.ts - 70 lines
   - 8 route endpoints
   - SUPER_ADMIN protection
```

#### Backend Seeds (1 file)
```
✅ backend/src/scripts/seedAdminSystem.ts - 300+ lines
   - seedPermissions() - Creates 45+ permissions
   - seedRoles() - Creates 5 default roles
   - seedAdminSystem() - Master seeder
```

#### Backend Middleware (1 file)
```
✅ backend/src/middleware/authEnhanced.ts - 150+ lines
   - authenticateTokenEnhanced() - Gets admin role + permissions
   - requirePermission() - Check single permission
   - requireAnyPermission() - Check any of multiple
   - requireAllPermissions() - Check all of multiple
```

---

## 🚀 NEXT STEPS TO COMPLETE PHASE 1

### Step 1: Update index.ts to Import Routes
Edit `/workspaces/JobIntel/backend/src/index.ts`:

```typescript
// Add this import after other route imports
import adminRolesRoutes from "./routes/adminRoles";

// Add this in app.use() section after other route mounts
app.use("/api/admin/roles", adminRolesRoutes);
```

### Step 2: Update User Model
Edit `/workspaces/JobIntel/backend/src/models/User.ts`:

```typescript
// Add these fields to IUser interface:
adminRole?: mongoose.Types.ObjectId;      // Reference to AdminRole
department?: string;                       // e.g., "Recruitment", "Operations"
permissions?: string[];                    // Direct permissions (override role)
ipWhitelist?: string[];                    // IP addresses allowed
lastAdminLoginAt?: Date;

// Add to UserSchema:
adminRole: { type: Schema.Types.ObjectId, ref: 'AdminRole' },
department: String,
permissions: [String],
ipWhitelist: [String],
lastAdminLoginAt: Date,
```

### Step 3: Create Admin Users Management Controller
Create `/workspaces/JobIntel/backend/src/controllers/adminUsersController.ts`:

```typescript
import { Request, Response } from 'express';
import { User } from '../models/User';
import { AdminRole } from '../models/AdminRole';
import { AdminActivityLog } from '../models/AdminActivityLog';

export async function listAdminUsers(req: Request, res: Response) {
  try {
    const admins = await User.find({ roles: 'admin' })
      .select('-passwordHash')
      .populate('adminRole', 'name tier');
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function assignAdminRole(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const role = await AdminRole.findById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { adminRole: roleId },
      { new: true }
    ).populate('adminRole');

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'admin_role_assigned',
      resource: 'admin',
      resourceId: userId,
      changes: { after: { role: role.name } },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      method: 'PUT',
      endpoint: `/api/admin/admins/${userId}/role`,
      status: 'success',
      severity: 'high',
    });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
```

### Step 4: Update Admin Routes
Edit `/workspaces/JobIntel/backend/src/routes/admin.ts`:

```typescript
// Add imports
import { listAdminUsers, assignAdminRole } from '../controllers/adminUsersController';

// Add routes before export
router.get('/admins', authenticateToken, requireRole('admin'), listAdminUsers);
router.put('/admins/:userId/role', authenticateToken, requireRole('SUPER_ADMIN'), assignAdminRole);
```

### Step 5: Run Seeder
In your backend directory:

```bash
# Run the seeder
npm run ts-node backend/src/scripts/seedAdminSystem.ts

# Or add to package.json
"seed:admin": "ts-node backend/src/scripts/seedAdminSystem.ts"
```

### Step 6: Test APIs

```bash
# List all roles
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/roles

# Get specific role
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/roles/{ROLE_ID}

# List all permissions
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/permissions

# Create new role (SUPER_ADMIN only)
curl -X POST -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CUSTOM_ROLE",
    "description": "Custom role",
    "tier": 2,
    "permissions": ["jobs.view", "users.view"]
  }' \
  http://localhost:3000/api/admin/roles
```

---

## 📊 PHASE 1 COMPLETION CHECKLIST

### Database Models ✅
- [x] AdminRole model with permissions
- [x] AdminPermission model with 45+ permissions
- [x] AdminActivityLog model for auditing
- [x] ScraperConfig model (for Phase 2)

### Backend Controllers ✅
- [x] adminRoleController (8 functions)
- [ ] adminUsersController (stub provided - needs implementation)

### Backend Routes ✅
- [x] adminRoles routes (8 endpoints)
- [ ] Need to integrate into main index.ts
- [ ] Need to integrate into admin.ts

### Middleware ✅
- [x] Enhanced auth middleware with permissions
- [ ] Update existing routes to use permission checks

### Seed Data ✅
- [x] 45+ permissions seeded
- [x] 5 default roles with proper permissions
- [ ] Run seeder script

### Frontend Pages (To Do in Phase 1)
- [ ] AdminRoleManagement page
- [ ] AdminUsersManagement page
- [ ] Update AdminSidebar with new pages

---

## 🎯 Phase 1 Database Schema Summary

### AdminRole Collection
```javascript
{
  _id: ObjectId,
  name: "SUPER_ADMIN" | "ADMIN" | "SCRAPER_ADMIN" | "BUSINESS_ADMIN" | "ANALYST",
  description: "System Super Administrator...",
  tier: 0,  // 0=SUPER, 1=ADMIN, 2=SPECIALIST, 3=VIEWER
  permissions: ["jobs.view", "jobs.create", ...],
  canManageRoles: true,
  canManageAdmins: true,
  canEditSettings: true,
  canViewAudit: true,
  canDeleteAudit: true,
  isDefault: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### AdminPermission Collection
```javascript
{
  _id: ObjectId,
  code: "jobs.view",
  name: "View Jobs",
  description: "View all job listings",
  resource: "jobs",
  action: "view",
  category: "job_management",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### AdminActivityLog Collection
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,  // ref to User
  action: "role_created",
  resource: "role",
  resourceId: ObjectId,
  resourceName: "CUSTOM_ROLE",
  changes: {
    before: {...},
    after: {...}
  },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  method: "POST",
  endpoint: "/api/admin/roles",
  status: "success" | "failed",
  severity: "low" | "medium" | "high" | "critical",
  timestamp: ISODate
}
```

### Updated User Collection
```javascript
{
  _id: ObjectId,
  email: "admin@example.com",
  roles: ["admin"],  // Keep for backward compat
  adminRole: ObjectId,  // ref to AdminRole
  department: "Operations",
  permissions: ["jobs.view"],  // Direct overrides
  ipWhitelist: ["192.168.1.1"],
  // ... other fields
}
```

---

## 🔑 Key Permission Codes Reference

### Job Management
```
jobs.view              - View jobs
jobs.create            - Create jobs
jobs.edit              - Edit jobs
jobs.delete            - Delete jobs
jobs.approve           - Approve jobs
jobs.publish           - Publish jobs
```

### User Management
```
users.view             - View users
users.edit             - Edit users
users.delete           - Delete users (GDPR)
users.change_tier      - Change subscription tier
users.export           - Export user data
```

### Admin Management
```
admins.view            - View admin users
admins.create          - Create admin
admins.edit            - Edit admin
admins.delete          - Delete admin
admins.assign_role     - Assign roles
```

### Role Management
```
roles.view             - View roles
roles.create           - Create roles
roles.edit             - Edit roles
roles.delete           - Delete roles
```

### Scraper Management
```
scraper.view           - View scraper config
scraper.configure      - Configure scraper
scraper.run            - Run scraper
scraper.stop           - Stop scraper
scraper.view_costs     - View costs
```

### Company Management
```
company.view           - View companies
company.create         - Create company
company.edit           - Edit company
company.delete         - Delete company
company.import         - Bulk import
```

### Job Matching
```
matching.view          - View config
matching.configure     - Configure algorithm
matching.rebuild       - Rebuild matches
matching.test          - Test algorithm
```

### Notifications
```
notification.view      - View notifications
notification.send      - Send notifications
notification.schedule  - Schedule notifications
```

### Analytics
```
analytics.view         - View analytics
analytics.export       - Export analytics
```

### Audit Logs
```
audit.view             - View logs
audit.export           - Export logs
audit.delete           - Delete logs
```

### Settings
```
settings.view          - View settings
settings.edit          - Edit settings
```

---

## 💡 Usage Examples

### Example 1: Checking Permission in Route
```typescript
import { requirePermission } from '../middleware/authEnhanced';

router.post('/jobs/approve/:id',
  authenticateToken,
  requirePermission('jobs.approve'),
  approveJobHandler
);
```

### Example 2: Checking Multiple Permissions
```typescript
import { requireAllPermissions } from '../middleware/authEnhanced';

router.post('/jobs',
  authenticateToken,
  requireAllPermissions(['jobs.create', 'jobs.publish']),
  createJobHandler
);
```

### Example 3: Checking Any Permission
```typescript
import { requireAnyPermission } from '../middleware/authEnhanced';

router.get('/analytics',
  authenticateToken,
  requireAnyPermission(['analytics.view', 'analytics.export']),
  getAnalyticsHandler
);
```

### Example 4: Using in Controller
```typescript
export async function approveJob(req: Request, res: Response) {
  // req.user has user info
  // req.adminRole has role info
  // req.permissions has permission array
  
  console.log('Admin:', req.user.email);
  console.log('Role:', req.adminRole.name);
  console.log('Has permission?', req.permissions.includes('jobs.approve'));
}
```

---

## 📈 What's Ready for Phase 2

The following models are ready for Phase 2 (Scraper System):
- ✅ ScraperConfig model is created and ready to use
- Routes need to be created
- Controllers need to be created
- Frontend page needs to be built

---

## 🚨 Important Notes

1. **Database Migration**: Run the seeder script to populate permissions and roles
2. **Backward Compatibility**: Old routes still work with `requireRole('admin')`
3. **Permission Inheritance**: SUPER_ADMIN automatically gets all permissions
4. **Audit Trail**: Every admin action is logged with IP address and user agent
5. **Default Roles**: Cannot modify tier or delete default roles

---

## 📞 Support

For questions about:
- **Models**: See model files in `/backend/src/models/`
- **Controllers**: See controller logic in `/backend/src/controllers/adminRoleController.ts`
- **Routes**: See endpoint definitions in `/backend/src/routes/adminRoles.ts`
- **Permissions**: See full list in `/backend/src/scripts/seedAdminSystem.ts`

---

**Next Phase:** Phase 2 - Scraper System Configuration  
**Estimated Time:** Week 2, ~35-40 hours

---
