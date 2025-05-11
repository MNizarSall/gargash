import ChatForm from "@/components/chat-form";

export default function ChatsPage() {
  return (
    <div className="relative h-full flex items-center justify-center">
      <h2 className="text-2xl font-bold mb-2">?</h2>
      <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50 absolute bottom-0">
        <ChatForm />
      </div>
    </div>
  );
}
