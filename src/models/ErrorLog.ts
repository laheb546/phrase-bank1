import mongoose, { Schema, Document, Model } from "mongoose";

export interface IErrorLog extends Document {
  categoryId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const ErrorLogSchema = new Schema<IErrorLog>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ErrorCategory",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ErrorLogSchema.index({ categoryId: 1, date: 1 }, { unique: true });
ErrorLogSchema.index({ date: 1 });

const ErrorLog: Model<IErrorLog> =
  mongoose.models.ErrorLog ||
  mongoose.model<IErrorLog>("ErrorLog", ErrorLogSchema);

export default ErrorLog;
