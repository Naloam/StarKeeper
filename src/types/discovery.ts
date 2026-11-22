import type { StarredRepo } from "./index";

export interface PublicRepo extends StarredRepo {
  isPrivate: false;
  visibility: "public";
  topics: string[];
  licenseId: string | null;
  fork: boolean;
  disabled: boolean;
  defaultBranch: string | null;
}

export type DiscoveryMode = "rising" | "active" | "topics" | "personal";
export interface Interest {
  name: string;
  weight: number;
}
export interface InterestProfile {
  enabled: boolean;
  infer: boolean;
  topics: Interest[];
  blockedTopics: string[];
  blockedLanguages: string[];
  blockedKeywords: string[];
}
export type FeedbackKind = "interested" | "not-interested" | "used" | "hidden";
export interface Feedback {
  kind: FeedbackKind;
  until?: number;
  signals?: string[];
}
export interface ProjectContext {
  repo: PublicRepo;
  goal: string;
  keywords: string[];
}
export interface DiscoveryFilters {
  mode: DiscoveryMode;
  days: 7 | 30 | 90;
  language: string;
  topic: string;
  keyword: string;
}
