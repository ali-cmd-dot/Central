import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function IssueTracker() {
  const [issueData, setIssueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('all');
  const [currentFilters, setCurrentFilters] = useState({
    search: '',
    city: 'All',
    client: 'All',
    assignedTo: 'All',
    status: 'All',
    vehicle: 'All',
    month: 'All'
  });
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const views = [
    { id: 'all', label: 'All Issues', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'client-summary', label: 'Client Summary', icon: '👥' },
    { id: 'assignee-summary', label: 'Assignee Summary', icon: '👤' }
  ];

  useEffect(() => {
    fetchIssueData();
  }, []);

  useEffect(() => {
    if (issueData?.data) {
      applyFilters();
    }
  }, [issueData, currentFilters]);

  const fetchIssueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/issue-data');
      const result = await response.json();
      
      if (result.success) {
        setIssueData(result);
        setFilteredIssues(result.data);
      }
    } catch (error) {
      console.error('Error fetching issue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!issueData?.data) return;
    
    let filtered = issueData.data.filter(issue => {
      // Search filter
      if (currentFilters.search && !Object.values(issue).some(value => 
        value.toString().toLowerCase().includes(currentFilters.search.toLowerCase()))) {
        return false;
      }
      
      // Other filters
      if (currentFilters.city !== 'All' && issue.City !== currentFilters.city) return false;
      if (currentFilters.client !== 'All' && issue.Client !== currentFilters.client) return false;
      if (currentFilters.assignedTo !== 'All' && issue['Assigned To'] !== currentFilters.assignedTo) return false;
      
      // Status filter
      if (currentFilters.status !== 'All') {
        const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
        const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
        
        switch (currentFilters.status) {
          case 'Open':
            if ((resolved === 'yes' || resolved === 'y') || followUpDate !== '') return false;
            break;
          case 'Closed':
            if (resolved !== 'yes' && resolved !== 'y') return false;
            break;
          case 'On Hold':
            if ((resolved !== 'no' && resolved !== 'n') || followUpDate === '') return false;
            break;
        }
      }
      
      return true;
    });
    
    setFilteredIssues(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterKey, value) => {
    setCurrentFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const resetFilters = () => {
    setCurrentFilters({
      search: '',
      city: 'All',
      client: 'All',
      assignedTo: 'All',
      status: 'All',
      vehicle: 'All',
      month: 'All'
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sorted = [...filteredIssues].sort((a, b) => {
      const aValue = a[key] || '';
      const bValue = b[key] || '';
      
      if (direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
    
    setFilteredIssues(sorted);
  };

  const exportToCSV = () => {
    const data = filteredIssues;
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
    a.download = `issues_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getUniqueValues = (key) => {
    if (!issueData?.data) return [];
    return [...new Set(issueData.data.map(issue => issue[key]).filter(value => value))].sort();
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    return new Date(dateStr);
  };

  const getIssueAge = (timestamp) => {
    const issueDate = parseDate(timestamp);
    if (!issueDate) return 0;
    return Math.ceil((new Date() - issueDate) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (issue) => {
    const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
    const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
    
    if (resolved === 'yes' || resolved === 'y') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Closed</span>;
    } else if ((resolved === 'no' || resolved === 'n') && followUpDate !== '') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">On Hold</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Open</span>;
    }
  };

  const getAgeBadge = (age) => {
    if (age <= 7) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{age} days</span>;
    } else if (age <= 30) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{age} days</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{age} days</span>;
    }
  };

  const renderClientSummary = () => {
    const clientSummary = issueData?.analytics?.clientSummary || {};
    const sortedClients = Object.entries(clientSummary)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 20);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Clients by Issue Count</h3>
          <div className="h-96">
            <Bar
              data={{
                labels: sortedClients.map(([client]) => client.length > 15 ? client.substring(0, 15) + '...' : client),
                datasets: [{
                  label: 'Open',
                  data: sortedClients.map(([, data]) => data.open),
                  backgroundColor: '#ef4444',
                }, {
                  label: 'Closed',
                  data: sortedClients.map(([, data]) => data.closed),
                  backgroundColor: '#10b981',
                }, {
                  label: 'On Hold',
                  data: sortedClients.map(([, data]) => data.onHold),
                  backgroundColor: '#f59e0b',
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: true },
                  y: { stacked: true, beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Client-wise Issue Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Hold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedClients.map(([client, data]) => {
                  const resolutionRate = data.total > 0 ? ((data.closed / data.total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={client} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{data.open}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{data.closed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{data.onHold}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resolutionRate}%` }}></div>
                          </div>
                          <span>{resolutionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAssigneeSummary = () => {
    const assigneeSummary = issueData?.analytics?.assigneeSummary || {};
    const sortedAssignees = Object.entries(assigneeSummary)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 15);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assignee Workload Distribution</h3>
          <div className="h-96">
            <Bar
              data={{
                labels: sortedAssignees.map(([assignee]) => assignee.length > 12 ? assignee.substring(0, 12) + '...' : assignee),
                datasets: [{
                  label: 'Open',
                  data: sortedAssignees.map(([, data]) => data.open),
                  backgroundColor: '#ef4444',
                }, {
                  label: 'Closed',
                  data: sortedAssignees.map(([, data]) => data.closed),
                  backgroundColor: '#10b981',
                }, {
                  label: 'On Hold',
                  data: sortedAssignees.map(([, data]) => data.onHold),
                  backgroundColor: '#f59e0b',
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { 
                    stacked: true,
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  },
                  y: { stacked: true, beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Assignee Performance Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Hold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workload Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAssignees.map(([assignee, data]) => {
                  const completionRate = data.total > 0 ? ((data.closed / data.total) * 100).toFixed(1) : 0;
                  const workloadStatus = data.total > 20 ? 'High' : data.total > 10 ? 'Medium' : 'Low';
                  const statusColor = workloadStatus === 'High' ? 'text-red-600' : 
                                    workloadStatus === 'Medium' ? 'text-yellow-600' : 'text-green-600';
                  
                  return (
                    <tr key={assignee} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{data.open}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{data.closed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{data.onHold}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
                          </div>
                          <span>{completionRate}%</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${statusColor}`}>
                        {workloadStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const monthlyData = issueData?.analytics?.monthlyData || {};
    const monthsWithData = Object.keys(monthlyData).filter(month => monthlyData[month].total > 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trend</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: monthsWithData,
                  datasets: [{
                    label: 'Total Issues',
                    data: monthsWithData.map(month => monthlyData[month].total),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['Open', 'Closed', 'On Hold'],
                  datasets: [{
                    data: [
                      issueData?.summary?.openCount || 0,
                      issueData?.summary?.closedCount || 0,
                      issueData?.summary?.onHoldCount || 0
                    ],
                    backgroundColor: ['#ef4444', '#10b981', '#f59e0b'],
                    borderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issue tracker...</p>
        </div>
      </div>
    );
  }

  const paginatedData = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

  return (
    <>
      <Head>
        <title>Issue Tracker - Vehicle Camera Dashboard</title>
        <meta name="description" content="Complete Issue Tracker Dashboard" />
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
                <h1 className="text-2xl font-bold text-gray-900">Issue Tracker</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Total Issues: {issueData?.summary?.totalIssues || 0}
                </div>
                <button 
                  onClick={fetchIssueData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📋</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Issues</p>
                  <p className="text-3xl font-bold text-gray-900">{issueData?.summary?.totalIssues || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">🔴</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Open Issues</p>
                  <p className="text-3xl font-bold text-gray-900">{issueData?.summary?.openCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Closed Issues</p>
                  <p className="text-3xl font-bold text-gray-900">{issueData?.summary?.closedCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">⏸️</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">On Hold</p>
                  <p className="text-3xl font-bold text-gray-900">{issueData?.summary?.onHoldCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeView === view.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{view.icon}</span>
                    {view.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeView === 'all' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={currentFilters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={currentFilters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>

                    <div>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={currentFilters.client}
                        onChange={(e) => handleFilterChange('client', e.target.value)}
                      >
                        <option value="All">All Clients</option>
                        {getUniqueValues('Client').map(client => (
                          <option key={client} value={client}>{client}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={currentFilters.assignedTo}
                        onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                      >
                        <option value="All">All Assignees</option>
                        {getUniqueValues('Assigned To').map(assignee => (
                          <option key={assignee} value={assignee}>{assignee}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={currentFilters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                      >
                        <option value="All">All Cities</option>
                        {getUniqueValues('City').map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={resetFilters}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Reset
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Results info */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-700">
                      Showing {paginatedData.length} of {filteredIssues.length} issues
                    </p>
                  </div>

                  {/* Issues Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('Issue ID')}
                          >
                            Issue ID
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('Client')}
                          >
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('Assigned To')}
                          >
                            Assigned To
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((issue, index) => {
                          const age = getIssueAge(issue['Timestamp Issues Raised']);
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {issue['Issue ID']}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {issue['Client']}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {issue['Issue'] || 'No description'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {issue['Vehicle Number'] || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {issue['Assigned To'] || 'Unassigned'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(issue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getAgeBadge(age)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, filteredIssues.length)}
                            </span>{' '}
                            of <span className="font-medium">{filteredIssues.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Previous
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'analytics' && renderAnalytics()}
              {activeView === 'client-summary' && renderClientSummary()}
              {activeView === 'assignee-summary' && renderAssigneeSummary()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
