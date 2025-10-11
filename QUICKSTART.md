# Quick Start Guide

Get VATEFS up and running in just a few minutes!

## Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) version 18 or higher
- npm (comes with Node.js)

## Installation Steps

### 1. Clone or Download

If you haven't already, get the VATEFS code:

```bash
git clone <repository-url>
cd vatefs
```

### 2. Install Dependencies

Run this single command to install all required packages:

```bash
npm run install:all
```

This will install dependencies for:
- Root package (build tools)
- Backend server
- Frontend application

**Note**: This may take a few minutes on first run.

### 3. Start the Application

#### Option A: Windows Users

Simply double-click the `start.bat` file in the root directory.

#### Option B: Command Line (All Platforms)

```bash
npm run dev
```

This starts both the backend and frontend servers simultaneously.

### 4. Open in Browser

Once started, open your web browser and navigate to:

```
http://localhost:5173
```

You should see the VATEFS interface!

## Select Your Airport

On first launch, you'll see the airport selector:

1. **Choose a preset airport** (recommended for Swedish airports):
   - ESGG - Göteborg Landvetter
   - ESMS - Malmö Sturup
   - ESNZ - Ängelholm-Helsingborg
   - ESNU - Umeå
   
2. **Or enter a custom ICAO code** (e.g., KJFK, EGLL)

3. Check **"Auto-import existing flight plans"** to load current departures

4. Click **"Start Monitoring"**

The system will now:
- Show live VATSIM traffic for your airport
- Auto-create strips for new departures
- Update every 30 seconds

## Creating Strips Manually

1. Click the **+** button in the top-right corner
2. Choose the strip type:
   - **New DEP Strip** - For departing aircraft (yellow border)
   - **New ARR Strip** - For arriving aircraft (blue border)
   - **New General Strip** - For general use (gray border)
3. Fill in the required fields:
   - **Callsign**: e.g., `AAL123`
   - **Aircraft Type**: e.g., `B738`
   - **ADEP**: e.g., `KJFK`
   - **ADES**: e.g., `KLAX`
4. Add optional information (TAS, SID, RFL, etc.)
5. Click **Create Strip**

## Moving Strips and Spacers

1. **Click and hold** any strip or spacer by the drag handle (≡ icon on the left)
2. **Drag** it to the desired position in the list
3. **Release** to drop it
4. Default spacers (CTR, RUNWAY, TAXIWAY, DEP) help organize your strips

## Creating Custom Spacers

1. Click the **+** button in the top-right corner
2. Select **New Spacer**
3. Enter a name (e.g., "HOLDING", "ARR", "CTR")
4. Click **Create Spacer**
5. Drag it to organize your strips

## Testing Multi-Client Sync

To see real-time synchronization in action:

1. Open a second browser window/tab
2. Navigate to `http://localhost:5173` in both
3. Create or move a strip in one window
4. Watch it update instantly in the other!

## Troubleshooting

### Port Already in Use

If you see an error about ports 3000 or 5173 being in use:

1. Stop the application (Ctrl+C)
2. Close any other applications using these ports
3. Try starting again

### Dependencies Not Installing

If `npm run install:all` fails:

1. Try installing manually:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

### Can't Connect to Server

Check that:
- The backend is running (should see "Backend running on port 3000" in console)
- Your firewall isn't blocking ports 3000 or 5173
- You're accessing `http://localhost:5173` (not `https://`)

## Next Steps

- Read the full [README.md](README.md) for detailed information
- Check [templates/README.md](templates/README.md) to learn about customizing strip templates
- Explore the API endpoints in the documentation

## Need Help?

If you run into issues:
1. Check the console output for error messages
2. Review the troubleshooting section above
3. Open an issue on the GitHub repository

---

**Happy flying! ✈️**

