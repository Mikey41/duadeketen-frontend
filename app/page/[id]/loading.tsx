export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-amber-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-24 bg-amber-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-amber-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Story Content Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="flex justify-center gap-4 mb-6">
              <div className="h-6 w-20 bg-amber-100 rounded-full animate-pulse"></div>
              <div className="h-6 w-24 bg-orange-100 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 mb-8">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          </div>

          {/* Audio Controls */}
          <div className="bg-amber-50 rounded-xl p-6">
            <div className="h-6 w-32 bg-amber-200 rounded mb-4 animate-pulse"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-200 rounded-full animate-pulse"></div>
              <div className="flex-1 h-2 bg-amber-200 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-amber-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
