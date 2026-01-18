import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IScraperConfig extends mongoose.Document {
  // Basic enable/disable
  enabled: boolean;
  
  // Rate limiting
  maxRequestsPerHour: number;      // Rate limiting
  maxRequestsPerDay: number;
  defaultPages: number;            // Default pages to scrape
  maxPagesAllowed: number;         // Maximum pages admin can set
  
  // Data quality filters
  minSalaryDataQuality: number;    // % (0-100) - minimum salary info completeness
  minDescriptionLength: number;    // Minimum characters in job description
  filterDuplicates: boolean;       // Remove duplicate jobs
  
  // Auto-scraping schedule
  autoScrapeEnabled: boolean;
  autoScrapeFrequency: 'daily' | 'weekly' | 'monthly';
  autoScrapeTime: string;          // "02:00 AM IST" format
  skipWeekends: boolean;
  skipHolidays: boolean;
  lastScheduledRun?: Date;
  nextScheduledRun?: Date;
  
  // Cost management
  monthlyBudget: number;           // In rupees
  costPerApiCall: number;          // Cost per API request
  alertThreshold: number;          // Budget % to alert at (e.g., 80)
  estimatedMonthlyCost?: number;   // Calculated based on historical usage
  monthlyUsageCount?: number;      // Number of API calls this month
  
  // Company filtering
  blacklistedCompanies: string[];  // Exclude these companies
  whitelistedCompanies: string[];  // Prioritize these companies
  
  // Metadata
  lastUpdatedBy?: string;          // Admin ID who last updated
  createdAt: Date;
  updatedAt: Date;
}

const ScraperConfigSchema = new Schema<IScraperConfig>(
  {
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
  },
  { timestamps: true }
);

export const ScraperConfig = mongoose.model<IScraperConfig>("ScraperConfig", ScraperConfigSchema);
