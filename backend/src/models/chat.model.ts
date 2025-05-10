export interface Message {
  agentId: string;
  message: string;
}

export interface Chat {
  id: string;
  prompt: string;
  createdAt: number;
  discussion: Message[];
}
