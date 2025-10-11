# Changelog

All notable changes to VATEFS will be documented in this file.

## [1.0.0] - 2025-10-11

### Added
- Initial release of VATEFS (VATSIM Electronic Flight Strip System)
- **VATSIM Integration** - Live data feed from VATSIM network
- **Airport Selector** - Choose airport to monitor on startup
- **Auto-Create Strips** - Automatically create strips for new departures
- **Auto-Import** - Import existing flight plans when starting
- **Preset Airports** - Quick access to ESGG, ESMS, ESNZ, ESNU
- **Live Stats** - Show departure/arrival counts for each airport
- **30-second polling** - Regular updates from VATSIM data feed
- Quick-create menu for strip types (DEP/ARR/General)
- Separate creation dialogs for departure, arrival, and general strips
- Custom spacer creation dialog
- Default spacers: CTR, RUNWAY, TAXIWAY, and DEP
- Electronic flight strips with all required VATSIM data fields
- Real-time WebSocket synchronization between multiple clients
- Vue 3 + Vuetify frontend with modern, clean UI
- Node.js + Express + Socket.io backend
- Drag-and-drop functionality for strips and spacers
- Color-coded strips (yellow for departure, blue for arrival, gray for neutral)
- Movable spacers for organizing strips into sections
- Dark/Light theme toggle
- Inline strip editing
- Strip creation and deletion with real-time sync
- REST API endpoints for strip management
- Template system for defining strip layouts
- Comprehensive documentation and quick start guide

### Features
- **Flight Strip Data Fields**:
  - CALLSIGN - Aircraft callsign
  - TAS - True Air Speed
  - FRUL - Flight Rules (IFR/VFR/SVFR)
  - ATYP - Aircraft Type
  - ASSR - SSR Code (Squawk)
  - SID - Standard Instrument Departure
  - EOBT - Estimated Off-Block Time
  - ADEP - Departure Aerodrome
  - ADES - Destination Aerodrome
  - RFL - Requested Flight Level

- **Real-time Synchronization**:
  - Strip creation broadcasts to all clients
  - Strip updates sync instantly
  - Strip position changes reflected everywhere
  - Strip deletion propagates to all clients

- **UI Features**:
  - Clean, VatPLS-inspired design
  - Departure strips with yellow left border
  - Arrival strips with blue left border
  - Draggable spacers (CLEARANCE, GROUND, TOWER, DEPARTURE, ARRIVAL)
  - Add custom spacers
  - Edit and delete spacers
  - Responsive layout
  - Professional typography and styling

### Technical Stack
- Frontend: Vue 3, Vuetify 3, Vue Draggable Plus, Socket.io-client, Axios
- Backend: Node.js, Express, Socket.io, CORS
- Build Tools: Vite, Nodemon, Concurrently
- License: GPL-3.0

### Documentation
- README.md with comprehensive setup and usage instructions
- QUICKSTART.md for fast setup
- CONTRIBUTING.md with contribution guidelines
- Template documentation in templates/README.md
- Code examples and API documentation

### Templates
- Standard flight strip template
- Arrival-optimized template
- Departure-optimized template
- Extensible template system for custom layouts

