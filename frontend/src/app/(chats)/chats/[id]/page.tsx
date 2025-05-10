import ConclusionMessage from "@/components/conclusion-message";
import Discussions from "@/components/discussions";
import { Skeleton } from "@/components/ui/skeleton";
import { Chat } from "@/lib/types";
import { UUID } from "crypto";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: UUID }>;
}) {
  const { id } = await params;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chats/${id}`
  );
  const result: Chat = await response.json();
  console.log(result);

  return (
    <div className="mx-auto h-full w-full rounded-xl relative">
      <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-[calc(100vh-6rem)]">
        <div className="flex flex-col space-y-6">
          <Discussions discussions={result.discussion} />

          {result.conclusion && (
            <ConclusionMessage message={result.conclusion} />
          )}

          {result.status === "CONTINUES" && <Skeleton className="h-8 w-full" />}
        </div>
      </div>
    </div>
  );
}
