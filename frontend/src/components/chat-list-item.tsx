import { Chat } from "@/lib/types";
import Link from "next/link";

export default function ChatListItem({ chat }: { chat: Chat }) {
  return (
    <Link
      href={`/chats/${chat.id}`}
      className="flex flex-col items-start gap-2 whitespace-nowrap border-b border-[#5c3a92] p-4 text-sm leading-tight last:border-b-0 hover:bg-[#5c3a92] hover:text-[#d5b26b]"
    >
      <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs text-purple-200">
        {chat.prompt}
      </span>
    </Link>
  );
}
