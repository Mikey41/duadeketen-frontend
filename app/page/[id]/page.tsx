import { notFound } from "next/navigation"
import Link from "next/link"

interface PageData {
  pageNumber: number
  gaText: string
  qrCodeUrl: string
  audioUrl: string | null
}

async function fetchPageData(id: string): Promise<PageData | null> {
  try {
    console.log("[v0] Fetching page data for ID:", id)
    const response = await fetch(`https://duadeketen-stories.onrender.com/api/stories/page/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      if (response.status === 404) {
        console.log("[v0] Page not found")
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Received page data:", data)

    return data
  } catch (error) {
    console.error("[v0] Error fetching page data:", error)
    return null
  }
}

export default async function PageRoute({
  params,
}: {
  params: { id: string }
}) {
  console.log("[v0] Page route called with ID:", params.id)

  const pageData = await fetchPageData(params.id)

  if (!pageData) {
    console.log("[v0] No page data, showing not found")
    notFound()
  }

  console.log("[v0] Rendering page with data:", pageData)

  const pageNumber = pageData.pageNumber
  const prevPage = pageNumber > 1 ? pageNumber - 1 : null
  const nextPage = pageNumber + 1

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Simple Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Scanner
          </Link>
          <h1 className="text-3xl font-bold mt-4">Page {pageData.pageNumber}</h1>
        </div>

        {/* Simple Content Display */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Story Content:</h2>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{pageData.gaText}</p>
        </div>

        {/* Audio Player */}
        {pageData.audioUrl && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Audio:</h2>
            <audio controls className="w-full">
              <source src={pageData.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-yellow-50 p-4 rounded border">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-sm">{JSON.stringify(pageData, null, 2)}</pre>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          {prevPage && (
            <Link href={`/page/${prevPage}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              ← Page {prevPage}
            </Link>
          )}

          <Link href={`/page/${nextPage}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Page {nextPage} →
          </Link>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const pageData = await fetchPageData(params.id)

  if (!pageData) {
    return {
      title: "Page Not Found",
      description: "The requested story page could not be found.",
    }
  }

  return {
    title: `Ga Story - Page ${pageData.pageNumber}`,
    description: `Read Ga language story page ${pageData.pageNumber} with audio support.`,
  }
}
