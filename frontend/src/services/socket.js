import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
  }

  connect() {
    // Use environment variable or default to current host with port 3000
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:3000`
    console.log('Connecting to backend:', backendUrl)
    
    this.socket = io(backendUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  createStrip(stripData) {
    if (this.socket) {
      this.socket.emit('create-strip', stripData)
    }
  }

  updateStrip(stripData) {
    if (this.socket) {
      this.socket.emit('update-strip', stripData)
    }
  }

  moveStrip(moveData) {
    if (this.socket) {
      this.socket.emit('move-strip', moveData)
    }
  }

  deleteStrip(stripId) {
    if (this.socket) {
      this.socket.emit('delete-strip', stripId)
    }
  }

  createSpacer(spacerData) {
    if (this.socket) {
      this.socket.emit('create-spacer', spacerData)
    }
  }

  updateSpacer(spacerData) {
    if (this.socket) {
      this.socket.emit('update-spacer', spacerData)
    }
  }

  deleteSpacer(spacerId) {
    if (this.socket) {
      this.socket.emit('delete-spacer', spacerId)
    }
  }

  moveItem(moveData) {
    if (this.socket) {
      this.socket.emit('move-item', moveData)
    }
  }

  selectAirport(icao) {
    if (this.socket) {
      this.socket.emit('select-airport', icao)
    }
  }

  resetFPB() {
    if (this.socket) {
      this.socket.emit('reset-fpb')
    }
  }
}

export const socketService = new SocketService()

