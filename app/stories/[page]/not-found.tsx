export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">Story Not Found</h1>
        <p className="text-amber-700 mb-6">The requested story page could not be found.</p>
        <a href="/" className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
          Back to QR Scanner
        </a>
      </div>
    </div>
  )
}
