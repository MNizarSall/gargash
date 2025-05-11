export default function ConclusionMessage({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-lg border bg-purple-100 border-[#5c3a92]">
      <p className="text-[#5c3a92] text-xl font-bold leading-normal">
        Conclusion: {message}
      </p>
    </div>
  );
}
