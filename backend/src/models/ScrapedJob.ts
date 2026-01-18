import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IScrapedJob extends mongoose.Document {
  // Core job info
  title: string;
  company: string;
  location: string;
  description: string;
  applyLink: string;
  
  // Source tracking
  source: 'openwebninja';
  fetchedAt: Date;
  expiryDate: Date; // fetchedAt + 30 days
  archived: boolean;
  
  // Tagging & categorization
  tags: {
    careerLevel: 'intern' | 'fresher' | 'experienced' | 'lead' | 'manager';
    domain: 'software' | 'data' | 'ai' | 'cloud' | 'business' | 'mobile' | 'qa' | 'other';
    role: string;
    techStack: string[];
    experienceRange: string; // e.g., "0-1", "2-4", "5+"
    employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
    workMode: 'remote' | 'hybrid' | 'onsite';
    batchEligibility: string[]; // e.g., ["2024", "2025", "2026"]
  };
  
  // Deduplication
  jobHash: string; // MD5 of title+company+location for dedup
  isDuplicate: boolean;
  duplicateOf?: mongoose.Types.ObjectId;
  
  // Metadata
  appliedCount: number; // How many users applied
  savedCount: number;   // How many users saved
  viewCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ScrapedJobSchema = new Schema<IScrapedJob>(
  {
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
  },
  { timestamps: true }
);

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

export const ScrapedJob = mongoose.model<IScrapedJob>('ScrapedJob', ScrapedJobSchema);
