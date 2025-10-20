# VatEFS - VATSIM Electronic Flight Strips

VatEFS (VATSIM Electronic Flight Strip) is a modern web application for managing electronic flight strips during ATC operations on VATSIM. Inspired by [vatpls](https://github.com/minsulander/vatpls/), it provides real-time synchronization between multiple clients for collaborative ATC operations.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)

## Features

- 📋 **Electronic Flight Strips** - Digital flight strips with all essential flight information
- 🌐 **VATSIM Integration** - Auto-import flight plans from VATSIM live data
- ✈️ **Auto-Create Strips** - Automatically create strips when new departures file flight plans
- 🔄 **Real-time Synchronization** - Changes sync instantly across all connected clients via WebSockets
- 🎯 **Drag & Drop** - Intuitive drag-and-drop interface for strips and bay headers
- 🎨 **Clean VatPLS-inspired UI** - Professional, minimalist design similar to VatPLS
- 🎨 **Color-Coded Strips** - Yellow borders for departures, blue for arrivals
- 📌 **Movable Bay Headers** - Organize strips with draggable section dividers
- 🌓 **Dark/Light Mode** - Toggle between dark and light themes
- 📱 **Responsive Design** - Works seamlessly on desktop and tablet devices
- 🇸🇪 **Swedish Airport Presets** - Quick access to ESGG, ESMS, ESNZ, ESNU

## Flight Strip Data Fields

Each flight strip contains the following information:

- **CALLSIGN** - Aircraft callsign
- **TAS** - True Air Speed (knots)
- **FRUL** - Flight Rules (IFR/VFR/SVFR)
- **ATYP** - Aircraft Type (ICAO code)
- **ASSR** - SSR Code (Squawk)
- **SID** - Standard Instrument Departure
- **EOBT** - Estimated Off-Block Time
- **ADEP** - Departure Aerodrome (ICAO code)
- **ADES** - Destination Aerodrome (ICAO code)
- **RFL** - Requested Flight Level

## Architecture

VATEFS consists of two main components:

### Frontend
- **Framework**: Vue 3 with Composition API
- **UI Library**: Vuetify 3
- **Drag & Drop**: vue-draggable-plus
- **WebSocket Client**: Socket.io-client
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **WebSocket Server**: Socket.io
- **Data Storage**: In-memory (can be extended to use a database)

## Installation

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd vatefs
```

2. **Install dependencies for all packages**
```bash
npm run install:all
```

This will install dependencies for the root, frontend, and backend packages.

## Running the Application

### Development Mode

Start both frontend and backend simultaneously:

```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:3000

### Production Build

Build the frontend for production:

```bash
npm run build
```

The built files will be in `frontend/dist/`.

## Usage

### Initial Setup - Airport Selection

When you first open VATEFS, you'll see an airport selector:

1. **Quick Select** - Choose from preset Swedish airports (ESGG, ESMS, ESNZ, ESNU)
2. **Custom Airport** - Enter any ICAO code (e.g., KJFK, EGLL)
3. **Auto-Import** - Optionally import existing flight plans on startup
4. **Start Monitoring** - Begin tracking VATSIM traffic

The system will:
- Display current departure and arrival counts
- Auto-create strips when new departures file flight plans
- Poll VATSIM data every 30 seconds for updates

### Manual Strip Creation

You can also create strips manually:

1. Click the **+** button in the top app bar
2. Choose strip type (DEP/ARR/General)
3. Fill in the required fields (Callsign, Aircraft Type, ADEP, ADES)
4. Optionally add additional information (TAS, SID, RFL, etc.)
5. Click **Create Strip**

### Strip Types and Colors

Strips are color-coded for easy identification:

- **Departure strips** (yellow border) - For departing aircraft
- **Arrival strips** (blue border) - For arriving aircraft  
- **Neutral strips** (gray border) - General purpose

When creating a strip, select the appropriate type to apply the color coding.

### Moving Strips

1. Click and hold the strip by the drag handle (≡ icon)
2. Drag to the desired position
3. Release to drop
4. The strip position will sync to all connected clients

### Managing Bay Headers

Bay headers help organize your strips into sections. Default bay headers include CTR, RUNWAY, TAXIWAY, and DEP:

1. **Move a bay header**: Drag it to any position, just like a flight strip
2. **Edit a bay header**: Double-click to rename it
3. **Delete a bay header**: Drag it to the trash zone on the right sidebar
4. **Add a bay header**: Click the **+** button in the top bar and select "Bay Header"

### Quick Strip Creation

Use the **+** menu in the top bar for quick access:
- **New DEP Strip** - Creates a departure strip (yellow border)
- **New ARR Strip** - Creates an arrival strip (blue border)
- **New General Strip** - Creates a neutral strip (gray border)
- **Bay Header** - Creates a custom section divider

### Editing a Strip

1. Click the pencil icon on any strip
2. Modify the fields as needed
3. Click **Save Changes**
4. Changes sync to all connected clients

### Deleting a Strip

1. Click the trash icon on any strip
2. The strip will be deleted for all connected clients

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/strips` - Get all strips
- `POST /api/strips` - Create a new strip
- `PUT /api/strips/:id` - Update a strip
- `DELETE /api/strips/:id` - Delete a strip
- `GET /api/health` - Health check and server status

## WebSocket Events

### Client to Server

- `create-strip` - Create a new strip
- `update-strip` - Update an existing strip
- `move-strip` - Move a strip to a different bay/position
- `delete-strip` - Delete a strip

### Server to Client

- `initial-strips` - Initial strip data sent on connection
- `strip-created` - Broadcast when a new strip is created
- `strip-updated` - Broadcast when a strip is updated
- `strip-moved` - Broadcast when a strip is moved
- `strip-deleted` - Broadcast when a strip is deleted

## VATSIM Integration

VATEFS integrates with the live VATSIM data feed to automatically create strips. See [VATSIM_INTEGRATION.md](VATSIM_INTEGRATION.md) for detailed documentation on:

- How the integration works
- Airport selection and monitoring
- Auto-import and auto-creation
- Data mapping from VATSIM to strips
- Troubleshooting and configuration

## Templates

Strip templates are defined in the `/templates` directory. See [templates/README.md](templates/README.md) for more information on creating custom templates.

## Development

### Project Structure

```
vatefs/
├── backend/               # Backend server
│   ├── server.js         # Express + Socket.io server
│   └── package.json
├── frontend/             # Vue 3 frontend
│   ├── src/
│   │   ├── components/   # Vue components
│   │   │   ├── FlightStrip.vue
│   │   │   └── StripBoard.vue
│   │   ├── services/     # Service modules
│   │   │   └── socket.js
│   │   ├── App.vue       # Root component
│   │   └── main.js       # Application entry
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── templates/            # Strip templates
│   ├── strip-template.json
│   └── README.md
├── package.json          # Root package
└── README.md
```

### Technology Stack

- **Frontend**: Vue 3, Vuetify 3, Vue Draggable Plus, Socket.io-client, Axios
- **Backend**: Node.js, Express, Socket.io, CORS
- **Build Tools**: Vite, Nodemon, Concurrently

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [vatpls](https://github.com/minsulander/vatpls/) by minsulander
- Built for the VATSIM community
- Thanks to all contributors and testers

## Support

For support, please open an issue on the GitHub repository or contact the maintainers.

## Roadmap

Future enhancements planned:

- [x] VATSIM API integration for automatic strip creation ✅
- [x] Airport selection and monitoring ✅
- [ ] Arrival strip auto-creation
- [ ] Database persistence (PostgreSQL/MongoDB)
- [ ] User authentication and authorization
- [ ] Strip history and logging
- [ ] Audio notifications for new strips
- [ ] Export/Import functionality
- [ ] Multi-language support
- [ ] Flight progress tracking with position updates
- [ ] Route display and waypoint information
- [ ] ATIS information display
- [ ] Controller coordination features

---

**Built with ❤️ for the VATSIM community**
