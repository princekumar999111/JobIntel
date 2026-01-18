"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const ApplicationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    appliedAt: Date,
    method: String,
    status: String,
    proof: Schema.Types.Mixed,
}, { timestamps: true });
exports.Application = mongoose_1.default.model("Application", ApplicationSchema);
