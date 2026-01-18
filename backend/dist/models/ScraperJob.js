"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryData = exports.ScraperSearch = exports.ScraperJob = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Scraper Job Schema
const scraperJobSchema = new mongoose_1.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        index: true,
    },
    company: {
        type: String,
        required: true,
        index: true,
    },
    location: {
        type: String,
        required: true,
        index: true,
    },
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'INR',
        },
    },
    description: String,
    requirements: [String],
    benefits: [String],
    experienceLevel: String,
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contractor', 'Internship'],
    },
    remote: {
        type: Boolean,
        default: false,
        index: true,
    },
    postedDate: {
        type: Date,
        index: true,
    },
    applyUrl: String,
    rawData: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
    collection: 'scraper_jobs',
});
// Scraper Search Schema (for history)
const scraperSearchSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    searchQuery: {
        type: String,
        required: true,
    },
    filters: {
        keyword: String,
        location: String,
        employmentType: String,
        datePosted: String,
        remote: Boolean,
        experienceLevel: String,
        salaryMin: Number,
        salaryMax: Number,
    },
    resultsCount: {
        type: Number,
        default: 0,
    },
    results: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'ScraperJob',
        },
    ],
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
        index: true,
    },
    error: String,
    executedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    collection: 'scraper_searches',
});
// Salary Data Schema
const salaryDataSchema = new mongoose_1.Schema({
    position: {
        type: String,
        required: true,
        index: true,
    },
    location: {
        type: String,
        required: true,
        index: true,
    },
    experienceLevel: String,
    salaryRange: {
        min: {
            type: Number,
            required: true,
        },
        max: {
            type: Number,
            required: true,
        },
        median: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
    },
    currency: {
        type: String,
        default: 'INR',
    },
    dataSource: String,
    sampleSize: Number,
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    collection: 'salary_data',
});
// Create compound indexes for common queries
scraperJobSchema.index({ location: 1, employmentType: 1 });
scraperJobSchema.index({ company: 1, location: 1 });
scraperJobSchema.index({ title: 1, location: 1 });
scraperJobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
scraperSearchSchema.index({ userId: 1, createdAt: -1 });
scraperSearchSchema.index({ status: 1, createdAt: -1 });
salaryDataSchema.index({ position: 1, location: 1, experienceLevel: 1 });
// Export models - with guards to prevent recompilation during hot reload
exports.ScraperJob = mongoose_1.default.models.ScraperJob || mongoose_1.default.model('ScraperJob', scraperJobSchema);
exports.ScraperSearch = mongoose_1.default.models.ScraperSearch || mongoose_1.default.model('ScraperSearch', scraperSearchSchema);
exports.SalaryData = mongoose_1.default.models.SalaryData || mongoose_1.default.model('SalaryData', salaryDataSchema);
