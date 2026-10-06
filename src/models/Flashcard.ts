import mongoose, { Schema, Document, Model } from "mongoose";

export type FlashcardSource = "template" | "manual";

export interface IFlashcard extends Document {
  front: string; // title side: phrase (template) or mistake (manual)
  back: string; // answer side: numbered sentences or correct form
  source: FlashcardSource;
  phraseId?: mongoose.Types.ObjectId;
  phraseText?: string;
  /** For template cards: the 5 personal sentences */
  sentences?: string[];
  tags?: string[];
  reviewCount: number;
  ease: number;
  nextReviewAt: Date;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["template", "manual"],
      required: true,
    },
    phraseId: { type: Schema.Types.ObjectId, ref: "Phrase" },
    phraseText: { type: String },
    sentences: [{ type: String }],
    tags: [{ type: String }],
    reviewCount: { type: Number, default: 0 },
    ease: { type: Number, default: 2.5 },
    nextReviewAt: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

FlashcardSchema.index({ source: 1 });
FlashcardSchema.index({ nextReviewAt: 1 });
FlashcardSchema.index({ phraseId: 1 });

const Flashcard: Model<IFlashcard> =
  mongoose.models.Flashcard ||
  mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);

export default Flashcard;
