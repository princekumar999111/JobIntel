"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const JobSchema = new Schema({
    source: String,
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    title: { type: String, required: true, index: true },
    location: String,
    employmentType: String,
    description: String,
    requirements: [String],
    responsibilities: [String],
    requiredSkills: [String],
    preferredSkills: [String],
    salary: String,
    ctc: String,
    applyUrl: String,
    externalId: { type: String, index: true },
    rawHtml: String,
    parsedAt: Date,
    status: { type: String, default: "draft" },
    meta: Schema.Types.Mixed,
    batch: [String],
    eligibleBatches: [Number],
}, { timestamps: true });
exports.Job = mongoose_1.default.model("Job", JobSchema);
