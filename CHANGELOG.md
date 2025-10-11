# Changelog

All notable changes to VATEFS will be documented in this file.

## [1.1.0] - 2025-10-11

### Added
- **HTML Template System** - Flight strips now use customizable HTML templates instead of hardcoded layouts
- Three template files: `strip-template.html`, `departure-strip-template.html`, `arrival-strip-template.html`
- Template loader service for dynamic template loading and processing
- Template variable interpolation with `{{variable}}` syntax
- Default value support with `||` operator (e.g., `{{assr || 'N/A'}}`)
- Conditional display support with `v-if` directive
- Comprehensive template customization guide (TEMPLATE_GUIDE.md)
- Semantic CSS classes for field styling (highlight, airport, route, time)
- Flexbox utilities for responsive layouts (flex-1, flex-2)
- Chip and badge components for flight rules and wake turbulence
- Enhanced departure template with wake turbulence and runway fields
- Enhanced arrival template with STAR, CFL, and ETA fields
- Full border styling (all four sides) for strip type indicators
- **Right Sidebar** - New dedicated sidebar for strip/spacer creation and deletion
- **Drag-to-Delete** - Trash zone in sidebar for intuitive strip/spacer deletion
- Individual creation buttons for DEP, ARR, General strips, and Spacers
- Visual feedback when dragging items to trash (icon changes color)

### Changed
- **Removed strip headers** - Callsign now only appears within the template content
- **Removed edit functionality** - Strips are now view-only (edit will return in future release)
- **Removed edit and delete buttons** - Strips now have cleaner appearance without action buttons
- **Enhanced borders** - Strip type borders (yellow/blue/gray) now show on all four sides instead of just left
- **Removed dark/light mode toggle** - App now uses consistent dark theme
- **Sidebar redesign** - Airport selection and status indicators moved to sidebar
- **Icon-only buttons** - Creation buttons now show only icons with tooltips (no text)
- **Rectangular button design** - Buttons are now rectangular with rounded corners instead of circular
- **Narrower sidebar** - Sidebar width reduced from 200px to 120px for more content space
- **Compact sidebar buttons** - All creation buttons and trash zone reduced to 80px width (half of previous)
- **Centered buttons** - All buttons including airport selection now centered in sidebar
- **Compact airport button** - Reduced width and padding for cleaner look
- **Improved trash zone** - Icon changes from outline to solid red when dragging over
- **WAN Access enabled** - Frontend and backend now listen on all network interfaces
- **Non-selectable text** - All UI text is now non-selectable for better drag-and-drop experience (input fields still allow text selection)
- Strip content is now rendered from HTML templates instead of Vue template
- Templates are fully customizable without modifying source code
- Strip layouts can be changed by editing HTML files in `frontend/public/templates/`
- Templates are hot-reloadable (changes take effect on browser refresh)
- Improved strip layout with better field organization
- Better visual hierarchy with color-coded field values
- More content space due to header removal
- Replaced generic "+" menu with dedicated creation buttons
- Main layout now includes fixed right sidebar
- Airport button now shows selected airport code
- Status indicators repositioned to sidebar for better visibility

### Fixed
- **Trash icon dragging bug** - Trash icon can no longer be dragged out of the trash zone
- **Improved trash zone detection** - Trashcan now turns red immediately when strip enters the area and stays red throughout

### Removed
- Theme toggle button and all theme-related code
- Edit mode functionality from strips
- Action buttons (edit/delete) from individual strips
- Generic "+" dropdown menu

### Technical
- New `templateLoader.js` service for template management
- Templates are fetched from public directory at runtime
- Template caching for improved performance
- HTML sanitization and variable interpolation
- Support for nested property access in templates

### Documentation
- Added TEMPLATE_GUIDE.md with comprehensive customization examples
- Updated templates/README.md with HTML template documentation
- Added examples for minimal, standard, and detailed layouts
- Documented all available template variables and styling classes
- Added WAN_ACCESS.md with complete guide for remote access setup

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

