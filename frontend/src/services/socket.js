import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
  }

  connect() {
    this.socket = io('http://localhost:3000', {
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
}

export const socketService = new SocketService()

