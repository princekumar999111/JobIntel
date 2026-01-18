import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IAdminActivityLog extends mongoose.Document {
  adminId: mongoose.Types.ObjectId;           // Which admin performed action
  action: string;                             // "created_job", "approved_job", "user_deleted"
  resource: string;                           // "job", "user", "company", "admin", "role"
  resourceId?: mongoose.Types.ObjectId;       // ID of affected resource
  resourceName?: string;                      // Name/identifier of resource (for reference)
  
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  
  // Request metadata
  ipAddress: string;
  userAgent: string;
  method: string;                             // GET, POST, PUT, DELETE
  endpoint: string;                           // /api/admin/jobs/approve, etc
  
  // Result
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  errorMessage?: string;
  
  // Additional context
  severity: 'low' | 'medium' | 'high' | 'critical';  // For filtering
  
  timestamp: Date;
}

const AdminActivityLogSchema = new Schema<IAdminActivityLog>(
  {
    adminId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true, 
      index: true 
    },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: Schema.Types.ObjectId, index: true },
    resourceName: String,
    
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    
    ipAddress: { type: String, required: true, index: true },
    userAgent: String,
    method: String,
    endpoint: { type: String, index: true },
    
    status: { 
      type: String, 
      enum: ['success', 'failed', 'pending'],
      default: 'success',
      index: true
    },
    statusCode: Number,
    errorMessage: String,
    
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Index for common queries
AdminActivityLogSchema.index({ adminId: 1, timestamp: -1 });
AdminActivityLogSchema.index({ resource: 1, timestamp: -1 });
AdminActivityLogSchema.index({ action: 1, timestamp: -1 });

export const AdminActivityLog = mongoose.model<IAdminActivityLog>("AdminActivityLog", AdminActivityLogSchema);
