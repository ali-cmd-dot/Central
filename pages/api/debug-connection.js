import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  const debug = {
    step: '',
    error: null,
    success: false,
    details: {}
  };

  try {
    debug.step = 'Checking environment variables';
    
    // Check environment variables
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    debug.details.hasEmail = !!email;
    debug.details.hasPrivateKey = !!privateKey;
    debug.details.emailValue = email ? email.substring(0, 20) + '...' : 'Not found';
    debug.details.privateKeyLength = privateKey ? privateKey.length : 0;
    
    if (!email || !privateKey) {
      debug.error = 'Missing environment variables';
      return res.status(500).json(debug);
    }

    debug.step = 'Testing Google Sheets connection';
    
    // Test with the main vehicle spreadsheet
    const VEHICLE_SPREADSHEET_ID = '1tZDbCefO-xSwdYc2zry0eOpLtZrOw1FM3KZPHtpKRU0';
    
    const doc = new GoogleSpreadsheet(VEHICLE_SPREADSHEET_ID);
    
    debug.step = 'Authenticating with Google';
    
    // Create service account auth
    const serviceAccountAuth = {
      client_email: email,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
    
    debug.details.authConfig = {
      client_email: serviceAccountAuth.client_email,
      private_key_preview: serviceAccountAuth.private_key.substring(0, 50) + '...'
    };
    
    await doc.useServiceAccountAuth(serviceAccountAuth);
    
    debug.step = 'Loading spreadsheet info';
    await doc.loadInfo();
    
    debug.step = 'Getting sheet names';
    const sheetTitles = Object.keys(doc.sheetsByTitle);
    
    debug.details.spreadsheetTitle = doc.title;
    debug.details.sheetCount = sheetTitles.length;
    debug.details.availableSheets = sheetTitles;
    
    // Check if expected sheets exist
    const expectedSheets = [
      '24+ hours offline vehicles',
      '5+ days offline vehicles', 
      '10+ days offline vehicles',
      'Online but Showing Offline',
      'Sold Vehicles - Camera Pending',
      'Unresolved Issues (20+ days)'
    ];
    
    debug.details.expectedSheets = expectedSheets;
    debug.details.missingSheets = expectedSheets.filter(sheet => !sheetTitles.includes(sheet));
    
    // Try to read from one sheet
    debug.step = 'Testing data read from first available sheet';
    
    if (sheetTitles.length > 0) {
      const firstSheet = doc.sheetsByTitle[sheetTitles[0]];
      await firstSheet.loadHeaderRow();
      const rows = await firstSheet.getRows({ limit: 5 });
      
      debug.details.firstSheetName = sheetTitles[0];
      debug.details.firstSheetHeaders = firstSheet.headerValues;
      debug.details.firstSheetRowCount = rows.length;
      debug.details.sampleData = rows.map(row => {
        const obj = {};
        firstSheet.headerValues.forEach(header => {
          obj[header] = row.get(header);
        });
        return obj;
      });
    }
    
    debug.step = 'Success!';
    debug.success = true;
    
    return res.status(200).json({
      ...debug,
      message: 'Google Sheets connection successful!'
    });
    
  } catch (error) {
    debug.error = {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack,
      code: error.code
    };
    
    console.error('Debug API Error:', error);
    
    return res.status(500).json({
      ...debug,
      message: 'Connection failed at step: ' + debug.step
    });
  }
}
