"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIUsageCounter = exports.APIUsageLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const APIUsageLogSchema = new Schema({
    keyword: {
        type: String,
        required: true,
        index: true
    },
    roleBucket: {
        type: String,
        required: true,
        index: true
    },
    results_count: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'partial'],
        required: true,
        index: true
    },
    error: String,
    jobsCreated: {
        type: Number,
        default: 0
    },
    duplicatesFound: {
        type: Number,
        default: 0
    },
    duplicatesIgnored: {
        type: Number,
        default: 0
    },
    responseTime: {
        type: Number,
        required: true
    },
    executedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    executedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
}, { timestamps: true });
// Index for usage tracking
APIUsageLogSchema.index({
    executedAt: -1,
    roleBucket: 1
});
// Index for monthly reset
APIUsageLogSchema.index({
    executedAt: 1
});
exports.APIUsageLog = mongoose_1.default.model('APIUsageLog', APIUsageLogSchema);
const APIUsageCounterSchema = new Schema({
    month: {
        type: String,
        required: true,
        unique: true,
        index: true,
        // Format: "YYYY-MM" e.g., "2024-01"
    },
    totalCalls: {
        type: Number,
        default: 0,
        min: 0,
        max: 200 // API limit
    },
    successfulCalls: {
        type: Number,
        default: 0
    },
    failedCalls: {
        type: Number,
        default: 0
    },
    totalResults: {
        type: Number,
        default: 0
    },
    warningTriggered: {
        type: Boolean,
        default: false
    },
    hardStopTriggered: {
        type: Boolean,
        default: false
    },
    hardStopTime: Date,
    resetAt: {
        type: Date,
        required: true,
        index: true
    },
}, { timestamps: true });
exports.APIUsageCounter = mongoose_1.default.model('APIUsageCounter', APIUsageCounterSchema);
