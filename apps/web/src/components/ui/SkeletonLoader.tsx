interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className = "" }: SkeletonLoaderProps) {
  return (
    <div
      className={`animate-pulse bg-brutal-black/10 border-4 border-brutal-black ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PlayerStatsSkeleton() {
  return (
    <div className="card-brutal bg-brutal-cream p-4 space-y-2">
      <h3 className="text-sm font-black text-brutal-black text-center mb-3 uppercase">
        Your Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center border-4 border-brutal-black bg-brutal-white p-3">
          <p className="text-xs text-brutal-black font-black uppercase mb-2">Games</p>
          <SkeletonLoader className="h-8 w-16 mx-auto" />
        </div>
        <div className="text-center border-4 border-brutal-black bg-brutal-white p-3">
          <p className="text-xs text-brutal-black font-black uppercase mb-2">High Score</p>
          <SkeletonLoader className="h-8 w-16 mx-auto" />
        </div>
        <div className="text-center col-span-2 border-4 border-brutal-black bg-brutal-yellow p-3">
          <p className="text-xs text-brutal-black font-black uppercase mb-2">Total Earnings</p>
          <SkeletonLoader className="h-8 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function LeaderboardEntrySkeleton() {
  return (
    <div className="border-4 border-brutal-black bg-brutal-white p-3 sm:p-4 flex justify-between items-center shadow-brutal-sm">
      <div className="flex items-center gap-3">
        <SkeletonLoader className="w-8 h-8 rounded-full" />
        <SkeletonLoader className="w-32 h-4" />
      </div>
      <div className="text-right space-y-2">
        <SkeletonLoader className="w-20 h-5 ml-auto" />
        <SkeletonLoader className="w-16 h-3 ml-auto" />
      </div>
    </div>
  );
}
