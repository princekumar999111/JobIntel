"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperConfig = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const ScraperConfigSchema = new Schema({
    enabled: { type: Boolean, default: true },
    maxRequestsPerHour: { type: Number, default: 10 },
    maxRequestsPerDay: { type: Number, default: 50 },
    defaultPages: { type: Number, default: 5, min: 1, max: 100 },
    maxPagesAllowed: { type: Number, default: 100, min: 5 },
    minSalaryDataQuality: { type: Number, default: 75, min: 0, max: 100 },
    minDescriptionLength: { type: Number, default: 500 },
    filterDuplicates: { type: Boolean, default: true },
    autoScrapeEnabled: { type: Boolean, default: false },
    autoScrapeFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
    },
    autoScrapeTime: { type: String, default: '02:00 AM IST' },
    skipWeekends: { type: Boolean, default: true },
    skipHolidays: { type: Boolean, default: true },
    lastScheduledRun: Date,
    nextScheduledRun: Date,
    monthlyBudget: { type: Number, default: 5000 },
    costPerApiCall: { type: Number, default: 0.5 },
    alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
    estimatedMonthlyCost: { type: Number, default: 0 },
    monthlyUsageCount: { type: Number, default: 0 },
    blacklistedCompanies: { type: [String], default: [] },
    whitelistedCompanies: { type: [String], default: [] },
    lastUpdatedBy: String,
}, { timestamps: true });
exports.ScraperConfig = mongoose_1.default.model("ScraperConfig", ScraperConfigSchema);
