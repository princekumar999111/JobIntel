import mongoose from "mongoose";

const { Schema } = mongoose;

export type CompanyStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type VerificationStatus = 'not_verified' | 'in_review' | 'verified' | 'rejected';

export interface ICompany extends mongoose.Document {
  // Basic Info
  name: string;
  website?: string;
  careerPage?: string;
  industry?: string;
  companySize?: string;
  founded?: Date;
  
  // Verification
  status: CompanyStatus;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin ID who verified
  rejectionReason?: string;
  
  // Scraping Details
  jobsPosted: number;
  jobsScraped: number;
  lastScrapedAt?: Date;
  nextScrapeAt?: Date;
  
  // Quality Metrics
  dataQualityScore: number; // 0-100
  averageSalaryDataQuality: number; // % of jobs with salary info
  averageDescriptionLength: number;
  
  // Statistics
  totalApplications: number;
  activeJobs: number;
  
  // Filtering
  blacklistedFromScraping: boolean;
  scraperPriority: 'low' | 'medium' | 'high'; // Scraping priority
  
  // Bulk Upload
  bulkUploadBatchId?: string;
  
  // Contact & Details
  contactEmail?: string;
  contactPhone?: string;
  hrContactEmail?: string;
  
  // Metadata
  tags: string[];
  customData?: Record<string, any>;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    // Basic Info
    name: { 
      type: String, 
      required: true, 
      index: true,
      trim: true 
    },
    website: { 
      type: String, 
      trim: true 
    },
    careerPage: { 
      type: String, 
      trim: true 
    },
    industry: { 
      type: String, 
      trim: true 
    },
    companySize: { 
      type: String, 
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    founded: Date,
    
    // Verification
    status: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
      index: true
    },
    verificationStatus: { 
      type: String, 
      enum: ['not_verified', 'in_review', 'verified', 'rejected'],
      default: 'not_verified'
    },
    verifiedAt: Date,
    verifiedBy: String,
    rejectionReason: String,
    
    // Scraping Details
    jobsPosted: { type: Number, default: 0 },
    jobsScraped: { type: Number, default: 0 },
    lastScrapedAt: Date,
    nextScrapeAt: Date,
    
    // Quality Metrics
    dataQualityScore: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    averageSalaryDataQuality: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    averageDescriptionLength: { 
      type: Number, 
      default: 0
    },
    
    // Statistics
    totalApplications: { type: Number, default: 0 },
    activeJobs: { type: Number, default: 0 },
    
    // Filtering
    blacklistedFromScraping: { type: Boolean, default: false, index: true },
    scraperPriority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    
    // Bulk Upload
    bulkUploadBatchId: String,
    
    // Contact & Details
    contactEmail: { type: String, trim: true },
    contactPhone: String,
    hrContactEmail: { type: String, trim: true },
    
    // Metadata
    tags: { type: [String], default: [] },
    customData: { type: Schema.Types.Mixed },
    lastUpdatedBy: String,
  },
  { timestamps: true, collection: 'companies' }
);

// Indexes for query performance
CompanySchema.index({ status: 1, verificationStatus: 1 });
CompanySchema.index({ blacklistedFromScraping: 1, scraperPriority: 1 });
CompanySchema.index({ createdAt: -1 });
CompanySchema.index({ tags: 1 });

export const Company = mongoose.model<ICompany>("Company", CompanySchema);
