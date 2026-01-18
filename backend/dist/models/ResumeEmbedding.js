"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeEmbedding = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const ResumeEmbeddingSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    embedding: { type: [Number], required: true }, // Vector of 1536 dimensions (OpenAI ada-002)
    textHash: { type: String, required: true }, // SHA256 hash of resume text
}, { timestamps: true });
exports.ResumeEmbedding = mongoose_1.default.model("ResumeEmbedding", ResumeEmbeddingSchema);
