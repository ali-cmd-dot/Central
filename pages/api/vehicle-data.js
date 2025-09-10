import { getVehicleData } from '../../lib/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting vehicle data fetch...');
    
    // Check environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing environment variables');
      return res.status(500).json({
        success: false,
        error: 'Google Sheets credentials not configured'
      });
    }

    console.log('Environment variables found, fetching data...');
    const data = await getVehicleData();
    
    if (data.success) {
      console.log('Data fetched successfully');
      // Calculate KPIs
      const kpis = calculateKPIs(data.data);
      
      // Get chart data
      const chartData = getChartData(data.data);
      
      res.status(200).json({
        ...data,
        kpis,
        chartData
      });
    } else {
      console.error('Data fetch failed:', data.error);
      res.status(500).json(data);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

function calculateKPIs(allData) {
  const kpis = {
    totalVehicles: 0,
    totalClients: 0,
    offline24hrs: 0,
    offline5days: 0,
    offline10days: 0,
    misaligned: 0,
    onlineButShowingOffline: 0,
    soldVehiclesPending: 0,
    unresolvedIssues20days: 0
  };

  try {
    // Count vehicles in each category
    kpis.offline24hrs = allData['24+ hours offline vehicles']?.data?.length || 0;
    kpis.offline5days = allData['5+ days offline vehicles']?.data?.length || 0;
    kpis.offline10days = allData['10+ days offline vehicles']?.data?.length || 0;
    kpis.onlineButShowingOffline = allData['Online but Showing Offline']?.data?.length || 0;
    kpis.soldVehiclesPending = allData['Sold Vehicles - Camera Pending']?.data?.length || 0;
    kpis.unresolvedIssues20days = allData['Unresolved Issues (20+ days)']?.data?.length || 0;

    // Calculate unique vehicles and clients
    const uniqueVehicles = new Set();
    const uniqueClients = new Set();
    
    for (const [sheetName, sheetData] of Object.entries(allData)) {
      const data = sheetData.data || [];
      data.forEach(row => {
        // Vehicle Number column mapping
        let vehicleNumber = '';
        if (sheetName === 'Camera Misaligned') {
          vehicleNumber = row['Vehicle No'] || '';
        } else {
          vehicleNumber = row['Vehicle Number'] || '';
        }
        
        if (vehicleNumber && vehicleNumber.toString().trim() !== '') {
          uniqueVehicles.add(vehicleNumber.toString().trim());
        }
        
        // Client name column mapping
        let clientName = '';
        if (sheetName === 'Camera Misaligned') {
          clientName = row['Client Name'] || '';
        } else {
          clientName = row['Client'] || '';
        }
        
        if (clientName && clientName.toString().trim() !== '') {
          uniqueClients.add(clientName.toString().trim());
        }
      });
    }

    kpis.totalVehicles = uniqueVehicles.size;
    kpis.totalClients = uniqueClients.size;

  } catch (error) {
    console.error('Error calculating KPIs:', error);
  }

  return kpis;
}

function getChartData(allData) {
  const chartData = {
    offlineByTime: {
      labels: ['24+ Hours', '5+ Days', '10+ Days'],
      data: [
        allData['24+ hours offline vehicles']?.data?.length || 0,
        allData['5+ days offline vehicles']?.data?.length || 0,
        allData['10+ days offline vehicles']?.data?.length || 0
      ]
    },
    cameraStatus: {
      labels: ['Online but Offline', 'Total Offline', 'Misaligned'],
      data: [
        allData['Online but Showing Offline']?.data?.length || 0,
        (allData['24+ hours offline vehicles']?.data?.length || 0) + 
        (allData['5+ days offline vehicles']?.data?.length || 0) + 
        (allData['10+ days offline vehicles']?.data?.length || 0),
        0 // Misaligned will be handled separately
      ]
    },
    soldVehicles: {
      labels: ['Camera Pending', 'Estimated Completed'],
      data: [
        allData['Sold Vehicles - Camera Pending']?.data?.length || 0,
        Math.max(0, (allData['Sold Vehicles - Camera Pending']?.data?.length || 0) * 0.3)
      ]
    },
    issuesTimeline: {
      labels: ['Resolved', 'Unresolved'],
      data: (() => {
        const unresolvedIssues = allData['Unresolved Issues (20+ days)']?.data || [];
        let resolvedCount = 0;
        let unresolvedCount = 0;
        
        unresolvedIssues.forEach(row => {
          const resolved = (row['Resolved Y/N'] || '').toString().toLowerCase();
          if (resolved.includes('y') || resolved.includes('yes') || resolved === '1') {
            resolvedCount++;
          } else {
            unresolvedCount++;
          }
        });
        
        return [resolvedCount, unresolvedCount];
      })()
    }
  };

  return chartData;
}
