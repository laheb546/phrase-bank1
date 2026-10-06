/** Labels for the five personal sentences — content is fully free choice */
export const SENTENCE_LABELS = [
  "First sentence",
  "Second sentence",
  "Third sentence",
  "Fourth sentence",
  "Fifth sentence",
] as const;

/** Build the back text stored on one flashcard from 5 sentences */
export function formatSentencesBack(sentences: string[]): string {
  return sentences
    .map((s, i) => `${i + 1}. ${s.trim()}`)
    .join("\n");
}
