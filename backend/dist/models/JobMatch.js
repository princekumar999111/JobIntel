"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobMatch = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const JobMatchSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    similarityScore: { type: Number, required: true, min: 0, max: 1 },
    notified: { type: Boolean, default: false },
    notificationSentAt: Date,
}, { timestamps: true });
// Compound index for efficient querying
JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });
JobMatchSchema.index({ userId: 1, matchScore: -1 });
exports.JobMatch = mongoose_1.default.model("JobMatch", JobMatchSchema);
