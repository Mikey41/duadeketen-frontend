import { notFound } from "next/navigation"
import { StoryDisplay } from "@/components/story-display"

interface PageData {
  pageNumber: number
  gaText: string
  qrCodeUrl: string
  audioUrl: string | null
}


  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
}
async function fetchPageData(pageNumber: string): Promise<PageData | null> {
  try {
    const response = await fetch(`${baseUrl}/stories/page/${pageNumber}`, {
      cache: "no-store", // Always fetch fresh data
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch page ${pageNumber}:`, response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error)
    return null
  }
}

export default async function StoryPage({
  params,
}: {
  params: { page: string }
}) {
  const pageData = await fetchPageData(params.page)

  if (!pageData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Duadeketen Stories</h1>
          <p className="text-amber-700">Page {pageData.pageNumber}</p>
        </div>

        {/* Story Content */}
        <div className="max-w-4xl mx-auto">
          <StoryDisplay pageData={pageData} text={pageData.gaText} showManualInput={false} />

        {pageData.audioUrl && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2 text-amber-900">Listen to the Story</h2>
              <audio
                controls
                src={pageData.audioUrl}
                className="w-full"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center mt-8 gap-4">
          <a
            href={`/stories/${Math.max(1, pageData.pageNumber - 1)}`}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Previous Page
          </a>
          <a
            href={`/stories/${pageData.pageNumber + 1}`}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Next Page
          </a>
        </div>

        {/* Back to Scanner */}
        <div className="text-center mt-6">
          <a href="/" className="text-amber-600 hover:text-amber-800 underline">
            ← Back to QR Scanner
          </a>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: { page: string }
}) {
  const pageData = await fetchPageData(params.page)

  return {
    title: pageData ? `Duadeketen Stories - Page ${pageData.pageNumber}` : "Story Not Found",
    description: pageData
      ? `Read page ${pageData.pageNumber} of Duadeketen Stories in Ga language`
      : "The requested story page could not be found",
  }
}
