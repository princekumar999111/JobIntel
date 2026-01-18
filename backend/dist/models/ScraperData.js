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
exports.SavedJob = exports.ScraperSalaryQuery = exports.ScraperSearch = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ScraperSearchSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    query: {
        type: String,
        required: true,
        index: true,
    },
    country: {
        type: String,
        required: true,
        index: true,
    },
    employmentType: String,
    datePosted: String,
    remoteOnly: { type: Boolean, default: false },
    page: { type: Number, default: 1 },
    numPages: { type: Number, default: 1 },
    resultCount: {
        type: Number,
        default: 0,
        index: true,
    },
    results: [
        {
            jobId: String,
            title: String,
            company: String,
            location: String,
            salary: {
                min: Number,
                max: Number,
                currency: String,
            },
            link: String,
        },
    ],
}, { timestamps: true });
const ScraperSalaryQuerySchema = new mongoose_1.Schema({
    jobTitle: {
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
    company: String,
    salaryData: {
        currency: String,
        median: Number,
        min: Number,
        max: Number,
        sourceCount: { type: Number, default: 0 },
    },
    queried: {
        type: Number,
        default: 0,
    },
    lastQueried: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
const SavedJobSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    jobId: {
        type: String,
        required: true,
        index: true,
    },
    jobTitle: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: true,
        index: true,
    },
    location: String,
    salary: {
        min: Number,
        max: Number,
        currency: String,
    },
    jobLink: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        enum: ['linkedin', 'company_page', 'other'],
        default: 'linkedin',
    },
    notes: String,
    savedAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, { timestamps: true });
// Create compound unique index to prevent duplicate saved jobs per user
ScraperSearchSchema.index({ userId: 1, query: 1, country: 1 });
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
ScraperSalaryQuerySchema.index({ jobTitle: 1, location: 1, experienceLevel: 1 }, { unique: true });
exports.ScraperSearch = mongoose_1.default.model('ScraperSearch', ScraperSearchSchema);
exports.ScraperSalaryQuery = mongoose_1.default.model('ScraperSalaryQuery', ScraperSalaryQuerySchema);
exports.SavedJob = mongoose_1.default.model('SavedJob', SavedJobSchema);
