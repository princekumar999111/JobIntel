"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminActivityLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const AdminActivityLogSchema = new Schema({
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
}, { timestamps: false });
// Index for common queries
AdminActivityLogSchema.index({ adminId: 1, timestamp: -1 });
AdminActivityLogSchema.index({ resource: 1, timestamp: -1 });
AdminActivityLogSchema.index({ action: 1, timestamp: -1 });
exports.AdminActivityLog = mongoose_1.default.model("AdminActivityLog", AdminActivityLogSchema);
