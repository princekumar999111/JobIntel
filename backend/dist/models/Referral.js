"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Referral = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const ReferralSchema = new Schema({
    referrerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    referredEmail: String,
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    status: { type: String, default: "created" },
    commission: Number,
}, { timestamps: true });
exports.Referral = mongoose_1.default.model("Referral", ReferralSchema);
