// Utility functions for the Vehicle Camera Dashboard

/**
 * Parse date string in various formats (DD/MM/YYYY, MM/DD/YYYY, ISO)
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle different date formats
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      // Assume DD/MM/YYYY format (Indian format)
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  } else if (dateStr.includes('-')) {
    return new Date(dateStr);
  }
  
  return new Date(dateStr);
}

/**
 * Calculate age in days from a date string
 * @param {string} dateStr - Date string
 * @returns {number} - Age in days
 */
export function calculateAge(dateStr) {
  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return 0;
  
  const today = new Date();
  return Math.ceil((today - date) / (1000 * 60 * 60 * 24));
}

/**
 * Format number with Indian number system (Lakhs, Crores)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatIndianNumber(num) {
  if (num < 1000) return num.toString();
  if (num < 100000) return (num / 1000).toFixed(1) + 'K';
  if (num < 10000000) return (num / 100000).toFixed(1) + 'L';
  return (num / 10000000).toFixed(1) + 'Cr';
}

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 */
export function exportToCSV(data, filename = 'export') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = value.toString().replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue}"` 
          : stringValue;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get status badge class based on issue status
 * @param {Object} issue - Issue object
 * @returns {string} - CSS class name
 */
export function getStatusBadgeClass(issue) {
  const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
  const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
  
  if (resolved === 'yes' || resolved === 'y') {
    return 'bg-green-100 text-green-800 border-green-200';
  } else if ((resolved === 'no' || resolved === 'n') && followUpDate !== '') {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else {
    return 'bg-red-100 text-red-800 border-red-200';
  }
}

/**
 * Get status text based on issue status
 * @param {Object} issue - Issue object
 * @returns {string} - Status text
 */
export function getStatusText(issue) {
  const resolved = (issue['Resolved Y/N'] || '').toString().toLowerCase().trim();
  const followUpDate = (issue['Next Follow Up Date'] || '').toString().trim();
  
  if (resolved === 'yes' || resolved === 'y') {
    return 'Closed';
  } else if ((resolved === 'no' || resolved === 'n') && followUpDate !== '') {
    return 'On Hold';
  } else {
    return 'Open';
  }
}

/**
 * Get age badge class based on number of days
 * @param {number} days - Number of days
 * @returns {string} - CSS class name
 */
export function getAgeBadgeClass(days) {
  if (days <= 7) {
    return 'bg-green-100 text-green-800 border-green-200';
  } else if (days <= 30) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else {
    return 'bg-red-100 text-red-800 border-red-200';
  }
}

/**
 * Format date to Indian locale
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDateToIndian(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

/**
 * Format date and time to Indian locale
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date and time string
 */
export function formatDateTimeToIndian(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get unique values from array of objects by key
 * @param {Array} array - Array of objects
 * @param {string} key - Key to extract values from
 * @returns {Array} - Array of unique values
 */
export function getUniqueValues(array, key) {
  if (!array || !Array.isArray(array)) return [];
  
  return [...new Set(array.map(item => item[key]).filter(value => value && value !== ''))].sort();
}

/**
 * Filter array of objects by search term
 * @param {Array} array - Array to filter
 * @param {string} searchTerm - Search term
 * @returns {Array} - Filtered array
 */
export function filterBySearch(array, searchTerm) {
  if (!searchTerm || !Array.isArray(array)) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => 
    Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(term)
    )
  );
}

/**
 * Sort array of objects by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} - Sorted array
 */
export function sortByKey(array, key, direction = 'asc') {
  if (!Array.isArray(array)) return array;
  
  return [...array].sort((a, b) => {
    const aValue = a[key] || '';
    const bValue = b[key] || '';
    
    // Try to parse as numbers first
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // Fall back to string comparison
    const aStr = aValue.toString().toLowerCase();
    const bStr = bValue.toString().toLowerCase();
    
    if (direction === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

/**
 * Show toast notification (requires a toast library or custom implementation)
 * @param {string} message - Message to show
 * @param {string} type - Type of notification ('success', 'error', 'warning', 'info')
 */
export function showNotification(message, type = 'info') {
  // This is a placeholder - implement with your preferred toast library
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // For now, use browser alert for important messages
  if (type === 'error') {
    alert(`Error: ${message}`);
  }
}

/**
 * Check if the application is running in development mode
 * @returns {boolean} - True if in development mode
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Generate chart colors for data visualization
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color strings
 */
export function generateChartColors(count) {
  const baseColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

/**
 * Format large numbers with suffixes (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatLargeNumber(num) {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
}
