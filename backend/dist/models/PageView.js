"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageView = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const PageViewSchema = new Schema({
    userId: { type: String, index: true },
    page: { type: String, required: true, index: true },
    referrer: String,
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
// Index for efficient querying
PageViewSchema.index({ timestamp: -1 });
PageViewSchema.index({ page: 1, timestamp: -1 });
exports.PageView = mongoose_1.default.model("PageView", PageViewSchema);
