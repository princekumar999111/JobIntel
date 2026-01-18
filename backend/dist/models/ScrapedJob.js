"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapedJob = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const ScrapedJobSchema = new Schema({
    title: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    applyLink: {
        type: String,
        required: true
    },
    source: {
        type: String,
        default: 'openwebninja',
        enum: ['openwebninja']
    },
    fetchedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiryDate: {
        type: Date,
        index: true
    },
    archived: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: {
        careerLevel: {
            type: String,
            enum: ['intern', 'fresher', 'experienced', 'lead', 'manager'],
            index: true
        },
        domain: {
            type: String,
            enum: ['software', 'data', 'ai', 'cloud', 'business', 'mobile', 'qa', 'other'],
            index: true
        },
        role: {
            type: String,
            index: true,
            trim: true
        },
        techStack: [String],
        experienceRange: String,
        employmentType: {
            type: String,
            enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
            index: true
        },
        workMode: {
            type: String,
            enum: ['remote', 'hybrid', 'onsite'],
            index: true
        },
        batchEligibility: [String],
    },
    jobHash: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    isDuplicate: {
        type: Boolean,
        default: false,
        index: true
    },
    duplicateOf: {
        type: Schema.Types.ObjectId,
        ref: 'ScrapedJob',
        default: null
    },
    appliedCount: {
        type: Number,
        default: 0
    },
    savedCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
}, { timestamps: true });
// TTL index: Auto-delete archived jobs after 90 days
ScrapedJobSchema.index({ updatedAt: 1 }, {
    expireAfterSeconds: 7776000,
    partialFilterExpression: { archived: true }
});
// Compound index for search
ScrapedJobSchema.index({
    'tags.careerLevel': 1,
    'tags.domain': 1,
    archived: 1,
    expiryDate: 1
});
// Index for recent jobs
ScrapedJobSchema.index({
    fetchedAt: -1,
    archived: 1
});
exports.ScrapedJob = mongoose_1.default.model('ScrapedJob', ScrapedJobSchema);
