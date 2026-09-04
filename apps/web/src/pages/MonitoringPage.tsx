export function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">OPSLY</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Monitoring</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">Monitoring & Alerts</h1>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
              <div className="mt-4">
                <p className="text-sm text-gray-500">No active alerts</p>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h2 className="text-lg font-medium text-gray-900">Incidents</h2>
              <div className="mt-4">
                <p className="text-sm text-gray-500">No recent incidents</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
