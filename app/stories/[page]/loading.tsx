import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-amber-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-amber-100 rounded w-24 mx-auto animate-pulse"></div>
        </div>

        {/* Story Content Skeleton */}
        <div className="max-w-4xl mx-auto">
          <Card className="h-full shadow-lg">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-48"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-24"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
