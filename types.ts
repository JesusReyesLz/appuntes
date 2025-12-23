
export interface Reference {
  id: string;
  title: string;
  author: string;
  url?: string;
  year?: string;
}

export interface QuizItem {
  id: string;
  question: string;
  answer: string;
  userAnswer?: string; // To store what the user types during study
  aiFeedback?: string; // To store feedback given by AI
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  // SRS Fields
  nextReview?: number; // Timestamp for when it should be shown next
  interval?: number;   // Interval in days
  easeFactor?: number; // Multiplier for the interval (standard start is 2.5)
  repetitions?: number;// How many times consecutively correct
  state?: 'new' | 'learning' | 'review' | 'relearning';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface KWLData {
  know: string;
  want: string;
  learned: string;
}

export interface NotePage {
  id: string;
  title: string;
  date: string;
  readingContent: string; // New: Full reading material
  cues: string;      // Left column: Keywords/Questions
  notes: string;     // Right column: Main notes
  summary: string;   // Bottom: Summary
  references: Reference[];
  quiz: QuizItem[];
  flashcards: Flashcard[];
  chatHistory: ChatMessage[];
  kwl: KWLData;
  solarSchema: string;
  createdAt: number;
}

export type GenerativeAction = 'summarize' | 'generate_cues' | 'format_notes' | 'generate_quiz' | 'generate_flashcards' | 'generate_solar' | 'generate_kwl';