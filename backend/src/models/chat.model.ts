export interface Message {
  agentId: string;
  message: string;
}

export enum DiscussionStatus {
  STARTED = "STARTED",
  CONTINUES = "CONTINUES",
  CONCLUDED = "CONCLUDED",
}

export interface Chat {
  id: string;
  prompt: string;
  createdAt: number;
  status: DiscussionStatus;
  discussion?: Message[];
}
