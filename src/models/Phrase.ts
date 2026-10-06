import mongoose, { Schema, Document, Model } from "mongoose";

export type PhraseType = "collocation" | "chunk";
export type PhraseStatus = "new" | "learning" | "improving" | "mastered";

export interface IPhrase extends Document {
  phrase: string;
  type: PhraseType;
  meaning: string;
  pattern?: string;
  exampleSentence?: string;
  originalMistake?: string;
  category: string;
  notes?: string;
  status: PhraseStatus;
  mistakeCount: number;
  successfulUseCount: number;
  lastMistakeDate?: Date;
  lastSuccessDate?: Date;
  reviewCount: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  difficulty?: number; // 0-5
  confidence?: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

const PhraseSchema = new Schema<IPhrase>(
  {
    phrase: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["collocation", "chunk"],
      required: true,
    },
    meaning: { type: String, required: true },
    pattern: { type: String },
    exampleSentence: { type: String },
    originalMistake: { type: String },
    category: { type: String, default: "Other" },
    notes: { type: String },
    status: {
      type: String,
      enum: ["new", "learning", "improving", "mastered"],
      default: "new",
    },
    mistakeCount: { type: Number, default: 0 },
    successfulUseCount: { type: Number, default: 0 },
    lastMistakeDate: { type: Date },
    lastSuccessDate: { type: Date },
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date, default: Date.now },
    difficulty: { type: Number, default: 3 },
    confidence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for search and filtering
PhraseSchema.index({ phrase: "text", meaning: "text", originalMistake: "text", exampleSentence: "text", notes: "text", category: "text" });
PhraseSchema.index({ type: 1 });
PhraseSchema.index({ status: 1 });
PhraseSchema.index({ category: 1 });
PhraseSchema.index({ nextReviewAt: 1 });
PhraseSchema.index({ mistakeCount: -1 });

const Phrase: Model<IPhrase> =
  mongoose.models.Phrase || mongoose.model<IPhrase>("Phrase", PhraseSchema);

export default Phrase;
