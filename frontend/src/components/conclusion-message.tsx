export default function ConclusionMessage({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-lg border bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-300 text-amber-900 bg-gray-50 ">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🏁</span>
        </div>
      </div>

      <p className="text-gray-700">{message}</p>
    </div>
  );
}
