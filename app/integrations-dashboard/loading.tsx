export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading integrations dashboard...</p>
      </div>
    </div>
  )
}
