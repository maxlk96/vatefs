<template>
  <v-app>
    <v-app-bar color="#1e1e1e" density="compact">
      <!-- Left side - Zoom controls -->
      <div class="d-flex align-center ga-1 ml-2">
        <v-btn 
          icon 
          size="small" 
          variant="text"
          @click="decreaseZoom"
          :disabled="zoomLevel <= 0.5"
        >
          <v-icon size="small">mdi-minus</v-icon>
        </v-btn>
        <v-btn 
          icon 
          size="small" 
          variant="text"
          @click="increaseZoom"
          :disabled="zoomLevel >= 1.5"
        >
          <v-icon size="small">mdi-plus</v-icon>
        </v-btn>
        <v-btn 
          icon 
          size="small" 
          variant="text"
          @click="resetZoom"
        >
          <v-icon size="small">mdi-restore</v-icon>
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <!-- Airport Name in Center -->
      <div class="airport-name-center">
        <span class="airport-name-text">{{ selectedAirport || 'NO AIRPORT SELECTED' }}</span>
      </div>

      <v-spacer></v-spacer>

      <!-- Right side controls - ZULU Clock -->
      <div class="d-flex align-center">
        <div class="zulu-clock">
          <span class="zulu-time">{{ zuluTime }}</span>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-with-sidebar">
      <StripBoard 
        ref="stripBoardRef"
        :strips="strips" 
        :spacers="spacers"
        :selected-dep-runway="selectedDepRunway"
        :selected-arr-runway="selectedArrRunway"
        @delete-strip="deleteStrip"
        @move-item="moveItem"
        @add-spacer="handleAddSpacer"
        @delete-spacer="deleteSpacer"
        @update-strip="handleStripUpdate"
        @update-spacer="handleSpacerUpdate"
        @strips-reordered="handleStripsReordered"
        @spacers-reordered="handleSpacersReordered"
      />
      
      <!-- Right Sidebar -->
      <RightSidebar
        :selected-airport="selectedAirport"
        :connection-status="connectionStatus"
        :vatsim-connected="vatsimConnected"
        :selected-dep-runway="selectedDepRunway"
        :selected-arr-runway="selectedArrRunway"
        :available-runways="availableRunways"
        @create-strip="openStripDialog"
        @create-spacer="openSpacerDialog"
        @delete-item="handleDeleteItem"
        @change-airport="reopenAirportSelector"
        @update-dep-runway="selectedDepRunway = $event"
        @update-arr-runway="selectedArrRunway = $event"
      />
    </v-main>

    <!-- Airport Selector Dialog -->
    <AirportSelector
      v-model="showAirportSelector"
      :current-airport="selectedAirport"
      @airport-selected="handleAirportSelected"
    />

    <!-- Add Strip Dialog -->
    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-title 
          :class="[
            dialogStripType === 'departure' ? 'dialog-header-departure' : 
            dialogStripType === 'arrival' ? 'dialog-header-arrival' : 
            'dialog-header-neutral'
          ]"
        >
          <span class="text-h5">
            Create New {{ dialogStripType === 'departure' ? 'DEP' : dialogStripType === 'arrival' ? 'ARR' : dialogStripType === 'freetext' ? 'Freetext' : 'General' }} Strip
          </span>
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-container>
            <!-- VATSIM Status Alert -->
            <v-alert
              v-if="fetchingVatsimData"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
              Fetching flight plan from VATSIM...
            </v-alert>
            <v-alert
              v-else-if="vatsimDataLoaded"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              ✓ Flight plan loaded from VATSIM
            </v-alert>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newStrip.callsign"
                  label="Callsign *"
                  variant="outlined"
                  density="comfortable"
                  required
                  autofocus
                  class="uppercase-input"
                  @input="newStrip.callsign = newStrip.callsign.toUpperCase()"
                  @keydown.enter="createStrip"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newStrip.atyp"
                  label="Aircraft Type *"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., B738, A320"
                  required
                  class="uppercase-input"
                  @input="newStrip.atyp = newStrip.atyp.toUpperCase()"
                >
                  <template v-slot:append-inner v-if="newStrip.wake">
                    <span class="text-medium-emphasis" style="font-size: 14px; font-weight: 500;">{{ newStrip.wake }}</span>
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.adep"
                  label="Departure (ADEP)"
                  variant="outlined"
                  density="comfortable"
                  placeholder="ICAO code"
                  class="uppercase-input"
                  @input="newStrip.adep = newStrip.adep.toUpperCase()"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.ades"
                  label="Destination (ADES)"
                  variant="outlined"
                  density="comfortable"
                  placeholder="ICAO code"
                  class="uppercase-input"
                  @input="newStrip.ades = newStrip.ades.toUpperCase()"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.sid"
                  label="SID"
                  variant="outlined"
                  density="comfortable"
                  class="uppercase-input"
                  @input="newStrip.sid = newStrip.sid.toUpperCase()"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.rfl"
                  label="Requested FL (RFL)"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., 350"
                  class="uppercase-input"
                  @input="newStrip.rfl = newStrip.rfl.toUpperCase()"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.tas"
                  label="True Air Speed (TAS)"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Knots"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="newStrip.frul"
                  label="Flight Rules (FRUL) *"
                  :items="['IFR', 'VFR', 'SVFR']"
                  variant="outlined"
                  density="comfortable"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newStrip.assr"
                  label="Squawk (ASSR)"
                  variant="outlined"
                  density="comfortable"
                  placeholder="4-digit code"
                  maxlength="4"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="formatEobtForDisplay(newStrip.eobt)"
                  @update:model-value="updateEobt"
                  label="EOBT (Departure Time)"
                  variant="outlined"
                  density="comfortable"
                  type="time"
                  hint="Estimated Off-Block Time from flight plan"
                  persistent-hint
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="newStrip.route"
                  label="Route"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  hint="Full route from VATSIM"
                  persistent-hint
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createStrip">
            Create Strip
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Bay Header Dialog -->
    <v-dialog v-model="spacerDialog" max-width="500">
      <v-card>
        <v-card-title class="dialog-header-neutral">
          <span class="text-h5">Create New Bay Header</span>
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-text-field
            v-model="newSpacerName"
            label="Bay Header Name *"
            variant="outlined"
            density="comfortable"
            placeholder="e.g., CTR, HOLDING, etc."
            required
            autofocus
            class="uppercase-input"
            @input="newSpacerName = newSpacerName.toUpperCase()"
            @keyup.enter="createSpacer"
          ></v-text-field>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="spacerDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createSpacer">
            Create Bay Header
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import StripBoard from './components/StripBoard.vue'
import AirportSelector from './components/AirportSelector.vue'
import RightSidebar from './components/RightSidebar.vue'
import { socketService } from './services/socket'
import { vatsimService } from './services/vatsim'
import { aircraftDataService } from './services/aircraftData'
import { sidStarDataService } from './services/sidstarData'
const dialog = ref(false)
const spacerDialog = ref(false)
const showAirportSelector = ref(true)
const strips = ref([])
const spacers = ref([])
const connectionStatus = ref('disconnected')
const dialogStripType = ref('neutral')
const newSpacerName = ref('')
const stripBoardRef = ref(null)
const selectedAirport = ref('')
const vatsimConnected = ref(false)
const zoomLevel = ref(1.0)
let callsignDebounceTimer = null
const fetchingVatsimData = ref(false)
const vatsimDataLoaded = ref(false)
const selectedDepRunway = ref('')
const selectedArrRunway = ref('')
const availableRunways = ref([])
const zuluTime = ref('')

const newStrip = ref({
  callsign: '',
  tas: '',
  frul: 'IFR',
  atyp: '',
  wake: '',
  assr: '',
  sid: '',
  eobt: '',
  adep: '',
  ades: '',
  rfl: '',
  route: '',
  stand: '',
  ata: '',
  stripType: 'neutral'
})

// Watch for callsign changes to prefill data from VATSIM (with debounce)
watch(() => newStrip.value.callsign, (newCallsign) => {
  // Reset status indicators
  vatsimDataLoaded.value = false
  
  if (!newCallsign || !dialog.value || newCallsign.length < 3) {
    fetchingVatsimData.value = false
    return
  }
  
  // Clear existing timer
  if (callsignDebounceTimer) {
    clearTimeout(callsignDebounceTimer)
  }
  
  // Set new timer to fetch after 500ms of no typing
  callsignDebounceTimer = setTimeout(async () => {
    try {
      fetchingVatsimData.value = true
      console.log(`Fetching VATSIM data for: ${newCallsign}`)
      const vatsimFlight = await vatsimService.getFlightByCallsign(newCallsign)
      
      if (vatsimFlight) {
        // Determine SID based on runway selection and VATSIM data
        let sidToUse = vatsimFlight.sid || ''
        
        // If we have a departure runway selected and an adep
        if (selectedDepRunway.value && vatsimFlight.adep) {
          // Try to match VATSIM SID with available SIDs for the runway
          if (vatsimFlight.sid) {
            const matchedSid = sidStarDataService.matchSID(
              vatsimFlight.adep,
              selectedDepRunway.value,
              vatsimFlight.sid
            )
            if (matchedSid) {
              sidToUse = matchedSid
            }
          } else if (vatsimFlight.route) {
            // No VATSIM SID, try to match by first waypoint in route
            const matchedSid = sidStarDataService.matchSIDByFirstWaypoint(
              vatsimFlight.adep,
              selectedDepRunway.value,
              vatsimFlight.route
            )
            if (matchedSid) {
              sidToUse = matchedSid
            } else {
              // No match found, suggest first available SID for runway
              const availableSids = sidStarDataService.getSIDsForRunway(
                vatsimFlight.adep,
                selectedDepRunway.value
              )
              if (availableSids.length > 0) {
                sidToUse = availableSids[0].name
              }
            }
          } else {
            // No VATSIM SID and no route, suggest first available SID for runway
            const availableSids = sidStarDataService.getSIDsForRunway(
              vatsimFlight.adep,
              selectedDepRunway.value
            )
            if (availableSids.length > 0) {
              sidToUse = availableSids[0].name
            }
          }
        }
        
        // Prefill all fields with VATSIM data
        newStrip.value = {
          ...newStrip.value, // Keep the callsign as typed
          tas: vatsimFlight.tas || '',
          frul: vatsimFlight.frul || 'IFR',
          atyp: vatsimFlight.atyp || '',
          wake: vatsimFlight.wake || '',
          assr: vatsimFlight.assr || '',
          sid: sidToUse,
          eobt: vatsimFlight.eobt || '',
          adep: vatsimFlight.adep || '',
          ades: vatsimFlight.ades || '',
          rfl: vatsimFlight.rfl || '',
          route: vatsimFlight.route || '',
          check1: '',
          check2: '',
          stand: '',
          col3_text: '',
          numeral: '',
          numeral2: '',
          symbol: '',
          stripType: newStrip.value.stripType // Keep the dialog type
        }
        vatsimDataLoaded.value = true
        console.log(`✓ Prefilled from VATSIM: ${vatsimFlight.callsign}`)
      } else {
        console.log(`No VATSIM flight plan found for: ${newCallsign}`)
      }
    } catch (error) {
      console.error('Error fetching VATSIM flight plan:', error)
    } finally {
      fetchingVatsimData.value = false
    }
  }, 500)
})

const openStripDialog = (type) => {
  dialogStripType.value = type
  newStrip.value.stripType = type
  
  // For freetext strips, create immediately without dialog
  if (type === 'freetext') {
    const freetextStrip = {
      freetext: '',
      stripType: 'freetext'
    }
    socketService.createStrip(freetextStrip)
    return
  }
  
  dialog.value = true
}

const openSpacerDialog = () => {
  spacerDialog.value = true
}

const resetForm = () => {
  newStrip.value = {
    callsign: '',
    tas: '',
    frul: 'IFR',
    atyp: '',
    wake: '',
    assr: '',
    sid: '',
    eobt: '',
    adep: '',
    ades: '',
    rfl: '',
    route: '',
    check1: '',
    check2: '',
    stand: '',
    col3_text: '',
    numeral: '',
    numeral2: '',
    symbol: '',
    stripType: 'neutral'
  }
  vatsimDataLoaded.value = false
  fetchingVatsimData.value = false
  if (callsignDebounceTimer) {
    clearTimeout(callsignDebounceTimer)
  }
}

const createStrip = () => {
  if (!newStrip.value.callsign || !newStrip.value.atyp || !newStrip.value.frul) {
    alert('Please fill in all required fields (Callsign, Aircraft Type, Flight Rules)')
    return
  }
  
  // Check for duplicate callsign
  const existingStrip = strips.value.find(s => 
    s.callsign && newStrip.value.callsign &&
    s.callsign.toUpperCase() === newStrip.value.callsign.toUpperCase()
  )
  
  if (existingStrip) {
    const confirmed = confirm(
      `A strip for ${newStrip.value.callsign} already exists.\n\n` +
      `Do you want to overwrite it with the new data?`
    )
    if (!confirmed) {
      return // User cancelled
    }
  }
  
  socketService.createStrip(newStrip.value)
  dialog.value = false
  resetForm()
}

const deleteStrip = (stripId) => {
  socketService.deleteStrip(stripId)
}

const moveItem = (moveData) => {
  socketService.moveItem(moveData)
}

const deleteSpacer = (spacerId) => {
  socketService.deleteSpacer(spacerId)
}

const handleSpacerUpdate = (spacerData) => {
  console.log('Updating bay header:', spacerData)
  socketService.updateSpacer(spacerData)
  
  // Update local bay headers immediately
  const index = spacers.value.findIndex(sp => sp.id === spacerData.id)
  if (index !== -1) {
    spacers.value = [
      ...spacers.value.slice(0, index),
      spacerData,
      ...spacers.value.slice(index + 1)
    ]
  }
}

const handleDeleteItem = (item) => {
  console.log('Deleting item:', item)
  if (item.type === 'spacer') {
    deleteSpacer(item.id)
  } else {
    deleteStrip(item.id)
  }
}

const handleStripUpdate = (updatedStrip) => {
  // Update local strip immediately for instant feedback
  const index = strips.value.findIndex(s => s.id === updatedStrip.id)
  if (index !== -1) {
    strips.value = [
      ...strips.value.slice(0, index),
      updatedStrip,
      ...strips.value.slice(index + 1)
    ]
  }
}

const handleStripsReordered = (reorderedStrips) => {
  // Update local strips with server ordering
  strips.value = reorderedStrips.slice() // Create a copy to avoid reference issues
}

const handleSpacersReordered = (reorderedSpacers) => {
  // Update local bay headers with server ordering
  spacers.value = reorderedSpacers.slice() // Create a copy to avoid reference issues
}

const handleAddSpacer = () => {
  spacerDialog.value = true
}

const createSpacer = () => {
  if (!newSpacerName.value.trim()) {
    alert('Please enter a bay header name')
    return
  }
  
  // Send bay header creation to server (using spacer API endpoint)
  socketService.createSpacer({
    name: newSpacerName.value.trim().toUpperCase(),
    order: spacers.value.length
  })
  
  spacerDialog.value = false
  newSpacerName.value = ''
}

const reopenAirportSelector = () => {
  showAirportSelector.value = true
}

// Zoom functions
const increaseZoom = () => {
  if (zoomLevel.value < 1.5) {
    zoomLevel.value = Math.min(1.5, zoomLevel.value + 0.1)
    updateStripBoardZoom()
  }
}

const decreaseZoom = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1)
    updateStripBoardZoom()
  }
}

const resetZoom = () => {
  zoomLevel.value = 1.0
  updateStripBoardZoom()
}

const updateStripBoardZoom = () => {
  if (stripBoardRef.value) {
    stripBoardRef.value.setZoomLevel(zoomLevel.value)
  }
}

const handleAirportSelected = async (data) => {
  const isChangingAirport = selectedAirport.value && selectedAirport.value !== data.airport
  
  // Stop previous polling if changing airports
  if (isChangingAirport) {
    vatsimService.stopPolling()
    
    // Clear local strips and bay headers (server will send new ones for the new room)
    strips.value = []
    spacers.value = []
  }
  
  selectedAirport.value = data.airport
  vatsimService.setAirport(data.airport)
  vatsimConnected.value = true
  
  // Update available runways for this airport
  const depRunways = sidStarDataService.getRunwaysForAirport(data.airport, 'SID')
  const arrRunways = sidStarDataService.getRunwaysForAirport(data.airport, 'STAR')
  
  // Combine and deduplicate runways
  const allRunways = [...new Set([...depRunways, ...arrRunways])].sort()
  availableRunways.value = allRunways
  
  // Set default runways if available
  if (allRunways.length > 0) {
    selectedDepRunway.value = allRunways[0]
    selectedArrRunway.value = allRunways[0]
  }
  
  // Tell the server we're selecting this airport (join room)
  socketService.selectAirport(data.airport)
  
  // Auto-import existing flight plans if enabled
  if (data.autoImport) {
    // Wait a bit for server to send initial strips
    setTimeout(async () => {
      await importExistingFlights()
    }, 500)
  }
  
  // Start polling for new flights
  vatsimService.startPolling(data.airport, handleNewVatsimFlight, 30000)
}

const importExistingFlights = async () => {
  try {
    const departures = await vatsimService.getDepartures(selectedAirport.value)
    
    departures.forEach(vatsimStrip => {
      // Check if strip already exists
      const exists = strips.value.find(s => s.callsign === vatsimStrip.callsign)
      if (!exists) {
        // Match SID if runway is selected
        let sidToUse = vatsimStrip.sid || ''
        if (selectedDepRunway.value && vatsimStrip.adep) {
          if (vatsimStrip.sid) {
            const matchedSid = sidStarDataService.matchSID(
              vatsimStrip.adep,
              selectedDepRunway.value,
              vatsimStrip.sid
            )
            if (matchedSid) sidToUse = matchedSid
          } else if (vatsimStrip.route) {
            const matchedSid = sidStarDataService.matchSIDByFirstWaypoint(
              vatsimStrip.adep,
              selectedDepRunway.value,
              vatsimStrip.route
            )
            if (matchedSid) sidToUse = matchedSid
          }
        }
        
        const stripData = {
          ...vatsimStrip,
          sid: sidToUse,
          stripType: 'departure'
        }
        socketService.createStrip(stripData)
      }
    })
    
    console.log(`Imported ${departures.length} existing departures from ${selectedAirport.value}`)
  } catch (error) {
    console.error('Error importing existing flights:', error)
  }
}

const handleNewVatsimFlight = (vatsimStrip) => {
  // Check if strip already exists
  const exists = strips.value.find(s => s.callsign === vatsimStrip.callsign)
  if (!exists) {
    // Match SID if runway is selected
    let sidToUse = vatsimStrip.sid || ''
    if (selectedDepRunway.value && vatsimStrip.adep) {
      if (vatsimStrip.sid) {
        const matchedSid = sidStarDataService.matchSID(
          vatsimStrip.adep,
          selectedDepRunway.value,
          vatsimStrip.sid
        )
        if (matchedSid) sidToUse = matchedSid
      } else if (vatsimStrip.route) {
        const matchedSid = sidStarDataService.matchSIDByFirstWaypoint(
          vatsimStrip.adep,
          selectedDepRunway.value,
          vatsimStrip.route
        )
        if (matchedSid) sidToUse = matchedSid
      }
    }
    
    const stripData = {
      ...vatsimStrip,
      sid: sidToUse,
      stripType: 'departure'
    }
    socketService.createStrip(stripData)
    console.log(`Auto-created strip for ${vatsimStrip.callsign}`)
  }
}

const clearAllStrips = async () => {
  // Delete all strips
  const stripIds = [...strips.value.map(s => s.id)]
  for (const stripId of stripIds) {
    socketService.deleteStrip(stripId)
  }
  strips.value = []
  console.log(`Cleared all strips for airport change`)
}

// ZULU clock function
const updateZuluTime = () => {
  const now = new Date()
  const zulu = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
  zuluTime.value = zulu.toISOString().substr(11, 8)
}

// EOBT formatting functions
const formatEobtForDisplay = (eobt) => {
  if (!eobt) return ''
  // If already in HH:mm format, return as is
  if (eobt.includes(':')) return eobt
  // Convert HHmm to HH:mm
  if (eobt.length === 4) {
    return `${eobt.substring(0, 2)}:${eobt.substring(2, 4)}`
  }
  return eobt
}

const updateEobt = (value) => {
  if (!value) {
    newStrip.value.eobt = ''
    return
  }
  // Remove colon to store as HHmm
  newStrip.value.eobt = value.replace(':', '')
}

// Watch for ATYP changes to update WTC
watch(() => newStrip.value.atyp, (newAtyp) => {
  if (newAtyp && newAtyp.trim() !== '') {
    const wtc = aircraftDataService.getWTC(newAtyp)
    newStrip.value.wake = wtc || '?'
  } else {
    newStrip.value.wake = ''
  }
})

// Watch dialog close to clear form if not submitted
let dialogWasOpen = false
watch(dialog, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen) {
    // Dialog was closed
    // Reset form when dialog closes (unless it was just created, which already calls resetForm)
    setTimeout(() => {
      if (!isOpen) {
        resetForm()
      }
    }, 100)
  }
  dialogWasOpen = isOpen
})

onMounted(async () => {
  // Load aircraft and SID/STAR data
  await Promise.all([
    aircraftDataService.loadAircraftData(),
    sidStarDataService.loadSidStarData()
  ])
  
  // Start ZULU clock
  updateZuluTime()
  setInterval(updateZuluTime, 1000)
  
  // Connect to WebSocket
  socketService.connect()
  
  // Set up event listeners
  socketService.on('initial-strips', (data) => {
    strips.value = data
    connectionStatus.value = 'connected'
  })
  
  socketService.on('initial-spacers', (data) => {
    spacers.value = data
  })
  
  socketService.on('strip-created', (strip) => {
    // Don't add here - let strips-reordered handle it
    console.log('Strip created:', strip.callsign)
  })
  
  socketService.on('strip-updated', (strip) => {
    const index = strips.value.findIndex(s => s.id === strip.id)
    if (index !== -1) {
      // Force reactivity by creating a new array
      strips.value = [
        ...strips.value.slice(0, index),
        strip,
        ...strips.value.slice(index + 1)
      ]
    }
  })
  
  socketService.on('strips-reordered', (reorderedStrips) => {
    console.log('Strips reordered:', reorderedStrips.length)
    handleStripsReordered(reorderedStrips)
  })
  
  socketService.on('spacers-reordered', (reorderedSpacers) => {
    console.log('Bay headers reordered:', reorderedSpacers.length)
    handleSpacersReordered(reorderedSpacers)
  })
  
  socketService.on('strip-deleted', (stripId) => {
    // Don't remove here - let strips-reordered handle it
    console.log('Strip deleted:', stripId)
  })
  
  socketService.on('connect', () => {
    connectionStatus.value = 'connected'
  })
  
  socketService.on('disconnect', () => {
    connectionStatus.value = 'disconnected'
  })
})

onUnmounted(() => {
  socketService.disconnect()
  vatsimService.stopPolling()
})
</script>

<style>
/* Global styles - non-scoped */
* {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Allow text selection in input fields */
input,
textarea,
[contenteditable="true"] {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}
</style>

<style scoped>
.main-with-sidebar {
  display: flex;
  height: calc(100vh - 48px);
}

.main-with-sidebar > :first-child {
  flex: 1;
  overflow: hidden;
}

.airport-name-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}

.airport-name-text {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: white;
}

.zulu-clock {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  height: 48px;
  padding: 0 16px;
}

.zulu-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
}

/* Dialog header colors */
.dialog-header-departure {
  background-color: #2a9af3 !important;
  color: #fff !important;
}

.dialog-header-arrival {
  background-color: #fdd835 !important;
  color: #000 !important;
}

.dialog-header-neutral {
  background-color: #757575 !important;
  color: #fff !important;
}

/* Auto-capitalize input fields */
.uppercase-input :deep(input) {
  text-transform: uppercase !important;
}

</style>

