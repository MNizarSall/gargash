import { Discussion } from "@/lib/types";
import DiscussionItem from "./discussion-item";

export default function Discussions({
  discussions,
}: {
  discussions?: Discussion[];
}) {
  return discussions?.map((discussion, index) => {
    return <DiscussionItem discussion={discussion} key={index} />;
  });
}
