import axios from 'axios'

class SidStarDataService {
  constructor() {
    this.sids = new Map() // Map<airport, Map<runway, Array<{name, route}>>>
    this.stars = new Map() // Map<airport, Map<runway, Array<{name, route}>>>
    this.loaded = false
  }

  async loadSidStarData() {
    if (this.loaded) return

    try {
      // Try to load from public directory first, fallback to root data folder
      let response
      try {
        response = await axios.get('/SIDSTAR.txt')
      } catch (e) {
        response = await axios.get('/data/SIDSTAR.txt')
      }
      const lines = response.data.split('\n')
      
      for (const line of lines) {
        // Skip comments, empty lines, and section headers
        if (line.startsWith(';') || line.startsWith('[') || line.trim() === '') continue
        
        // Parse line format: SID:AIRPORT:RWY:NAME:ROUTE
        // or: STAR:AIRPORT:RWY:NAME:ROUTE
        const parts = line.split(':')
        if (parts.length < 5) continue
        
        const type = parts[0].trim().toUpperCase()
        const airport = parts[1].trim().toUpperCase()
        const runway = parts[2].trim()
        const name = parts[3].trim()
        const route = parts.slice(4).join(':').split(';')[0].trim() // Get route, remove comments
        
        if (type === 'SID') {
          if (!this.sids.has(airport)) {
            this.sids.set(airport, new Map())
          }
          if (!this.sids.get(airport).has(runway)) {
            this.sids.get(airport).set(runway, [])
          }
          this.sids.get(airport).get(runway).push({ name, route })
        } else if (type === 'STAR') {
          if (!this.stars.has(airport)) {
            this.stars.set(airport, new Map())
          }
          if (!this.stars.get(airport).has(runway)) {
            this.stars.get(airport).set(runway, [])
          }
          this.stars.get(airport).get(runway).push({ name, route })
        }
      }
      
      this.loaded = true
      console.log(`Loaded SIDs for ${this.sids.size} airports, STARs for ${this.stars.size} airports`)
    } catch (error) {
      console.error('Error loading SID/STAR data:', error)
    }
  }

  getSIDsForRunway(airport, runway) {
    if (!airport || !runway) return []
    
    const airportSids = this.sids.get(airport.toUpperCase())
    if (!airportSids) return []
    
    return airportSids.get(runway) || []
  }

  getSTARsForRunway(airport, runway) {
    if (!airport || !runway) return []
    
    const airportStars = this.stars.get(airport.toUpperCase())
    if (!airportStars) return []
    
    return airportStars.get(runway) || []
  }

  getRunwaysForAirport(airport, type = 'SID') {
    if (!airport) return []
    
    const data = type === 'SID' ? this.sids : this.stars
    const airportData = data.get(airport.toUpperCase())
    if (!airportData) return []
    
    return Array.from(airportData.keys()).sort()
  }

  // Match SID from VATSIM with available SIDs for runway
  matchSID(airport, runway, vatsimSid) {
    if (!vatsimSid) return null
    
    const sids = this.getSIDsForRunway(airport, runway)
    if (sids.length === 0) return null
    
    // Try exact match first
    const exactMatch = sids.find(sid => 
      sid.name.toUpperCase() === vatsimSid.toUpperCase()
    )
    if (exactMatch) return exactMatch.name
    
    // Try partial match (VATSIM might have shortened version)
    const partialMatch = sids.find(sid => 
      sid.name.toUpperCase().startsWith(vatsimSid.toUpperCase()) ||
      vatsimSid.toUpperCase().startsWith(sid.name.toUpperCase())
    )
    if (partialMatch) return partialMatch.name
    
    return null
  }

  // Match SID by first waypoint in route
  matchSIDByFirstWaypoint(airport, runway, route) {
    if (!route) return null
    
    const sids = this.getSIDsForRunway(airport, runway)
    if (sids.length === 0) return null
    
    // Extract first waypoint from route (before first space)
    const firstWaypoint = route.trim().split(/\s+/)[0].toUpperCase()
    if (!firstWaypoint) return null
    
    // Find SID where last waypoint matches first waypoint in route
    const matchingSid = sids.find(sid => {
      if (!sid.route) return false
      
      // Get last waypoint from SID route
      const sidWaypoints = sid.route.trim().split(/\s+/)
      const lastWaypoint = sidWaypoints[sidWaypoints.length - 1].toUpperCase()
      
      return lastWaypoint === firstWaypoint
    })
    
    return matchingSid ? matchingSid.name : null
  }
}

export const sidStarDataService = new SidStarDataService()

