import { Chat } from "@/lib/types";
import Link from "next/link";

export default function ChatListItem({ chat }: { chat: Chat }) {
  return (
    <Link
      href={`/chats/${chat.id}`}
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
    >
      <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
        {chat.prompt}
      </span>
    </Link>
  );
}
