import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Allow CORS from environment variable or any origin in development
const corsOrigin = process.env.CORS_ORIGIN || true; // true allows all origins
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for flight strips and spacers per airport (room)
const airportRooms = new Map();
let stripIdCounter = 1;

// Initialize default spacers for an airport
const getDefaultSpacers = () => [
  { id: 'spacer-1', type: 'spacer', name: 'CTR', icon: 'mdi-radar', order: 0 },
  { id: 'spacer-2', type: 'spacer', name: 'RUNWAY', icon: 'mdi-runway', order: 1 },
  { id: 'spacer-3', type: 'spacer', name: 'TAXIWAY', icon: 'mdi-taxi', order: 2 },
  { id: 'spacer-4', type: 'spacer', name: 'DEP', icon: 'mdi-airplane-takeoff', order: 3 }
];

// Get or create room data for an airport
const getAirportRoom = (icao) => {
  if (!airportRooms.has(icao)) {
    airportRooms.set(icao, {
      strips: [],
      spacers: getDefaultSpacers()
    });
  }
  return airportRooms.get(icao);
};

// Store connected clients with their airport
const clients = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  clients.set(socket.id, { id: socket.id, connectedAt: new Date(), airport: null });

  // Handle airport selection (joining a room)
  socket.on('select-airport', (icao) => {
    const client = clients.get(socket.id);
    const previousAirport = client.airport;
    
    // Leave previous room if any
    if (previousAirport) {
      socket.leave(previousAirport);
      console.log(`Client ${socket.id} left room ${previousAirport}`);
    }
    
    // Join new room
    socket.join(icao);
    client.airport = icao;
    console.log(`Client ${socket.id} joined room ${icao}`);
    
    // Get room data for this airport
    const room = getAirportRoom(icao);
    
    // Send current strips and spacers for this airport
    socket.emit('initial-strips', room.strips);
    socket.emit('initial-spacers', room.spacers);
  });

  // Handle new strip creation
  socket.on('create-strip', (stripData) => {
    const client = clients.get(socket.id);
    if (!client.airport) return;
    
    const room = getAirportRoom(client.airport);
    const newStrip = {
      id: stripIdCounter++,
      ...stripData,
      position: stripData.position || { order: room.strips.length },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    room.strips.push(newStrip);
    
    console.log(`Strip created in ${client.airport}, broadcasting reorder:`, room.strips.length);
    // Broadcast to all clients in this airport room
    io.to(client.airport).emit('strips-reordered', room.strips);
  });

  // Handle strip updates
  socket.on('update-strip', (stripData) => {
    const client = clients.get(socket.id);
    if (!client.airport) return;
    
    const room = getAirportRoom(client.airport);
    const index = room.strips.findIndex(s => s.id === stripData.id);
    if (index !== -1) {
      room.strips[index] = {
        ...room.strips[index],
        ...stripData,
        updatedAt: new Date()
      };
      
      // Broadcast to all clients in this airport room except sender
      socket.to(client.airport).emit('strip-updated', room.strips[index]);
    }
  });

  // Handle item movement (strips and spacers)
  socket.on('move-item', (moveData) => {
    const { itemId, newOrder, allItems } = moveData;
    const client = clients.get(socket.id);
    if (!client.airport) return;
    
    const room = getAirportRoom(client.airport);
    console.log(`Move item received in ${client.airport}:`, itemId, newOrder);
    console.log('All items received:', allItems.map(i => `${i.id}(${i.type},order:${i.order})`).join(', '));
    
    // Update strips and spacers based on the complete ordering
    if (allItems && Array.isArray(allItems)) {
      // Separate strips and spacers and preserve their exact order from client
      const newOrderedStrips = [];
      const newOrderedSpacers = [];
      
      allItems.forEach((item) => {
        if (item.type === 'strip') {
          const existingStrip = room.strips.find(s => s.id === item.id);
          if (existingStrip) {
            existingStrip.position = { order: item.order };
            newOrderedStrips.push(existingStrip);
          }
        } else if (item.type === 'spacer') {
          const existingSpacer = room.spacers.find(s => s.id === item.id);
          if (existingSpacer) {
            existingSpacer.order = item.order;
            newOrderedSpacers.push(existingSpacer);
          } else {
            // Create new spacer if it doesn't exist
            const newSpacer = {
              id: item.id,
              type: 'spacer',
              name: item.name || 'NEW SECTION',
              icon: item.icon || 'mdi-minus',
              order: item.order
            };
            newOrderedSpacers.push(newSpacer);
          }
        }
      });
      
      // Sort by order to ensure consistency
      newOrderedStrips.sort((a, b) => a.position.order - b.position.order);
      newOrderedSpacers.sort((a, b) => a.order - b.order);
      
      // Update the arrays with new order
      room.strips.length = 0;
      room.strips.push(...newOrderedStrips);
      
      room.spacers.length = 0;
      room.spacers.push(...newOrderedSpacers);
      
      console.log('Updated strips:', room.strips.map(s => `${s.id}:${s.position.order}`).join(', '));
      console.log('Updated spacers:', room.spacers.map(s => `${s.id}:${s.order}`).join(', '));
    }
    
    console.log(`Broadcasting reordered items in ${client.airport} - strips:`, room.strips.length, 'spacers:', room.spacers.length);
    // Broadcast the complete updated arrays to all clients in this airport room
    io.to(client.airport).emit('strips-reordered', room.strips);
    io.to(client.airport).emit('spacers-reordered', room.spacers);
  });

  // Handle strip deletion
  socket.on('delete-strip', (stripId) => {
    const client = clients.get(socket.id);
    if (!client.airport) return;
    
    const room = getAirportRoom(client.airport);
    const index = room.strips.findIndex(s => s.id === stripId);
    if (index !== -1) {
      room.strips.splice(index, 1);
      
      // Reorder remaining strips
      room.strips.forEach((strip, newIndex) => {
        strip.position = { order: newIndex };
      });
      
      console.log(`Strip deleted in ${client.airport}, broadcasting reorder:`, room.strips.length);
      // Broadcast to all clients in this airport room
      io.to(client.airport).emit('strips-reordered', room.strips);
    }
  });

  // Handle spacer deletion
  socket.on('delete-spacer', (spacerId) => {
    const client = clients.get(socket.id);
    if (!client.airport) return;
    
    const room = getAirportRoom(client.airport);
    const index = room.spacers.findIndex(s => s.id === spacerId);
    if (index !== -1) {
      room.spacers.splice(index, 1);
      
      // Reorder remaining spacers
      room.spacers.forEach((spacer, newIndex) => {
        spacer.order = newIndex;
      });
      
      console.log(`Spacer deleted in ${client.airport}, broadcasting reorder:`, room.spacers.length);
      // Broadcast to all clients in this airport room
      io.to(client.airport).emit('spacers-reordered', room.spacers);
    }
  });

  // Handle spacer creation
  socket.on('create-spacer', (spacerData) => {
    const client = clients.get(socket.id);
    if (!client.airport) return;
    
    const room = getAirportRoom(client.airport);
    const newSpacer = {
      id: spacerData.id || 'spacer-' + Date.now(),
      type: 'spacer',
      name: spacerData.name || 'NEW SECTION',
      icon: spacerData.icon || 'mdi-minus',
      order: spacerData.order || room.spacers.length
    };
    room.spacers.push(newSpacer);
    
    console.log(`Spacer created in ${client.airport}, broadcasting reorder:`, room.spacers.length);
    // Broadcast to all clients in this airport room
    io.to(client.airport).emit('spacers-reordered', room.spacers);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clients.delete(socket.id);
  });
});

// REST API endpoints
app.get('/api/strips', (req, res) => {
  res.json(strips);
});

app.post('/api/strips', (req, res) => {
  const newStrip = {
    id: stripIdCounter++,
    ...req.body,
    position: req.body.position || { order: strips.length },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  strips.push(newStrip);
  
  // Broadcast to all WebSocket clients
  io.emit('strip-created', newStrip);
  
  res.status(201).json(newStrip);
});

app.put('/api/strips/:id', (req, res) => {
  const stripId = parseInt(req.params.id);
  const index = strips.findIndex(s => s.id === stripId);
  
  if (index !== -1) {
    strips[index] = {
      ...strips[index],
      ...req.body,
      updatedAt: new Date()
    };
    
    // Broadcast to all WebSocket clients
    io.emit('strip-updated', strips[index]);
    
    res.json(strips[index]);
  } else {
    res.status(404).json({ error: 'Strip not found' });
  }
});

app.delete('/api/strips/:id', (req, res) => {
  const stripId = parseInt(req.params.id);
  const index = strips.findIndex(s => s.id === stripId);
  
  if (index !== -1) {
    strips.splice(index, 1);
    
    // Broadcast to all WebSocket clients
    io.emit('strip-deleted', stripId);
    
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Strip not found' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    strips: strips.length,
    clients: clients.size 
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

httpServer.listen(PORT, HOST, () => {
  console.log(`VATEFS Backend running on ${HOST}:${PORT}`);
  console.log(`WebSocket server ready for connections`);
  console.log(`CORS origin: ${corsOrigin === true ? 'All origins allowed' : corsOrigin}`);
});

