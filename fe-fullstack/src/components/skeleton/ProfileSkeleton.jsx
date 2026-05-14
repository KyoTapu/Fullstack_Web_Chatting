export default function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen bg-background animate-pulse">
      {/* Sidebar */}
      <div className="hidden lg:block fixed h-full w-[80px] bg-gray-200" />

      <main className="flex-1 flex flex-col lg:ml-[80px]">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gray-300" />

        <div className="px-4 sm:px-8 pb-12 -mt-20">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="flex flex-col md:flex-row items-center gap-6 rounded-3xl bg-white shadow-xl p-6 md:p-8">
              {/* Avatar */}
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-gray-300" />

              {/* Info */}
              <div className="flex-1 space-y-3 w-full">
                <div className="h-6 bg-gray-300 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />

                <div className="flex gap-3 pt-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                </div>
              </div>

              {/* Button */}
              <div className="h-10 w-32 bg-gray-300 rounded-xl" />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left */}
              <div className="space-y-6">
                <SkeletonSection />
                <SkeletonSection />
              </div>

              {/* Right */}
              <div className="lg:col-span-2 space-y-6">
                <SkeletonSection large />
                <SkeletonSection large/>
                <SkeletonSection large/>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SkeletonSection({ large = false }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
      {/* Title */}
      <div className="h-5 bg-gray-300 rounded w-1/3" />

      {/* Content */}
      <div className="space-y-2">
        {Array.from({ length: large ? 4 : 3 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-full" />
        ))}
      </div>
    </div>
  );
}
