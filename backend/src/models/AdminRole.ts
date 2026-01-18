import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IAdminRole extends mongoose.Document {
  name: string;                    // "SUPER_ADMIN", "SCRAPER_ADMIN", "ADMIN", etc.
  description: string;             // Human-readable description
  tier: number;                    // 0 = SUPER_ADMIN, 1 = ADMIN, 2 = SPECIALIST, 3 = VIEWER
  permissions: string[];           // Array of permission codes like "jobs.view", "users.edit"
  
  // Special role capabilities
  canManageRoles: boolean;         // Can this role create/modify/delete other roles
  canManageAdmins: boolean;        // Can manage other admin users
  canEditSettings: boolean;        // Can edit system settings
  canViewAudit: boolean;           // Can view audit logs
  canDeleteAudit: boolean;         // Can delete audit logs
  
  // Metadata
  isDefault?: boolean;             // Is this a default role (cannot be deleted)
  createdBy?: string;              // ID of admin who created this role
  createdAt: Date;
  updatedAt: Date;
}

const AdminRoleSchema = new Schema<IAdminRole>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      enum: ["SUPER_ADMIN", "ADMIN", "SCRAPER_ADMIN", "BUSINESS_ADMIN", "ANALYST", "CUSTOM"]
    },
    description: { type: String, required: true },
    tier: { type: Number, required: true, min: 0, max: 3 },
    permissions: { type: [String], default: [] },
    
    canManageRoles: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canEditSettings: { type: Boolean, default: false },
    canViewAudit: { type: Boolean, default: false },
    canDeleteAudit: { type: Boolean, default: false },
    
    isDefault: { type: Boolean, default: false },
    createdBy: String,
  },
  { timestamps: true }
);

export const AdminRole = mongoose.model<IAdminRole>("AdminRole", AdminRoleSchema);
