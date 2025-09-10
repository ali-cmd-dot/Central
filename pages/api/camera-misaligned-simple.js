// Simple fallback API for camera misaligned data
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock camera misaligned data
    const mockCameraData = {
      success: true,
      data: [
        {
          'Client Name': 'Demo Client 1',
          'Vehicle Numbers': 'DM001, DM002, DM003',
          'Latest Date': '08/09/2025',
          'Age (Days)': 2,
          'Vehicle Count': 3
        },
        {
          'Client Name': 'Demo Client 2', 
          'Vehicle Numbers': 'DM004, DM005',
          'Latest Date': '05/09/2025',
          'Age (Days)': 5,
          'Vehicle Count': 2
        },
        {
          'Client Name': 'Demo Client 3',
          'Vehicle Numbers': 'DM006',
          'Latest Date': '01/09/2025', 
          'Age (Days)': 9,
          'Vehicle Count': 1
        }
      ],
      headers: ['Client Name', 'Vehicle Numbers', 'Latest Date', 'Age (Days)', 'Vehicle Count'],
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      })
    };

    res.status(200).json(mockCameraData);
    
  } catch (error) {
    console.error('Camera API Error:', error);
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
}
