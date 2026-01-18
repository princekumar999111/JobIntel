"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const NotificationLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    channel: String,
    payload: Schema.Types.Mixed,
    status: String,
    attempts: { type: Number, default: 0 },
    lastError: String,
}, { timestamps: true });
exports.NotificationLog = mongoose_1.default.model("NotificationLog", NotificationLogSchema);
