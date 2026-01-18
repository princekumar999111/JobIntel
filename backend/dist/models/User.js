"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: String,
    phone: String,
    location: String,
    batch: String,
    skills: [String],
    expectedSalary: Schema.Types.Mixed,
    profileCompletion: { type: Number, default: 0 },
    roles: { type: [String], default: ["user"] },
    adminRole: { type: Schema.Types.ObjectId, ref: "AdminRole", default: null },
    tier: { type: String, default: "free" },
    notificationPrefs: {
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false },
    },
    consent: {
        autoApply: { type: Boolean, default: false },
        timestamp: Date,
    },
    resume: {
        rawText: String,
        parsedAt: Date,
        embeddingId: String,
        embedding: [Number],
    },
    parsedResumeData: {
        parsedSkills: [String],
        parsedProfile: Schema.Types.Mixed,
    },
}, { timestamps: true });
exports.User = mongoose_1.default.model("User", UserSchema);
