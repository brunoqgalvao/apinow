export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          ApiNow
        </h1>
        <p className="text-2xl text-gray-700 mb-4">
          APIs for the Agent Economy
        </p>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A unified API gateway that lets AI agents discover and integrate thousands of APIs with a single key.
          No more managing credentials, handling auth flows, or dealing with inconsistent errors.
        </p>
        <div className="mt-12 flex gap-4 justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 Discover</h3>
            <p className="text-gray-600 text-sm">Natural language API search powered by embeddings</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔑 Authenticate</h3>
            <p className="text-gray-600 text-sm">One API key to rule them all - we handle the rest</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Monitor</h3>
            <p className="text-gray-600 text-sm">Track usage, costs, and performance in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
