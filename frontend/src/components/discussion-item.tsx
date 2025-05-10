import { Discussion, roleColors, roleIcons } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export default function DiscussionItem({
  discussion,
}: {
  discussion: Discussion;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border ",

        roleColors[discussion.role as keyof typeof roleColors] ||
          "bg-gray-50 border-gray-200"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">
            {roleIcons[discussion.role as keyof typeof roleIcons] || "🗣️"}
          </span>
          <span className="font-medium capitalize">{discussion.role}</span>
        </div>

        {discussion.targetExpert && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">→</span>
            <Badge variant="outline" className="capitalize">
              {roleIcons[discussion.targetExpert as keyof typeof roleIcons] ||
                "🎯"}{" "}
              {discussion.targetExpert}
            </Badge>
          </div>
        )}
      </div>

      <p className="text-gray-700">{discussion.content}</p>
    </div>
  );
}
