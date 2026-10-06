import mongoose, { Schema, Document, Model } from "mongoose";

export type ReviewResult = "again" | "hard" | "good" | "easy";

export interface IReview extends Document {
  phraseId: mongoose.Types.ObjectId;
  result: ReviewResult;
  difficulty?: number;
  reviewedAt: Date;
  reviewType?: string; // fill-blank, multiple-choice, recall, personal-sentence
  userAnswer?: string;
}

const ReviewSchema = new Schema<IReview>(
  {
    phraseId: { type: Schema.Types.ObjectId, ref: "Phrase", required: true },
    result: {
      type: String,
      enum: ["again", "hard", "good", "easy"],
      required: true,
    },
    difficulty: { type: Number },
    reviewedAt: { type: Date, default: Date.now },
    reviewType: { type: String },
    userAnswer: { type: String },
  },
  { timestamps: true }
);

ReviewSchema.index({ phraseId: 1, reviewedAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
