"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const SubscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, required: true },
    startDate: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.Subscription = mongoose_1.default.model('Subscription', SubscriptionSchema);
