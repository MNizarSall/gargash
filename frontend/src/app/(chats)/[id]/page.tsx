import ChatForm from "@/components/chat-form";

export default function ChatPage() {
  return (
    <div>
      <div className="mx-auto h-full w-full max-w-3xl rounded-xl bg-muted/50">
        chat page
      </div>
      <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50">
        <ChatForm />
      </div>
    </div>
  );
}
