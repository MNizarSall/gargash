import { cn } from "@/lib/utils";

export default function PromptMessage({ message }: { message: string }) {
  return (
    <div className={cn("p-4 rounded-lg  bg-[#d5b26b] text-[#3a1c70]")}>
      <p className="text-accent font-semibold">{message}</p>
    </div>
  );
}
