"use client";

import { Chat, ChatsResult } from "@/lib/types";
import ChatListItem from "./chat-list-item";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const limit = 10;

  const fetchChats = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    const params = {
      limit: limit.toString(),
      ...(nextToken && {
        nextToken: nextToken,
      }),
    };

    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/chats`);
    url.search = new URLSearchParams(params).toString();

    const res = await fetch(url);
    const data = (await res.json()) as ChatsResult;

    setChats((prev) => [...prev, ...data.items]);
    setNextToken(data.nextToken ?? null);
    setIsLoading(false);
  }, [nextToken, isLoading]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!loaderRef.current || !nextToken) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextToken && !isLoading) {
          fetchChats();
        }
      },
      { threshold: 1 }
    );

    observer.current.observe(loaderRef.current);

    return () => observer.current?.disconnect();
  }, [nextToken, isLoading, fetchChats]);

  return (
    <>
      {chats.map((chat, index) => {
        return <ChatListItem key={index} chat={chat} />;
      })}
      {nextToken && (
        <div ref={loaderRef} className="text-center py-4 text-gray-500">
          Loading more...
        </div>
      )}
      {!nextToken && !isLoading && (
        <div className="text-center py-4 text-gray-400">End of list</div>
      )}
    </>
  );
}
