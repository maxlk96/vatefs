<template>
  <div class="right-sidebar">
    <!-- Airport & Status Section -->
    <div class="sidebar-section">
      <div class="button-container">
        <!-- Airport Button -->
        <v-btn
          color="white"
          variant="elevated"
          class="airport-btn"
          @click="$emit('change-airport')"
        >
          <v-icon class="mr-1" size="small">mdi-airport</v-icon>
          <span class="airport-text">{{ selectedAirport || 'Airport' }}</span>
        </v-btn>
        
        <!-- Runway Selectors -->
        <div class="runway-selectors" v-if="availableRunways.length > 0">
          <v-select
            :model-value="selectedDepRunway"
            :items="availableRunways"
            placeholder="DEP"
            variant="outlined"
            density="compact"
            class="runway-select runway-dep"
            hide-details
            @update:model-value="$emit('update-dep-runway', $event)"
          ></v-select>
          
          <v-select
            :model-value="selectedArrRunway"
            :items="availableRunways"
            placeholder="ARR"
            variant="outlined"
            density="compact"
            class="runway-select runway-arr"
            hide-details
            @update:model-value="$emit('update-arr-runway', $event)"
          ></v-select>
        </div>

        <!-- Status Indicators -->
        <div class="status-indicators">
          <v-tooltip text="Server Connection" location="left">
            <template v-slot:activator="{ props }">
              <div 
                v-bind="props"
                class="status-indicator"
                :class="{ 'status-connected': connectionStatus === 'connected' }"
              >
                <v-icon size="small">mdi-server-network</v-icon>
              </div>
            </template>
          </v-tooltip>
          
          <v-tooltip text="VATSIM Network" location="left">
            <template v-slot:activator="{ props }">
              <div 
                v-bind="props"
                class="status-indicator"
                :class="{ 'status-connected': vatsimConnected }"
              >
                <img 
                  src="https://vatsim.dev/img/logo.png" 
                  alt="VATSIM" 
                  class="vatsim-logo"
                />
              </div>
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>

    <v-divider class="my-2"></v-divider>

    <!-- Creation Buttons -->
    <div class="sidebar-section">
      <div class="button-container">
        <v-tooltip text="Departure Strip" location="left">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="elevated"
              size="large"
              class="icon-btn mb-2 btn-departure"
              @click="$emit('create-strip', 'departure')"
            >
              <v-icon size="large">mdi-airplane-takeoff</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Arrival Strip" location="left">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="elevated"
              size="large"
              class="icon-btn mb-2 btn-arrival"
              @click="$emit('create-strip', 'arrival')"
            >
              <v-icon size="large">mdi-airplane-landing</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="General Strip" location="left">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="elevated"
              size="large"
              class="icon-btn mb-2 btn-neutral"
              @click="$emit('create-strip', 'neutral')"
            >
              <v-icon size="large" style="transform: rotate(45deg);">mdi-airplane</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Freetext Strip" location="left">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="elevated"
              size="large"
              class="icon-btn mb-2 btn-freetext"
              @click="$emit('create-strip', 'freetext')"
            >
              <v-icon size="large">mdi-text-box</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Spacer" location="left">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              color="grey-darken-1"
              variant="outlined"
              size="large"
              class="icon-btn"
              @click="$emit('create-spacer')"
            >
              <v-icon size="large">mdi-minus</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- Trash Zone -->
    <div class="sidebar-section mt-auto">
      <div class="button-container">
        <div 
          class="trash-zone-wrapper"
          @dragenter.prevent="handleDragEnter"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <VueDraggable
            v-model="trashItems"
            group="strips"
            @add="handleTrashDrop"
            class="trash-zone"
            :class="{ 'trash-zone-active': isDraggingOver }"
            :sort="false"
          >
            <div class="trash-icon-container">
              <v-icon 
                size="64" 
                :color="isDraggingOver ? 'error' : 'grey-darken-1'"
              >
                {{ isDraggingOver ? 'mdi-delete' : 'mdi-delete-outline' }}
              </v-icon>
            </div>
          </VueDraggable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  selectedAirport: {
    type: String,
    default: ''
  },
  connectionStatus: {
    type: String,
    default: 'disconnected'
  },
  vatsimConnected: {
    type: Boolean,
    default: false
  },
  selectedDepRunway: {
    type: String,
    default: ''
  },
  selectedArrRunway: {
    type: String,
    default: ''
  },
  availableRunways: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['create-strip', 'create-spacer', 'delete-item', 'change-airport', 'update-dep-runway', 'update-arr-runway'])

const trashItems = ref([])
const isDraggingOver = ref(false)
let dragCounter = 0 // Track nested drag enter/leave events

const handleDragEnter = (event) => {
  dragCounter++
  isDraggingOver.value = true
}

const handleDragOver = (event) => {
  // Keep the drag active
  isDraggingOver.value = true
}

const handleDragLeave = (event) => {
  dragCounter--
  if (dragCounter === 0) {
    isDraggingOver.value = false
  }
}

const handleDrop = (event) => {
  dragCounter = 0
  isDraggingOver.value = false
}

const handleTrashDrop = (event) => {
  dragCounter = 0
  isDraggingOver.value = false
  
  // Get the item that was dropped
  if (trashItems.value.length > 0) {
    const droppedItem = trashItems.value[trashItems.value.length - 1]
    console.log('Item dropped in trash:', droppedItem)
    
    // Emit delete event
    emit('delete-item', droppedItem)
    
    // Clear the trash immediately
    trashItems.value = []
  }
}
</script>

<style scoped>
.right-sidebar {
  width: 120px;
  background: #1e1e1e;
  border-left: 1px solid #333;
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 8px;
}

.airport-btn {
  font-size: 0.75em !important;
  padding: 8px !important;
  min-width: 0 !important;
  width: 96px !important;
  height: auto !important;
  white-space: nowrap;
  margin-bottom: 8px !important;
  color: #000 !important;
}

.airport-text {
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #000 !important;
}

.status-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: #d32f2f;
  transition: background-color 0.3s ease;
}

.status-indicator.status-connected {
  background-color: #4caf50;
}

.vatsim-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.runway-selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: 8px;
  margin-bottom: 8px;
  width: 100%;
}

.runway-select {
  font-size: 0.7rem !important;
}

.runway-dep :deep(.v-field) {
  background-color: #2a9af3 !important;
}

.runway-dep :deep(.v-field__input) {
  color: #fff !important;
  font-weight: 600 !important;
}

.runway-arr :deep(.v-field) {
  background-color: #fdd835 !important;
}

.runway-arr :deep(.v-field__input) {
  color: #000 !important;
  font-weight: 600 !important;
}

.runway-select :deep(.v-field__input) {
  font-size: 0.7rem !important;
  padding: 4px 6px !important;
  min-height: 28px !important;
  text-align: center !important;
}

.icon-btn {
  height: 48px !important;
  width: 80px !important;
  border-radius: 8px !important;
}

.btn-departure {
  background-color: #2a9af3 !important;
  color: #fff !important;
}

.btn-arrival {
  background-color: #fdd835 !important;
  color: #000 !important;
}

.btn-freetext {
  background-color: #f44336 !important;
  color: #fff !important;
}

.btn-neutral {
  background-color: #757575 !important;
  color: #fff !important;
}

.trash-zone-wrapper {
  width: 80px;
}

.trash-zone {
  border: 3px dashed #555;
  border-radius: 12px;
  padding: 24px 12px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trash-zone-active {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.15);
  transform: scale(1.05);
}

.trash-icon-container {
  pointer-events: none; /* Prevent the icon itself from being dragged */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

