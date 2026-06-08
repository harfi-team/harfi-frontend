// ════════════════════════════════════════════════════════════════
//  AI Chat models (adapted from the working build)
// ════════════════════════════════════════════════════════════════

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RetrievedCraftsman {
  id: number;
  name: string;
  serviceType: string;
  city: string;
  rating: number;
  experienceYears: number;
  relevantText: string;
  similarityScore: number;
  isNearby: boolean;
  nearbyFromCity: string | null;
}

export interface QueryResult {
  answer: string;
  retrievedCraftsmen: RetrievedCraftsman[];
  latencyMs: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  timestamp: Date;
}