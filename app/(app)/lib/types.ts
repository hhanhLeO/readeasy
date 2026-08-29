export type { WordStatus } from "./format";
import type { WordStatus } from "./format";

export type Article = {
  id: string;
  title: string;
  minutes: number;
  source?: string;
  level?: string;
  topic?: string;
  cover?: string;
};

export type WordEntry = {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  documentId: string | null;
  documentTitle: string | null;
  status: WordStatus;
  reviewLabel: string;
  nextReviewAt: number;
  createdAt: number;
};

export type ReviewCard = {
  reviewId: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  contextSentence: string;
  documentTitle: string | null;
};