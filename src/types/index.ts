export type PhraseType = "collocation" | "chunk";
export type PhraseStatus = "new" | "learning" | "improving" | "mastered";
export type ReviewResult = "again" | "hard" | "good" | "easy";

export interface Phrase {
  _id: string;
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
  lastMistakeDate?: string;
  lastSuccessDate?: string;
  reviewCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  difficulty?: number;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  phraseId: string;
  result: ReviewResult;
  difficulty?: number;
  reviewedAt: string;
  reviewType?: string;
  userAnswer?: string;
}

export const CATEGORIES = [
  "Everyday English",
  "Speaking",
  "Conversation",
  "Work",
  "Interview",
  "Education",
  "Career",
  "Relationships",
  "Opinions",
  "Storytelling",
  "Grammar Patterns",
  "Other",
] as const;

export const STATUS_LABELS: Record<PhraseStatus, string> = {
  new: "New",
  learning: "Learning",
  improving: "Improving",
  mastered: "Mastered",
};

export const STATUS_COLORS: Record<PhraseStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  learning: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  improving: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  mastered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
};


export type FlashcardSource = "template" | "manual";

export interface Flashcard {
  _id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  phraseId?: string;
  phraseText?: string;
  tags?: string[];
  reviewCount: number;
  ease: number;
  nextReviewAt: string;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const DAILY_GOALS = {
  templates: 3,
  flashcards: 5,
} as const;
