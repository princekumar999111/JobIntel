"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Revenue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const RevenueSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    amount: { type: Number, required: true, default: 500 },
    currency: { type: String, default: 'INR' },
    type: {
        type: String,
        enum: ['job_posting', 'premium_feature', 'subscription', 'other'],
        default: 'job_posting'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed',
        index: true
    },
    transactionId: { type: String, index: true },
    paymentMethod: String,
    description: String,
    metadata: Schema.Types.Mixed,
}, { timestamps: true });
// Index for revenue reports
RevenueSchema.index({ createdAt: -1 });
RevenueSchema.index({ status: 1, createdAt: -1 });
exports.Revenue = mongoose_1.default.model("Revenue", RevenueSchema);
