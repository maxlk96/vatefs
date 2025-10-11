<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
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

      <!-- Right side controls -->
      <div class="d-flex align-center ga-2">
        <!-- Empty for now - controls moved to sidebar -->
      </div>
    </v-app-bar>

    <v-main class="main-with-sidebar">
      <StripBoard 
        ref="stripBoardRef"
        :strips="strips" 
        :spacers="spacers"
        @delete-strip="deleteStrip"
        @move-item="moveItem"
        @add-spacer="handleAddSpacer"
        @delete-spacer="deleteSpacer"
        @strips-reordered="handleStripsReordered"
        @spacers-reordered="handleSpacersReordered"
      />
      
      <!-- Right Sidebar -->
      <RightSidebar
        :selected-airport="selectedAirport"
        :connection-status="connectionStatus"
        :vatsim-connected="vatsimConnected"
        @create-strip="openStripDialog"
        @create-spacer="openSpacerDialog"
        @delete-item="handleDeleteItem"
        @change-airport="reopenAirportSelector"
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
        <v-card-title class="bg-primary">
          <span class="text-h5">
            Create New {{ dialogStripType === 'departure' ? 'DEP' : dialogStripType === 'arrival' ? 'ARR' : 'General' }} Strip
          </span>
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newStrip.callsign"
                  label="Callsign *"
                  variant="outlined"
                  density="comfortable"
                  required
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
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newStrip.stripType"
                  label="Strip Type"
                  :items="[
                    { title: 'Departure (Yellow)', value: 'departure' },
                    { title: 'Arrival (Blue)', value: 'arrival' },
                    { title: 'General (Gray)', value: 'neutral' }
                  ]"
                  variant="outlined"
                  density="comfortable"
                  hint="DEP strips have yellow border, ARR strips have blue"
                  persistent-hint
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.adep"
                  label="Departure (ADEP) *"
                  variant="outlined"
                  density="comfortable"
                  placeholder="ICAO code"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.ades"
                  label="Destination (ADES) *"
                  variant="outlined"
                  density="comfortable"
                  placeholder="ICAO code"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.sid"
                  label="SID"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newStrip.rfl"
                  label="Requested FL (RFL)"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., 350"
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
                  label="Flight Rules (FRUL)"
                  :items="['IFR', 'VFR', 'SVFR']"
                  variant="outlined"
                  density="comfortable"
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
                  v-model="newStrip.eobt"
                  label="EOBT"
                  variant="outlined"
                  density="comfortable"
                  type="time"
                ></v-text-field>
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

    <!-- Add Spacer Dialog -->
    <v-dialog v-model="spacerDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-secondary">
          <span class="text-h5">Create New Spacer</span>
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-text-field
            v-model="newSpacerName"
            label="Spacer Name *"
            variant="outlined"
            density="comfortable"
            placeholder="e.g., CTR, HOLDING, etc."
            required
            autofocus
            @keyup.enter="createSpacer"
          ></v-text-field>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="spacerDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createSpacer">
            Create Spacer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import StripBoard from './components/StripBoard.vue'
import AirportSelector from './components/AirportSelector.vue'
import RightSidebar from './components/RightSidebar.vue'
import { socketService } from './services/socket'
import { vatsimService } from './services/vatsim'
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

const newStrip = ref({
  callsign: '',
  tas: '',
  frul: 'IFR',
  atyp: '',
  assr: '',
  sid: '',
  eobt: '',
  adep: '',
  ades: '',
  rfl: '',
  stripType: 'neutral'
})

const openStripDialog = (type) => {
  dialogStripType.value = type
  newStrip.value.stripType = type
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
    assr: '',
    sid: '',
    eobt: '',
    adep: '',
    ades: '',
    rfl: '',
    stripType: 'neutral'
  }
}

const createStrip = () => {
  if (!newStrip.value.callsign || !newStrip.value.atyp || !newStrip.value.adep || !newStrip.value.ades) {
    alert('Please fill in all required fields')
    return
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

const handleDeleteItem = (item) => {
  console.log('Deleting item:', item)
  if (item.type === 'spacer') {
    deleteSpacer(item.id)
  } else {
    deleteStrip(item.id)
  }
}

const handleStripsReordered = (reorderedStrips) => {
  // Update local strips with server ordering
  strips.value = reorderedStrips.slice() // Create a copy to avoid reference issues
}

const handleSpacersReordered = (reorderedSpacers) => {
  // Update local spacers with server ordering
  spacers.value = reorderedSpacers.slice() // Create a copy to avoid reference issues
}

const handleAddSpacer = () => {
  spacerDialog.value = true
}

const createSpacer = () => {
  if (!newSpacerName.value.trim()) {
    alert('Please enter a spacer name')
    return
  }
  
  // Send spacer creation to server
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
    
    // Clear local strips and spacers (server will send new ones for the new room)
    strips.value = []
    spacers.value = []
  }
  
  selectedAirport.value = data.airport
  vatsimService.setAirport(data.airport)
  vatsimConnected.value = true
  
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
        const stripData = {
          ...vatsimStrip,
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
    const stripData = {
      ...vatsimStrip,
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

onMounted(() => {
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
      strips.value[index] = strip
    }
  })
  
  socketService.on('strips-reordered', (reorderedStrips) => {
    console.log('Strips reordered:', reorderedStrips.length)
    handleStripsReordered(reorderedStrips)
  })
  
  socketService.on('spacers-reordered', (reorderedSpacers) => {
    console.log('Spacers reordered:', reorderedSpacers.length)
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

</style>

