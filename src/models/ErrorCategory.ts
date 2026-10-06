import mongoose, { Schema, Document, Model } from "mongoose";

export interface IErrorCategory extends Document {
  name: string;
  totalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ErrorCategorySchema = new Schema<IErrorCategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ErrorCategory: Model<IErrorCategory> =
  mongoose.models.ErrorCategory ||
  mongoose.model<IErrorCategory>("ErrorCategory", ErrorCategorySchema);

export default ErrorCategory;
