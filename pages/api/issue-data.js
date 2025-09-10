import { getIssueData } from '../../lib/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { filters } = req.query;

  try {
    const data = await getIssueData();
    
    if (data.success) {
      let filteredData = data.data;
      
      // Apply filters if provided
      if (filters) {
        const filterObj = JSON.parse(filters);
        filteredData = applyFilters(data.data, filterObj);
      }
      
      // Recalculate summary and analytics for filtered data
      const summary = calculateSummary(filteredData);
      const analytics = generateAnalytics(filteredData);
      
      res.status(200).json({
        ...data,
        data: filteredData,
        summary,
        analytics
      });
    } else {
      res.status(500).json(data);
    }
  } catch (error) {
    console.error('Issue API Error:', error);
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
}

function applyFilters(data, filters) {
  return data.filter(issue => {
    // Search filter
    if (filters.search && !Object.values(issue).some(value => 
      value.toString().toLowerCase().includes(filters.search.toLowerCase()))) {
      return false;
    }
    
    // City filter
    if (filters.city && filters.city !== 'All' && issue.City !== filters.city) {
      return false;
    }
    
    // Client filter
    if (filters.client && filters.client !== 'All' && issue.Client !== filters.client) {
      return false;
    }
    
    // Assignee filter
    if (filters.assignedTo && filters.assignedTo !== 'All' && issue['Assigned To'] !== filters.assignedTo) {
      return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'All') {
      const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
      const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
      
      switch (filters.status) {
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
    
    // Vehicle filter
    if (filters.vehicle && filters.vehicle !== 'All') {
      const vehicle = issue['Vehicle Number'] || '';
      if (!vehicle.toLowerCase().includes(filters.vehicle.toLowerCase())) return false;
    }
    
    // Month filter
    if (filters.month && filters.month !== 'All') {
      const timestampStr = (issue['Timestamp Issues Raised'] || '').toString().trim();
      if (timestampStr) {
        const issueDate = parseDate(timestampStr);
        if (issueDate && !isNaN(issueDate.getTime())) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          const issueMonth = monthNames[issueDate.getMonth()];
          if (issueMonth !== filters.month) return false;
        }
      }
    }
    
    return true;
  });
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]); // DD/MM/YYYY
    }
  } else if (dateStr.includes('-')) {
    return new Date(dateStr);
  }
  return new Date(dateStr);
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
