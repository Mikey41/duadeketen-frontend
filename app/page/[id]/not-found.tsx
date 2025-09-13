import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-4xl font-bold text-amber-800 mb-2">Page Not Found</h1>
          <p className="text-amber-600 text-lg">The story page you're looking for doesn't exist.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to QR Scanner
          </Link>

          <div className="text-sm text-amber-600">
            <p>Try scanning a different QR code or check the page number.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
