import { GoogleSpreadsheet } from 'google-spreadsheet';

// Google Sheets Configuration
const VEHICLE_SPREADSHEET_ID = '1tZDbCefO-xSwdYc2zry0eOpLtZrOw1FM3KZPHtpKRU0';
const CAMERA_MISALIGNED_SPREADSHEET_ID = '1GPDqOSURZNALalPzfHNbMft0HQ1c_fIkgfu_V3fSroY';
const ISSUES_SPREADSHEET_ID = '1oHapc5HADod_2zPi0l1r8Ef2PjQlb4pfe-p9cKZFB2I';

// Create service account from environment variables
const serviceAccountAuth = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

export async function getVehicleData() {
  try {
    const doc = new GoogleSpreadsheet(VEHICLE_SPREADSHEET_ID);
    await doc.useServiceAccountAuth(serviceAccountAuth);
    await doc.loadInfo();

    const data = {};
    
    // Expected sheet names
    const expectedSheets = [
      '24+ hours offline vehicles',
      '5+ days offline vehicles', 
      '10+ days offline vehicles',
      'Online but Showing Offline',
      'Sold Vehicles - Camera Pending',
      'Unresolved Issues (20+ days)'
    ];
    
    for (const sheetName of expectedSheets) {
      try {
        const sheet = doc.sheetsByTitle[sheetName];
        if (sheet) {
          await sheet.loadHeaderRow();
          const rows = await sheet.getRows();
          
          data[sheetName] = {
            headers: sheet.headerValues,
            data: rows.map(row => {
              const obj = {};
              sheet.headerValues.forEach(header => {
                obj[header] = row.get(header) || '';
              });
              return obj;
            }).filter(row => 
              Object.values(row).some(value => value !== null && value !== undefined && value !== '')
            )
          };
        }
      } catch (sheetError) {
        console.error(`Error processing sheet ${sheetName}:`, sheetError);
        data[sheetName] = { headers: [], data: [] };
      }
    }
    
    return {
      success: true,
      data: data,
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    return {
      success: false,
      error: error.toString(),
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      })
    };
  }
}

export async function getCameraMisalignedData() {
  try {
    const doc = new GoogleSpreadsheet(CAMERA_MISALIGNED_SPREADSHEET_ID);
    await doc.useServiceAccountAuth(serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Misalignment_Tracking'];
    if (!sheet) {
      throw new Error('Misalignment_Tracking sheet not found');
    }

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    // Group vehicles by client and get latest date
    const clientGroups = {};
    
    rows.forEach(row => {
      const date = row.get('Date') || '';
      const clientName = row.get('Client Name') || '';
      const vehicleNumbers = row.get('Vehicle Numbers') || '';
      
      if (clientName && vehicleNumbers && date) {
        if (!clientGroups[clientName]) {
          clientGroups[clientName] = {
            vehicles: [],
            latestDate: new Date(date),
            dateString: date
          };
        }
        
        // Check if this is a more recent date
        const currentDate = new Date(date);
        if (currentDate > clientGroups[clientName].latestDate) {
          clientGroups[clientName].latestDate = currentDate;
          clientGroups[clientName].dateString = date;
        }
        
        // Split vehicle numbers by comma and add to array
        const vehicles = vehicleNumbers.split(',').map(v => v.trim()).filter(v => v);
        clientGroups[clientName].vehicles = [...new Set([...clientGroups[clientName].vehicles, ...vehicles])];
      }
    });
    
    // Convert to array format with age calculation
    const processedData = Object.entries(clientGroups).map(([clientName, data]) => {
      const ageInDays = Math.floor((new Date() - data.latestDate) / (1000 * 60 * 60 * 24));
      
      return {
        'Client Name': clientName,
        'Vehicle Numbers': data.vehicles.join(', '),
        'Latest Date': data.dateString,
        'Age (Days)': ageInDays,
        'Vehicle Count': data.vehicles.length
      };
    }).sort((a, b) => a['Client Name'].localeCompare(b['Client Name']));
    
    return {
      success: true,
      data: processedData,
      headers: ['Client Name', 'Vehicle Numbers', 'Latest Date', 'Age (Days)', 'Vehicle Count'],
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      })
    };
    
  } catch (error) {
    console.error('Error fetching camera misaligned data:', error);
    return {
      success: false,
      error: error.toString(),
      data: [],
      headers: []
    };
  }
}

export async function getIssueData() {
  try {
    const doc = new GoogleSpreadsheet(ISSUES_SPREADSHEET_ID);
    await doc.useServiceAccountAuth(serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Issues- Realtime'];
    if (!sheet) {
      throw new Error('Issues- Realtime sheet not found');
    }

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    // Process issues data with client filtering
    const processedIssues = rows.map(row => {
      const issue = {};
      sheet.headerValues.forEach(header => {
        issue[header] = row.get(header) || '';
      });
      return issue;
    }).filter(issue => {
      const client = (issue['Client'] || '').toString().trim();
      return client !== '' && client !== 'undefined' && client !== 'null' && client.length > 1;
    });
    
    // Calculate summary
    const summary = calculateSummary(processedIssues);
    
    // Generate analytics
    const analytics = generateAnalytics(processedIssues);
    
    return {
      success: true,
      data: processedIssues,
      headers: sheet.headerValues,
      summary: summary,
      analytics: analytics,
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      })
    };
    
  } catch (error) {
    console.error('Error fetching issue data:', error);
    return {
      success: false,
      error: error.toString(),
      data: [],
      headers: []
    };
  }
}

function calculateSummary(issues) {
  let totalIssues = issues.length;
  let openCount = 0;
  let closedCount = 0;
  let onHoldCount = 0;
  
  issues.forEach(issue => {
    const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
    const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
    
    if (resolved === 'yes' || resolved === 'y') {
      closedCount++;
    } else if ((resolved === 'no' || resolved === 'n') && followUpDate !== '') {
      onHoldCount++;
    } else {
      openCount++;
    }
  });
  
  return {
    totalIssues,
    openCount,
    closedCount,
    onHoldCount
  };
}

function generateAnalytics(issues) {
  // Client-wise summary
  const clientSummary = {};
  
  // Assigned-to summary
  const assigneeSummary = {};
  
  // Monthly data
  const monthlyData = {};
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  monthNames.forEach(month => {
    monthlyData[month] = { open: 0, closed: 0, onHold: 0, total: 0 };
  });
  
  issues.forEach(issue => {
    const client = issue['Client'] || 'Unknown';
    const assignee = issue['Assigned To'] || 'Unassigned';
    const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
    const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
    const timestampStr = (issue['Timestamp Issues Raised'] || '').toString().trim();
    
    // Client summary
    if (!clientSummary[client]) {
      clientSummary[client] = { open: 0, closed: 0, onHold: 0, total: 0 };
    }
    clientSummary[client].total++;
    
    // Assignee summary
    if (!assigneeSummary[assignee]) {
      assigneeSummary[assignee] = { open: 0, closed: 0, onHold: 0, total: 0 };
    }
    assigneeSummary[assignee].total++;
    
    // Determine status
    let status = 'open';
    if (resolved === 'yes' || resolved === 'y') {
      status = 'closed';
      clientSummary[client].closed++;
      assigneeSummary[assignee].closed++;
    } else if ((resolved === 'no' || resolved === 'n') && followUpDate !== '') {
      status = 'onHold';
      clientSummary[client].onHold++;
      assigneeSummary[assignee].onHold++;
    } else {
      clientSummary[client].open++;
      assigneeSummary[assignee].open++;
    }
    
    // Monthly data
    if (timestampStr) {
      let issueDate = null;
      if (timestampStr.includes('/')) {
        const parts = timestampStr.split('/');
        if (parts.length === 3) {
          issueDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        issueDate = new Date(timestampStr);
      }
      
      if (issueDate && !isNaN(issueDate.getTime())) {
        const month = monthNames[issueDate.getMonth()];
        if (monthlyData[month]) {
          monthlyData[month].total++;
          if (status === 'closed') {
            monthlyData[month].closed++;
          } else if (status === 'onHold') {
            monthlyData[month].onHold++;
          } else {
            monthlyData[month].open++;
          }
        }
      }
    }
  });
  
  return {
    clientSummary,
    assigneeSummary,
    monthlyData
  };
}
