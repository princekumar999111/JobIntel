import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IAPIUsageLog extends mongoose.Document {
  keyword: string;
  roleBucket: string; // Which role bucket was searched
  results_count: number;
  status: 'success' | 'failed' | 'partial';
  error?: string;
  
  jobsCreated: number; // How many new jobs were saved
  duplicatesFound: number;
  duplicatesIgnored: number;
  
  responseTime: number; // milliseconds
  
  executedAt: Date;
  executedBy: mongoose.Types.ObjectId; // Admin user ID
  
  createdAt: Date;
}

const APIUsageLogSchema = new Schema<IAPIUsageLog>(
  {
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
  },
  { timestamps: true }
);

// Index for usage tracking
APIUsageLogSchema.index({ 
  executedAt: -1, 
  roleBucket: 1 
});

// Index for monthly reset
APIUsageLogSchema.index({ 
  executedAt: 1
});

export const APIUsageLog = mongoose.model<IAPIUsageLog>('APIUsageLog', APIUsageLogSchema);

// ============================================
// API Usage Counter (Current Month)
// ============================================

export interface IAPIUsageCounter extends mongoose.Document {
  month: string; // "2024-01" format
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalResults: number;
  
  warningTriggered: boolean; // true if >= 100
  hardStopTriggered: boolean; // true if >= 150
  hardStopTime?: Date;
  
  resetAt: Date; // When this counter resets (1st of next month)
  
  createdAt: Date;
  updatedAt: Date;
}

const APIUsageCounterSchema = new Schema<IAPIUsageCounter>(
  {
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
  },
  { timestamps: true }
);

export const APIUsageCounter = mongoose.model<IAPIUsageCounter>('APIUsageCounter', APIUsageCounterSchema);
