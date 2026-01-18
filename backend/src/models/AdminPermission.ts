import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IAdminPermission extends mongoose.Document {
  code: string;                    // "jobs.view", "jobs.approve", "scraper.run"
  name: string;                    // "View Jobs", "Approve Jobs"
  description: string;             // Longer description
  resource: string;                // "jobs", "users", "scraper", "companies", "matching"
  action: string;                  // "view", "create", "edit", "delete", "approve", "execute"
  category: string;                // For grouping in UI
  requiresResourceAccess?: boolean; // Can admin only access certain resources?
  createdAt: Date;
  updatedAt: Date;
}

const AdminPermissionSchema = new Schema<IAdminPermission>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
    category: { type: String, required: true },
    requiresResourceAccess: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdminPermission = mongoose.model<IAdminPermission>("AdminPermission", AdminPermissionSchema);
