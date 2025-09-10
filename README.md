# Vehicle Camera Dashboard

A comprehensive Next.js dashboard for tracking vehicle camera issues, offline vehicles, and managing client data from Google Sheets.

## Features

- **Main Dashboard**: Overview of all vehicle and camera statistics
- **Offline Vehicles Analysis**: Detailed view with tabs for 24+ hours, 5+ days, and 10+ days offline vehicles
- **Camera Misaligned Tracking**: Client-wise grouping with latest dates and age calculation
- **Issue Tracker**: Complete issue management system with analytics, client summary, and assignee summary
- **Real-time Data**: Fetches data directly from Google Sheets
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Export Functionality**: CSV export for all data tables
- **Search & Filtering**: Advanced filtering options across all views

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Data Source**: Google Sheets API
- **Authentication**: Google Service Account
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vehicle-camera-dashboard.git
cd vehicle-camera-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Google Sheets API Setup

#### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

#### Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

#### Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format and click "Create"
5. Download the JSON file (keep it secure!)

#### Share Google Sheets with Service Account

1. Open each of your Google Sheets:
   - Vehicle Data Sheet
   - Camera Misaligned Sheet  
   - Issues Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON file)
4. Give "Viewer" access

### 4. Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your values:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

**Important**: Replace the values with your actual service account email and private key from the downloaded JSON file.

### 5. Google Sheets Structure

Make sure your Google Sheets have the following structure:

#### Vehicle Data Sheet (ID: 1tZDbCefO-xSwdYc2zry0eOpLtZrOw1FM3KZPHtpKRU0)
Required tabs:
- `24+ hours offline vehicles`
- `5+ days offline vehicles`
- `10+ days offline vehicles`
- `Online but Showing Offline`
- `Sold Vehicles - Camera Pending`
- `Unresolved Issues (20+ days)`

#### Camera Misaligned Sheet (ID: 1GPDqOSURZNALalPzfHNbMft0HQ1c_fIkgfu_V3fSroY)
Required tab:
- `Misalignment_Tracking` with columns:
  - `Date`
  - `Client Name`
  - `Vehicle Numbers`

#### Issues Sheet (ID: 1oHapc5HADod_2zPi0l1r8Ef2PjQlb4pfe-p9cKZFB2I)
Required tab:
- `Issues- Realtime` with columns:
  - `Issue ID`
  - `Client`
  - `City`
  - `Issue`
  - `Vehicle Number`
  - `Assigned To`
  - `Timestamp Issues Raised`
  - `Resolved Y/N`
  - `Next Follow Up Date`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 7. Build for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - Add `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - Add `GOOGLE_PRIVATE_KEY`
5. Deploy

### 3. Environment Variables in Vercel

In your Vercel project settings:
1. Go to "Settings" > "Environment Variables"
2. Add the required variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (wrap in quotes and include \n characters)

## Application Structure

```
├── pages/
│   ├── api/
│   │   ├── vehicle-data.js       # Vehicle data API endpoint
│   │   ├── camera-misaligned.js  # Camera data API endpoint
│   │   └── issue-data.js         # Issues data API endpoint
│   ├── index.js                  # Main dashboard
│   ├── offline-vehicles.js       # Offline vehicles page
│   ├── issue-tracker.js          # Issue tracker page
│   └── _app.js                   # App configuration
├── lib/
│   └── sheets.js                 # Google Sheets integration
├── styles/
│   └── globals.css               # Global styles
├── public/                       # Static assets
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json                 # Dependencies
```

## Key Features by Page

### Main Dashboard
- Total vehicles and clients count
- Combined offline vehicles card (links to detailed page)
- Camera misaligned data with client grouping
- Issue tracker access
- Charts for offline vehicles and camera status

### Offline Vehicles Page
- Three tabs: 24+ hours, 5+ days, 10+ days
- Search and filter functionality
- Export to CSV
- Responsive table with status indicators

### Issue Tracker Page
- Complete issue management
- Four views: All Issues, Analytics, Client Summary, Assignee Summary
- Advanced filtering and search
- Charts and analytics
- Client-wise and assignee-wise performance metrics

## Data Sources

The application fetches data from three Google Sheets:

1. **Vehicle Data**: Contains offline vehicle information across different time periods
2. **Camera Misaligned**: Tracks camera misalignment issues by client
3. **Issues Data**: Complete issue tracking with client and assignee information

## Troubleshooting

### Common Issues

1. **"Google Apps Script not available" error**
   - Make sure you're using the correct Google Sheets API (not Apps Script)
   - Verify your service account has access to the sheets

2. **"Failed to fetch data" error**
   - Check your environment variables
   - Verify the Google Sheets IDs are correct
   - Ensure the service account has proper permissions

3. **"Sheet not found" error**
   - Verify the sheet names exactly match what's expected
   - Check that the tabs exist in your Google Sheets

4. **Authentication errors**
   - Make sure the private key is properly formatted with \n characters
   - Verify the service account email is correct

### Debug Mode

Add debug logging by setting:
```bash
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Verify your Google Sheets setup and permissions
