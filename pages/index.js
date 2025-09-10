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
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try the main API
      let vehicleResponse;
      try {
        vehicleResponse = await fetch('/api/vehicle-data');
        if (!vehicleResponse.ok) {
          throw new Error(`HTTP ${vehicleResponse.status}`);
        }
      } catch (mainApiError) {
        console.log('Main API failed, trying simple API:', mainApiError);
        // Fallback to simple API
        vehicleResponse = await fetch('/api/vehicle-data-simple');
        setUsingMockData(true);
      }
      
      const vehicleResult = await vehicleResponse.json();
      
      // Try camera data (with fallback)
      let cameraResult = { success: true, data: [] };
      try {
        const cameraResponse = await fetch('/api/camera-misaligned');
        if (cameraResponse.ok) {
          cameraResult = await cameraResponse.json();
        }
      } catch (cameraError) {
        console.log('Camera API failed:', cameraError);
        // Mock camera data
        cameraResult = {
          success: true,
          data: [
            {
              'Client Name': 'Test Client',
              'Vehicle Numbers': 'TEST001, TEST002',
              'Latest Date': '10/09/2025',
              'Age (Days)': 5,
              'Vehicle Count': 2
            }
          ]
        };
      }
      
      setVehicleData(vehicleResult);
      setCameraData(cameraResult);
      setLastUpdated(vehicleResult.lastUpdated || new Date().toLocaleString());
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      
      // Ultimate fallback - completely mock data
      const mockVehicleData = {
        success: true,
        data: {},
        kpis: {
          totalVehicles: 0,
          totalClients: 0,
          offline24hrs: 0,
          offline5days: 0,
          offline10days: 0,
          onlineButShowingOffline: 0,
          soldVehiclesPending: 0,
          unresolvedIssues20days: 0
        },
        chartData: {
          offlineByTime: { labels: ['24+ Hours', '5+ Days', '10+ Days'], data: [0, 0, 0] },
          cameraStatus: { labels: ['Online but Offline', 'Total Offline', 'Misaligned'], data: [0, 0, 0] }
        }
      };
      
      setVehicleData(mockVehicleData);
      setCameraData({ success: true, data: [] });
      setUsingMockData(true);
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
                {usingMockData && (
                  <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Demo Mode
                  </span>
                )}
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

        {/* Error Banner */}
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Unable to connect to Google Sheets. Showing demo data. Please check your API configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

            {/* Combined Offline Vehicles */}
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
          </div>

          {/* Charts Section */}
          {chartData.offlineByTime && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Offline Vehicles by Duration */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Offline Vehicles by Duration</h3>
                <div className="h-64">
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
                </div>
              </div>

              {/* Camera Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Camera Status Distribution</h3>
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: ['Online but Offline', 'Total Offline', 'Camera Misaligned'],
                      datasets: [{
                        data: [
                          chartData.cameraStatus?.data[0] || 0,
                          chartData.cameraStatus?.data[1] || 0,
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
                </div>
              </div>
            </div>
          )}

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

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/offline-vehicles">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900 mb-2">View Offline Vehicles</h3>
                <p className="text-gray-500 text-sm">Detailed analysis of vehicles offline for different durations</p>
              </div>
            </Link>
            
            <Link href="/issue-tracker">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Issue Tracker</h3>
                <p className="text-gray-500 text-sm">Manage and track all vehicle-related issues</p>
              </div>
            </Link>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Status</h3>
              <p className="text-gray-500 text-sm">
                {usingMockData ? 'Demo Mode - API Configuration Needed' : 'Connected to Google Sheets'}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  usingMockData ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {usingMockData ? 'Demo' : 'Live'}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
