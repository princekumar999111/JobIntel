"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRole = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const AdminRoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
        enum: ["SUPER_ADMIN", "ADMIN", "SCRAPER_ADMIN", "BUSINESS_ADMIN", "ANALYST", "CUSTOM"]
    },
    description: { type: String, required: true },
    tier: { type: Number, required: true, min: 0, max: 3 },
    permissions: { type: [String], default: [] },
    canManageRoles: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canEditSettings: { type: Boolean, default: false },
    canViewAudit: { type: Boolean, default: false },
    canDeleteAudit: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    createdBy: String,
}, { timestamps: true });
exports.AdminRole = mongoose_1.default.model("AdminRole", AdminRoleSchema);
