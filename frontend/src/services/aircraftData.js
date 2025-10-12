import axios from 'axios'

class AircraftDataService {
  constructor() {
    this.aircraftData = new Map()
    this.loaded = false
  }

  async loadAircraftData() {
    if (this.loaded) return

    try {
      // Try to load from public directory first, fallback to root data folder
      let response
      try {
        response = await axios.get('/ICAO_Aircraft.txt')
      } catch (e) {
        response = await axios.get('/data/ICAO_Aircraft.txt')
      }
      const lines = response.data.split('\n')
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith(';') || line.trim() === '') continue
        
        // Parse line: ICAO\tWTC_INFO\tMANUFACTURER\tNAME
        const parts = line.split('\t')
        if (parts.length < 2) continue
        
        const icaoCode = parts[0].trim()
        const wtcInfo = parts[1].trim()
        
        // Extract WTC from the wtc info string
        // Format is like: ML2J where first char is WTC
        // L = Light, M = Medium, H = Heavy, J = Super
        const wtc = wtcInfo.charAt(0)
        
        this.aircraftData.set(icaoCode.toUpperCase(), {
          icao: icaoCode,
          wtc: wtc,
          manufacturer: parts[2]?.trim() || '',
          name: parts[3]?.trim() || ''
        })
      }
      
      this.loaded = true
      console.log(`Loaded ${this.aircraftData.size} aircraft types`)
    } catch (error) {
      console.error('Error loading aircraft data:', error)
    }
  }

  getWTC(icaoType) {
    if (!icaoType) return null
    
    const aircraft = this.aircraftData.get(icaoType.toUpperCase())
    return aircraft?.wtc || null
  }

  getAircraftInfo(icaoType) {
    if (!icaoType) return null
    return this.aircraftData.get(icaoType.toUpperCase()) || null
  }
}

export const aircraftDataService = new AircraftDataService()

