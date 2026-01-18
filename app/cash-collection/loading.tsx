export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto" />
        <p className="text-gray-600">Loading cash collection...</p>
      </div>
    </div>
  )
}
