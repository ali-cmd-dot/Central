import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const [vehicleData, setVehicleData] = useState(null);
  const [cameraData, setCameraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicle data
      const vehicleResponse = await fetch('/api/vehicle-data');
      const vehicleResult = await vehicleResponse.json();
      
      // Fetch camera misaligned data
      const cameraResponse = await fetch('/api/camera-misaligned');
      const cameraResult = await cameraResponse.json();
      
      setVehicleData(vehicleResult);
      setCameraData(cameraResult);
      setLastUpdated(vehicleResult.lastUpdated || new Date().toLocaleString());
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = vehicleData?.kpis || {};
  const chartData = vehicleData?.chartData || {};

  return (
    <>
      <Head>
        <title>Vehicle Camera Dashboard</title>
        <meta name="description" content="Vehicle Camera Issue Tracker Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <svg className="w-8 h-8 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z"/>
                  </svg>
                  Vehicle Camera Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last Updated: {lastUpdated}
                </div>
                <button 
                  onClick={fetchAllData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Vehicles */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 11L6.5 6.5H17.5L19 11M12 4H8L6.5 6.5M16 4H20L17.5 6.5M12 13.5C13.38 13.5 14.5 12.38 14.5 11S13.38 8.5 12 8.5 9.5 9.62 9.5 11 10.62 13.5 12 13.5M12 15.5C16.42 15.5 20 16.58 20 18V20H4V18C4 16.58 7.58 15.5 12 15.5Z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Vehicles</dt>
                    <dd className="text-3xl font-bold text-gray-900">{kpis.totalVehicles || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Total Clients */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4M16 13C18.67 13 22 14.33 22 17V20H10V17C10 14.33 13.33 13 16 13M8 12C10.21 12 12 10.21 12 8S10.21 4 8 4 4 5.79 4 8 5.79 12 8 12M8 13C5.33 13 0 14.33 0 17V20H8V17C8 15.77 8.36 14.64 9.03 13.72C8.7 13.66 8.36 13.64 8 13.64Z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                    <dd className="text-3xl font-bold text-gray-900">{kpis.totalClients || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Combined Offline Vehicles - Single Card with Click to Page */}
            <Link href="/offline-vehicles">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H21M7 10C5.89 10 5 10.89 5 12V22H7V19H17V22H19V12C19 10.89 18.11 10 17 10H7Z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Offline Vehicles</dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {(kpis.offline24hrs || 0) + (kpis.offline5days || 0) + (kpis.offline10days || 0)}
                      </dd>
                      <dt className="text-xs text-gray-400">Click to view details →</dt>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            {/* Camera Misaligned */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4H20C21.11 4 22 4.89 22 6V18C22 19.11 21.11 20 20 20H4C2.89 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4M4 6V18H20V6H4M6 8H8V10H6V8M6 12H8V14H6V12M10 8H18V10H10V8M10 12H16V14H10V12Z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Camera Misaligned</dt>
                    <dd className="text-3xl font-bold text-gray-900">{cameraData?.data?.length || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Online but Showing Offline */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 9L9 5L17 9L23 6V8L17 11L9 7L1 11V9M23 16V18L17 21L9 17L1 21V19L9 15L17 19L23 16Z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Online but Showing Offline</dt>
                    <dd className="text-3xl font-bold text-gray-900">{kpis.onlineButShowingOffline || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Sold Vehicles - Camera Pending */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 18C5.9 18 5 18.9 5 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18M1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5H18.7L15.55 11H8.53L4.27 2H1M17 18C15.9 18 15 18.9 15 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sold Vehicles - Camera Pending</dt>
                    <dd className="text-3xl font-bold text-gray-900">{kpis.soldVehiclesPending || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Unresolved Issues 20+ Days - Click to Issue Tracker */}
            <Link href="/issue-tracker">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M13 17H11V15H13V17M13 13H11V7H13V13Z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Unresolved Issues (20+ days)</dt>
                      <dd className="text-3xl font-bold text-gray-900">{kpis.unresolvedIssues20days || 0}</dd>
                      <dt className="text-xs text-gray-400">Click to view issue tracker →</dt>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Offline Vehicles by Duration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Offline Vehicles by Duration</h3>
              <div className="h-64">
                {chartData.offlineByTime && (
                  <Bar
                    data={{
                      labels: chartData.offlineByTime.labels,
                      datasets: [{
                        label: 'Offline Vehicles',
                        data: chartData.offlineByTime.data,
                        backgroundColor: ['#fbbf24', '#f87171', '#dc2626'],
                        borderColor: ['#f59e0b', '#ef4444', '#b91c1c'],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.parsed.y} vehicles`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { stepSize: 1 }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Camera Status Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Camera Status Distribution</h3>
              <div className="h-64">
                {chartData.cameraStatus && (
                  <Doughnut
                    data={{
                      labels: ['Online but Offline', 'Total Offline', 'Camera Misaligned'],
                      datasets: [{
                        data: [
                          chartData.cameraStatus.data[0],
                          chartData.cameraStatus.data[1],
                          cameraData?.data?.length || 0
                        ],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                        borderColor: ['#059669', '#dc2626', '#d97706'],
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Camera Misaligned Table */}
          {cameraData?.data && cameraData.data.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Camera Misaligned Vehicles</h3>
                <p className="text-sm text-gray-500">Latest misalignment data grouped by client</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle Numbers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Latest Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age (Days)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cameraData.data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row['Client Name']}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row['Vehicle Count']} vehicles
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {row['Vehicle Numbers']}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row['Latest Date']}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            row['Age (Days)'] <= 7 ? 'bg-green-100 text-green-800' :
                            row['Age (Days)'] <= 30 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {row['Age (Days)']} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
