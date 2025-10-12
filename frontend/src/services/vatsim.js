import axios from 'axios'
import { aircraftDataService } from './aircraftData'

class VatsimService {
  constructor() {
    this.dataUrl = 'https://data.vatsim.net/v3/vatsim-data.json'
    this.pollInterval = null
    this.knownFlights = new Set()
    this.selectedAirport = null
  }

  async fetchData() {
    try {
      const response = await axios.get(this.dataUrl)
      return response.data
    } catch (error) {
      console.error('Error fetching VATSIM data:', error)
      return null
    }
  }

  async getDepartures(icao) {
    const data = await this.fetchData()
    if (!data || !data.pilots) return []

    // Filter pilots departing from the selected airport
    const departures = data.pilots.filter(pilot => {
      return pilot.flight_plan && 
             pilot.flight_plan.departure === icao &&
             pilot.flight_plan.arrival
    })

    return departures.map(pilot => this.convertToStrip(pilot))
  }

  async getArrivals(icao) {
    const data = await this.fetchData()
    if (!data || !data.pilots) return []

    // Filter pilots arriving at the selected airport
    const arrivals = data.pilots.filter(pilot => {
      return pilot.flight_plan && 
             pilot.flight_plan.arrival === icao &&
             pilot.flight_plan.departure
    })

    return arrivals.map(pilot => this.convertToStrip(pilot))
  }

  convertToStrip(pilot) {
    const fp = pilot.flight_plan
    const aircraftType = fp.aircraft_short || fp.aircraft || 'ZZZZ'
    
    // Get WTC from aircraft data
    const wtc = aircraftDataService.getWTC(aircraftType)
    
    // Get full route
    const route = fp.route || ''
    
    return {
      callsign: pilot.callsign,
      atyp: aircraftType,
      wake: wtc,
      adep: fp.departure,
      ades: fp.arrival,
      rfl: fp.altitude ? `FL${Math.floor(parseInt(fp.altitude) / 100).toString().padStart(3, '0')}` : '',
      tas: fp.cruise_tas || '',
      frul: fp.flight_rules || 'IFR',
      sid: fp.departure_procedure || '',
      star: fp.arrival_procedure || '',
      assr: pilot.transponder || '',
      eobt: fp.deptime || '',
      route: route,
      check1: '',
      check2: '',
      stand: '',
      col3_text: '',
      stripType: 'departure', // Will be set based on context
      vatsimCid: pilot.cid,
      vatsimCallsign: pilot.callsign
    }
  }

  startPolling(airport, callback, interval = 30000) {
    this.selectedAirport = airport
    this.stopPolling()
    
    // Initial fetch
    this.checkForNewFlights(callback)
    
    // Poll every interval
    this.pollInterval = setInterval(() => {
      this.checkForNewFlights(callback)
    }, interval)
  }

  async checkForNewFlights(callback) {
    if (!this.selectedAirport) return

    const departures = await this.getDepartures(this.selectedAirport)
    
    departures.forEach(strip => {
      const id = `${strip.callsign}-${strip.adep}-${strip.ades}`
      if (!this.knownFlights.has(id)) {
        this.knownFlights.add(id)
        callback(strip)
      }
    })
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  setAirport(icao) {
    this.selectedAirport = icao
    this.knownFlights.clear()
  }

  async getAirportInfo(icao) {
    // Get current controllers at the airport
    const data = await this.fetchData()
    if (!data) return null

    const controllers = data.controllers.filter(c => 
      c.callsign.startsWith(icao)
    )

    const departures = await this.getDepartures(icao)
    const arrivals = await this.getArrivals(icao)

    return {
      icao,
      departures: departures.length,
      arrivals: arrivals.length,
      controllers: controllers.length,
      activeControllers: controllers
    }
  }

  async getFlightByCallsign(callsign) {
    const data = await this.fetchData()
    if (!data || !data.pilots) return null

    // Find pilot with matching callsign (case-insensitive)
    const pilot = data.pilots.find(p => 
      p.callsign.toUpperCase() === callsign.toUpperCase()
    )

    if (!pilot || !pilot.flight_plan) return null

    return this.convertToStrip(pilot)
  }
}

export const vatsimService = new VatsimService()

