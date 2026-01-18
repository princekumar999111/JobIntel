"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPermission = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const AdminPermissionSchema = new Schema({
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
    category: { type: String, required: true },
    requiresResourceAccess: { type: Boolean, default: false },
}, { timestamps: true });
exports.AdminPermission = mongoose_1.default.model("AdminPermission", AdminPermissionSchema);
