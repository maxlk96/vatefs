# Airport Room-Based Synchronization

## Overview

VATEFS uses **Socket.IO rooms** to provide independent strip synchronization for each airport. This ensures that controllers working at different airports see only the strips relevant to their airport, and changes are synchronized only between clients monitoring the same airport.

## How It Works

### 1. **Airport Rooms (Backend)**

Each airport ICAO code (e.g., ESGG, ESMS) represents a unique "room" on the server:

```javascript
// Server maintains separate data for each airport
const airportRooms = new Map()
// Example:
// 'ESGG' => { strips: [...], spacers: [...] }
// 'ESMS' => { strips: [...], spacers: [...] }
```

### 2. **Joining a Room (Client)**

When a user selects an airport:

1. **Client sends `select-airport` event** with the ICAO code
2. **Server joins the client to that room** using Socket.IO's `socket.join(icao)`
3. **Server sends initial data** (strips and spacers) for that specific airport
4. **Client receives and displays** the airport-specific strips

```javascript
// Frontend
socketService.selectAirport('ESGG')

// Backend
socket.join('ESGG')
socket.emit('initial-strips', room.strips)
socket.emit('initial-spacers', room.spacers)
```

### 3. **Room-Scoped Broadcasting**

All strip operations are scoped to the client's current airport room:

- **Create Strip**: Only clients in the same airport room see the new strip
- **Move Strip**: Position changes broadcast only to the same airport room
- **Update Strip**: Changes broadcast only to the same airport room
- **Delete Strip**: Removal broadcast only to the same airport room
- **Spacer Operations**: All spacer changes are room-specific

```javascript
// Backend broadcasts only to clients in the same airport room
io.to(client.airport).emit('strips-reordered', room.strips)
```

## Example Scenario

### Setup:
- **Client A & B**: Monitoring ESGG
- **Client C & D**: Monitoring ESMS

### Actions:

1. **Client A creates a strip at ESGG**
   - ✅ Client B sees the new strip (same room)
   - ❌ Client C & D don't see it (different room)

2. **Client C moves a strip at ESMS**
   - ✅ Client D sees the movement (same room)
   - ❌ Client A & B don't see it (different room)

3. **Client B adds a custom spacer at ESGG**
   - ✅ Client A sees the new spacer (same room)
   - ❌ Client C & D don't see it (different room)

## Benefits

### 1. **Independent Operations**
- Each airport has its own strip board
- No interference between different airports
- Controllers can work simultaneously at different airports

### 2. **Scalability**
- Server efficiently manages multiple airport rooms
- Resources allocated per airport as needed
- No global broadcasting overhead

### 3. **Data Integrity**
- Strip data isolated per airport
- No risk of cross-contamination
- Clean separation of concerns

### 4. **Real-Time Collaboration**
- Multiple controllers can monitor the same airport
- Changes sync instantly between same-airport clients
- True collaborative environment

## Technical Details

### Room Lifecycle

```javascript
// 1. Client connects
socket.on('connection', () => {
  clients.set(socket.id, { airport: null })
})

// 2. Client selects airport
socket.on('select-airport', (icao) => {
  socket.join(icao)
  client.airport = icao
  // Send room-specific data
})

// 3. Client changes airport
socket.on('select-airport', (newIcao) => {
  socket.leave(oldIcao)  // Leave old room
  socket.join(newIcao)   // Join new room
  // Send new room-specific data
})

// 4. Client disconnects
socket.on('disconnect', () => {
  // Socket.IO automatically removes from all rooms
})
```

### Data Storage Structure

```javascript
airportRooms = Map {
  'ESGG' => {
    strips: [
      { id: 1, callsign: 'SAS123', ... },
      { id: 2, callsign: 'DLH456', ... }
    ],
    spacers: [
      { id: 'spacer-1', name: 'CTR', order: 0 },
      { id: 'spacer-2', name: 'RUNWAY', order: 1 },
      ...
    ]
  },
  'ESMS' => {
    strips: [
      { id: 3, callsign: 'NAX789', ... }
    ],
    spacers: [
      { id: 'spacer-1', name: 'CTR', order: 0 },
      ...
    ]
  }
}
```

## VATSIM Integration

The room-based system works seamlessly with VATSIM integration:

1. **Airport Selection**: When selecting an airport, VATSIM polling starts for that ICAO
2. **Auto-Import**: Existing flights from VATSIM are imported into the correct airport room
3. **New Flights**: VATSIM polling detects new flights and adds them to the correct room
4. **Multiple Airports**: Different clients can monitor different airports with independent VATSIM feeds

## Future Enhancements

- **Persistence**: Save room data to database
- **Room Cleanup**: Auto-remove empty rooms after inactivity
- **Room Statistics**: Track active controllers per airport
- **Cross-Room Coordination**: Features for handoff between airports
- **Room History**: Log all changes per airport for audit/replay

## Summary

The room-based synchronization ensures that VATEFS scales efficiently while providing a clean, isolated, and real-time collaborative environment for each airport. Controllers at ESGG never see strips from ESMS, and vice versa, while maintaining perfect synchronization with other controllers at the same airport.

