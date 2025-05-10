export enum DiscussionStatus {
  STARTED = "STARTED",
  CONTINUES = "CONTINUES",
  CONCLUDED = "CONCLUDED",
}

export interface Message {
  role: string;
  content: string;
  targetExpert?: string;
}

export interface Chat {
  id: string;
  prompt: string;
  createdAt: number;
  status: DiscussionStatus;
  discussion?: Message[];
  conclusion?: string;
}
