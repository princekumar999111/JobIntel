"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Visitor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const VisitorSchema = new Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: String,
    ipAddress: String,
    userAgent: String,
    firstVisit: { type: Date, default: Date.now, index: true },
    lastVisit: { type: Date, default: Date.now, index: true },
    pageCount: { type: Number, default: 1 },
    clickCount: { type: Number, default: 0 },
    pages: [String],
}, { timestamps: true });
// Index for efficient querying
VisitorSchema.index({ lastVisit: -1 });
VisitorSchema.index({ firstVisit: -1 });
exports.Visitor = mongoose_1.default.model("Visitor", VisitorSchema);
