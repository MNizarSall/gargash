import { UUID } from "crypto";

export type Chat = {
  id: UUID;
  prompt: string;
  createdAt: number;
};

export type ChatsResult = {
  items: Chat[];
  nextToken?: string;
};
