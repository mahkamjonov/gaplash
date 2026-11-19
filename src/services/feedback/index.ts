import "server-only";

/**
 * Extension point for feedback on a finished session, such as speaking scores or tips.
 * Nothing produces feedback yet: the MVP has no AI features. A future provider implements
 * `FeedbackProvider` and is returned from `getFeedbackProvider`; the rest of the app only
 * checks `isAvailable` and shows nothing when it is false.
 */

export type SessionFeedback = {
  sessionId: string;
  /** Short notes for the person, in the UI language. */
  notes: string[];
  createdAt: string;
};

export interface FeedbackProvider {
  readonly isAvailable: boolean;
  getFeedback(sessionId: string): Promise<SessionFeedback | null>;
}

const noFeedback: FeedbackProvider = {
  isAvailable: false,
  getFeedback: async () => null,
};

export function getFeedbackProvider(): FeedbackProvider {
  return noFeedback;
}
