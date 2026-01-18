"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileField = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ProfileFieldSchema = new mongoose_1.default.Schema({
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    adminOnly: { type: Boolean, default: false },
}, { timestamps: true });
exports.ProfileField = mongoose_1.default.model('ProfileField', ProfileFieldSchema);
