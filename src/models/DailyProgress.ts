import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyProgress extends Document {
  date: string; // YYYY-MM-DD
  templatesCompleted: number; // goal: 3
  flashcardsCreated: number;
  flashcardsReviewed: number; // goal: 5 combined create+review actions toward goal
  createdAt: Date;
  updatedAt: Date;
}

const DailyProgressSchema = new Schema<IDailyProgress>(
  {
    date: { type: String, required: true, unique: true },
    templatesCompleted: { type: Number, default: 0 },
    flashcardsCreated: { type: Number, default: 0 },
    flashcardsReviewed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DailyProgress: Model<IDailyProgress> =
  mongoose.models.DailyProgress ||
  mongoose.model<IDailyProgress>("DailyProgress", DailyProgressSchema);

export default DailyProgress;
