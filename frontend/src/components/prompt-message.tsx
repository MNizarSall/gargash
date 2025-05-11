import { roleIcons } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export default function PromptMessage({ message }: { message: string }) {
  return (
    <div className={cn("p-4 rounded-lg border ", "bg-gray-50 border-gray-200")}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-medium capitalize">Problem</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">→</span>
          <Badge variant="outline" className="capitalize">
            {roleIcons["leader"] || "🎯"} {"Leader"}
          </Badge>
        </div>
      </div>

      <p className="text-gray-700">{message}</p>
    </div>
  );
}
