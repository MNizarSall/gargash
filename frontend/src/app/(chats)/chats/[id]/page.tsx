import ChatForm from "@/components/chat-form";
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
  const result = await response.json();
  console.log(result);

  return (
    <div className="mx-auto h-full w-full max-w-3xl rounded-xl relative">
      <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-[calc(100vh-6rem)]">
        <div className="flex flex-col space-y-2">
          <div className="flex items-start">
            <div className="bg-muted/50 rounded-lg p-4 max-w-[80%]">
              <p className="text-sm">Hello! How can I assist you today?</p>
            </div>
          </div>

          <div className="flex items-start justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-[80%]">
              <p className="text-sm">
                Hi! I'd like to learn more about machine learning.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-24 w-full max-w-3xl rounded-xl  absolute bottom-0">
        <ChatForm />
      </div>
    </div>
  );
}
