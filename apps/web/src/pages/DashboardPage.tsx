export function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">OPSLY</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Applications</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Resources</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Providers</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
