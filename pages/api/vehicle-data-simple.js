// Simple fallback API that returns mock data to get your app working
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock data for testing
    const mockData = {
      success: true,
      data: {
        '24+ hours offline vehicles': {
          headers: ['Vehicle Number', 'Client', 'Location', 'Offline Since (hrs)'],
          data: [
            { 'Vehicle Number': 'MH01AB1234', 'Client': 'Test Client 1', 'Location': 'Mumbai', 'Offline Since (hrs)': '25' },
            { 'Vehicle Number': 'DL02CD5678', 'Client': 'Test Client 2', 'Location': 'Delhi', 'Offline Since (hrs)': '30' }
          ]
        },
        '5+ days offline vehicles': {
          headers: ['Vehicle Number', 'Client', 'Location', 'Offline Since (hrs)'],
          data: [
            { 'Vehicle Number': 'KA03EF9012', 'Client': 'Test Client 3', 'Location': 'Bangalore', 'Offline Since (hrs)': '144' }
          ]
        },
        '10+ days offline vehicles': {
          headers: ['Vehicle Number', 'Client', 'Location', 'Offline Since (hrs)'],
          data: [
            { 'Vehicle Number': 'TN04GH3456', 'Client': 'Test Client 4', 'Location': 'Chennai', 'Offline Since (hrs)': '264' }
          ]
        },
        'Online but Showing Offline': {
          headers: ['Vehicle Number', 'Client', 'Location'],
          data: [
            { 'Vehicle Number': 'UP05IJ7890', 'Client': 'Test Client 5', 'Location': 'Lucknow' }
          ]
        },
        'Sold Vehicles - Camera Pending': {
          headers: ['Vehicle Number', 'Client', 'Status'],
          data: [
            { 'Vehicle Number': 'RJ06KL1234', 'Client': 'Test Client 6', 'Status': 'Camera Pending' }
          ]
        },
        'Unresolved Issues (20+ days)': {
          headers: ['Issue ID', 'Vehicle Number', 'Client', 'Issue', 'Resolved Y/N'],
          data: [
            { 'Issue ID': 'ISS001', 'Vehicle Number': 'GJ07MN5678', 'Client': 'Test Client 7', 'Issue': 'Camera not working', 'Resolved Y/N': 'N' }
          ]
        }
      },
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Calculate KPIs
    const kpis = {
      totalVehicles: 7,
      totalClients: 7,
      offline24hrs: mockData.data['24+ hours offline vehicles'].data.length,
      offline5days: mockData.data['5+ days offline vehicles'].data.length,
      offline10days: mockData.data['10+ days offline vehicles'].data.length,
      onlineButShowingOffline: mockData.data['Online but Showing Offline'].data.length,
      soldVehiclesPending: mockData.data['Sold Vehicles - Camera Pending'].data.length,
      unresolvedIssues20days: mockData.data['Unresolved Issues (20+ days)'].data.length
    };

    // Chart data
    const chartData = {
      offlineByTime: {
        labels: ['24+ Hours', '5+ Days', '10+ Days'],
        data: [kpis.offline24hrs, kpis.offline5days, kpis.offline10days]
      },
      cameraStatus: {
        labels: ['Online but Offline', 'Total Offline', 'Misaligned'],
        data: [kpis.onlineButShowingOffline, kpis.offline24hrs + kpis.offline5days + kpis.offline10days, 0]
      }
    };

    res.status(200).json({
      ...mockData,
      kpis,
      chartData
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
}
