import { UUID } from "crypto";

export enum DiscussionStatus {
  STARTED = "STARTED",
  CONTINUES = "CONTINUES",
  CONCLUDED = "CONCLUDED",
}

export type Discussion = {
  content: string;
  role: string;
  targetExpert?: "sales" | "legal" | "hr";
  isConclusion?: boolean;
};

export type Chat = {
  id: UUID;
  prompt: string;
  createdAt: number;
  discussion?: Discussion[];
  status: DiscussionStatus | string;
  conclusion: string;
};

export type ChatsResult = {
  items: Chat[];
  nextToken?: string;
};

export const roleColors = {
  leader: "bg-blue-50 border-blue-200 text-blue-800",
  sales: "bg-green-50 border-green-200 text-green-800",
  legal: "bg-purple-50 border-purple-200 text-purple-800",
  hr: "bg-orange-50 border-orange-200 text-orange-800",
  conclusion:
    "bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-300 text-amber-900",
};

export const roleIcons = {
  leader: "👑",
  sales: "💼",
  legal: "⚖️",
  hr: "👥",
  conclusion: "🏁",
};
