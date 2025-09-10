import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  try {
    console.log('Testing Google Sheets connection...');
    
    // Check environment variables
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!email || !privateKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasEmail: !!email,
          hasPrivateKey: !!privateKey
        }
      });
    }

    console.log('Environment variables found');
    console.log('Service Account Email:', email);
    
    // Test sheet ID (using the vehicle data sheet)
    const VEHICLE_SPREADSHEET_ID = '1tZDbCefO-xSwdYc2zry0eOpLtZrOw1FM3KZPHtpKRU0';
    
    const doc = new GoogleSpreadsheet(VEHICLE_SPREADSHEET_ID);
    
    // Try to authenticate
    console.log('Attempting authentication...');
    await doc.useServiceAccountAuth({
      client_email: email,
      private_key: privateKey.replace(/\\n/g, '\n'),
    });
    
    console.log('Authentication successful');
    
    // Try to load sheet info
    console.log('Loading sheet info...');
    await doc.loadInfo();
    
    console.log('Sheet info loaded successfully');
    console.log('Sheet title:', doc.title);
    
    // Get sheet names
    const sheetTitles = Object.keys(doc.sheetsByTitle);
    console.log('Available sheets:', sheetTitles);
    
    return res.status(200).json({
      success: true,
      message: 'Google Sheets connection successful',
      sheetTitle: doc.title,
      availableSheets: sheetTitles,
      sheetCount: sheetTitles.length
    });
    
  } catch (error) {
    console.error('Google Sheets test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack
    });
  }
}
