import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IUser extends mongoose.Document {
  email: string;
  passwordHash: string;
  name?: string;
  phone?: string;
  location?: string;
  batch?: string;
  skills?: string[];
  expectedSalary?: string | number;
  profileCompletion?: number;
  roles: string[];
  adminRole?: mongoose.Types.ObjectId;
  tier: string;
  notificationPrefs: {
    email: boolean;
    whatsapp: boolean;
    telegram: boolean;
  };
  consent?: {
    autoApply?: boolean;
    timestamp?: Date;
  };
  resume?: {
    rawText?: string;
    parsedAt?: Date;
    embeddingId?: string;
    embedding?: number[];
  };
  parsedResumeData?: {
    parsedSkills?: string[];
    parsedProfile?: Record<string, any>;
  };
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: String,
    phone: String,
    location: String,
    batch: String,
    skills: [String],
    expectedSalary: Schema.Types.Mixed,
    profileCompletion: { type: Number, default: 0 },
    roles: { type: [String], default: ["user"] },
    adminRole: { type: Schema.Types.ObjectId, ref: "AdminRole", default: null },
    tier: { type: String, default: "free" },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      telegram: { type: Boolean, default: false },
    },
    consent: {
      autoApply: { type: Boolean, default: false },
      timestamp: Date,
    },
    resume: {
      rawText: String,
      parsedAt: Date,
      embeddingId: String,
      embedding: [Number],
    },
    parsedResumeData: {
      parsedSkills: [String],
      parsedProfile: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
