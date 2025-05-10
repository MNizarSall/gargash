export interface Message {
  agentId: string;
  message: string;
}

export interface Chat {
  id: string;
  prompt: string;
  discussion?: Message[];
}

// Mock data
export const mockChats: Chat[] = [
  {
    id: "abc",
    prompt: "Why is this like that?",
    discussion: [
      {
        agentId: "xyz",
        message: "Let's start the discussion, agent x, what do you think?",
      },
    ],
  },
];
