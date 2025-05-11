"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ConclusionMessage from "@/components/conclusion-message";
import Discussions from "@/components/discussions";
import { Skeleton } from "@/components/ui/skeleton";
import { Chat, DiscussionStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";
import PromptMessage from "@/components/prompt-message";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  const fetchChatData = useCallback(async () => {
    try {
      setPolling(true);
      console.log(
        `Fetching chat data (attempt ${pollCountRef.current + 1})...`
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chats/${id}`
      );
      const result: Chat = await response.json();

      pollCountRef.current += 1;
      console.log(
        `Poll attempt ${pollCountRef.current} complete. Status: ${result.status}`
      );

      setChat(result);
      setLoading(false);
      setPolling(false);

      // If status is not CONCLUDED, continue polling
      const shouldContinue = result.status !== DiscussionStatus.CONCLUDED;
      if (!shouldContinue) {
        console.log("Discussion status is CONCLUDED. Stopping polling.");
      }
      return shouldContinue;
    } catch (error) {
      console.error("Error fetching chat data:", error);
      setLoading(false);
      setPolling(false);
      return false;
    }
  }, [id]);

  useEffect(() => {
    let shouldContinuePolling = true;
    console.log("Setting up polling mechanism...");

    const pollData = async () => {
      shouldContinuePolling = await fetchChatData();

      if (!shouldContinuePolling && intervalRef.current) {
        console.log("Stopping polling interval.");
        clearInterval(intervalRef.current);
      }
    };

    // Initial fetch
    pollData();

    // Set up polling every 3 seconds if needed
    intervalRef.current = setInterval(() => {
      if (shouldContinuePolling) {
        pollData();
      }
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        console.log("Component unmounting. Clearing polling interval.");
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchChatData]);

  if (loading) {
    return (
      <div className="mx-auto h-full w-full rounded-xl relative p-4">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="mx-auto h-full w-full rounded-xl relative p-4">
        <p>Chat not found or error loading data.</p>
      </div>
    );
  }

  console.log("chat.status", chat.status);
  return (
    <div className="mx-auto h-full w-full rounded-xl relative">
      <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-[calc(100vh-6rem)]">
        {polling && (
          <div className="fixed top-4 right-4 bg-purple-100 text-purple-800 px-3 py-1 rounded-md flex items-center gap-2 shadow-md z-10">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        )}

        <div className="flex flex-col space-y-6">
          <PromptMessage message={chat.prompt} />
          <Discussions discussions={chat.discussion} />

          {chat.conclusion && <ConclusionMessage message={chat.conclusion} />}

          {chat.status === DiscussionStatus.STARTED ||
            (chat.status === DiscussionStatus.CONTINUES && (
              <div className="flex flex-col items-center gap-2 p-4">
                <Skeleton className="h-8 w-full" />
                <p className="text-sm text-muted-foreground">
                  Waiting for experts to respond...
                </p>
              </div>
            ))}

          {chat.status === DiscussionStatus.CONCLUDED && (
            <div className="text-center text-green-600 p-2 rounded-md bg-green-50 border border-green-200 mt-4">
              Discussion concluded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
