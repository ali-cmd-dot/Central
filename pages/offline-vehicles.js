import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function OfflineVehicles() {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('24+ hours offline vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const tabs = [
    { id: '24+ hours offline vehicles', label: '24+ Hours Offline', color: 'yellow' },
    { id: '5+ days offline vehicles', label: '5+ Days Offline', color: 'orange' },
    { id: '10+ days offline vehicles', label: '10+ Days Offline', color: 'red' }
  ];

  useEffect(() => {
    fetchVehicleData();
  }, []);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicle-data');
      const result = await response.json();
      
      setVehicleData(result);
      setLastUpdated(result.lastUpdated || new Date().toLocaleString());
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTabData = () => {
    if (!vehicleData?.data) return [];
    return vehicleData.data[activeTab]?.data || [];
  };

  const getFilteredData = () => {
    const data = getCurrentTabData();
    if (!searchTerm) return data;
    
    return data.filter(vehicle => 
      Object.values(vehicle).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const exportToCSV = () => {
    const data = getFilteredData();
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offline vehicles data...</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <>
      <Head>
        <title>Offline Vehicles - Vehicle Camera Dashboard</title>
        <meta name="description" content="Offline Vehicles Analysis" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Offline Vehicles Analysis</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last Updated: {lastUpdated}
                </div>
                <button 
                  onClick={fetchVehicleData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const count = vehicleData?.data?.[tab.id]?.data?.length || 0;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-600`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      tab.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      tab.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {count}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Showing {filteredData.length} vehicles
              </span>
              <button
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className={`bg-white rounded-lg shadow p-6 mb-6 border-l-4 ${
            currentTab?.color === 'yellow' ? 'border-yellow-500' :
            currentTab?.color === 'orange' ? 'border-orange-500' :
            'border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentTab?.label}</h2>
                <p className="text-3xl font-bold text-gray-900 mt-2">{filteredData.length}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {searchTerm ? `Filtered results for "${searchTerm}"` : 'Total vehicles in this category'}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                currentTab?.color === 'yellow' ? 'bg-yellow-100' :
                currentTab?.color === 'orange' ? 'bg-orange-100' :
                'bg-red-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  currentTab?.color === 'yellow' ? 'text-yellow-600' :
                  currentTab?.color === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H21M7 10C5.89 10 5 10.89 5 12V22H7V19H17V22H19V12C19 10.89 18.11 10 17 10H7Z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {filteredData.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {vehicleData?.data?.[activeTab]?.headers?.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      )) || []}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((vehicle, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {vehicleData?.data?.[activeTab]?.headers?.map((header, headerIndex) => (
                          <td key={headerIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {header === 'Offline Since (hrs)' && vehicle[header] ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                parseFloat(vehicle[header]) >= 240 ? 'bg-red-100 text-red-800' :
                                parseFloat(vehicle[header]) >= 120 ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {vehicle[header]} hrs
                              </span>
                            ) : header === 'Vehicle Number' ? (
                              <span className="font-medium text-blue-600">{vehicle[header]}</span>
                            ) : header === 'Client' ? (
                              <span className="font-medium">{vehicle[header]}</span>
                            ) : (
                              vehicle[header] || '-'
                            )}
                          </td>
                        )) || []}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
              <p className="text-gray-500">
                {searchTerm ? `No vehicles match your search for "${searchTerm}"` : 'No offline vehicles in this category'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
