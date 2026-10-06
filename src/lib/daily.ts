import DailyProgress from "@/models/DailyProgress";

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const DAILY_GOALS = {
  templates: 3, // 3 template sessions = 15 sentences
  flashcards: 5, // create or review toward 5
};

export async function getOrCreateToday() {
  const date = todayKey();
  let doc = await DailyProgress.findOne({ date });
  if (!doc) {
    doc = await DailyProgress.create({
      date,
      templatesCompleted: 0,
      flashcardsCreated: 0,
      flashcardsReviewed: 0,
    });
  }
  return doc;
}

export async function bumpDaily(
  field: "templatesCompleted" | "flashcardsCreated" | "flashcardsReviewed",
  by = 1
) {
  const doc = await getOrCreateToday();
  doc[field] = (doc[field] || 0) + by;
  await doc.save();
  return doc;
}
