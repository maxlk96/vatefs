<template>
  <div class="strip-board">
    <!-- Main Panel -->
    <div class="main-panel">
      <!-- Airport Info Bar -->
      <div class="airport-info-bar">
        <div class="airport-info">
          <span class="runway-info">RWY: 1</span>
          <span class="traffic-info">DEP {{ getDepartureCount() }} ARR {{ getArrivalCount() }}</span>
        </div>
      </div>
      
      <!-- Strips Container -->
      <div class="strips-wrapper" :style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }">
        <div class="strips-container">
          <VueDraggable
            v-model="allStrips"
            :animation="300"
            group="strips"
            handle=".drag-handle"
            @start="onDragStart"
            @end="onDragEnd"
            class="draggable-area"
          >
            <template v-for="item in allStrips" :key="item.id">
              <StripSpacer
                v-if="item.type === 'spacer'"
                :spacer="item"
                @update="updateSpacer"
                @delete="deleteSpacer"
              />
              <FlightStrip
                v-else
                :strip="item"
                @update="$emit('update-strip', $event)"
                @delete="$emit('delete-strip', $event)"
              />
            </template>
          </VueDraggable>
          
          <!-- Empty State -->
          <div v-if="allStrips.length === 0" class="empty-state">
            <v-icon size="48" color="grey-darken-2">mdi-tray</v-icon>
            <p class="text-grey-darken-2 text-subtitle-1 mt-2">No strips available</p>
            <p class="text-grey text-caption">Select an airport or create a strip manually</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import FlightStrip from './FlightStrip.vue'
import StripSpacer from './StripSpacer.vue'

const props = defineProps({
  strips: {
    type: Array,
    required: true
  },
  spacers: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-strip', 'delete-strip', 'move-item', 'add-spacer', 'strips-reordered', 'spacers-reordered'])

// Use spacers from props instead of local ref

const allStrips = ref([])
const zoomLevel = ref(1.0)

// Store previous positions for FLIP animation
const previousPositions = new Map()
let isLocalDrag = false

// Zoom functions
const increaseZoom = () => {
  if (zoomLevel.value < 1.5) {
    zoomLevel.value = Math.min(1.5, zoomLevel.value + 0.1)
  }
}

const decreaseZoom = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1.0
}

// Combine strips and spacers
watch([() => props.strips, () => props.spacers], ([newStrips, newSpacers]) => {
  console.log('Watch triggered - strips:', newStrips.length, 'spacers:', newSpacers.length)
  console.log('Strips orders:', newStrips.map(s => `${s.callsign}:${s.position?.order}`).join(', '))
  console.log('Spacers orders:', newSpacers.map(s => `${s.name}:${s.order}`).join(', '))
  
  // Skip FLIP animation if this is from a local drag
  if (isLocalDrag) {
    const combined = [
      ...newSpacers.map(spacer => ({ ...spacer, type: 'spacer' })),
      ...newStrips.map(strip => ({ ...strip, type: 'strip' }))
    ]
    combined.sort((a, b) => {
      const orderA = a.type === 'spacer' ? a.order : (a.position?.order ?? 999)
      const orderB = b.type === 'spacer' ? b.order : (b.position?.order ?? 999)
      return orderA - orderB
    })
    console.log('Combined (local drag):', combined.map(c => `${c.id}(${c.type}):${c.type === 'spacer' ? c.order : c.position?.order}`).join(', '))
    allStrips.value = combined
    return
  }
  
  // Capture current positions (First)
  const currentPositions = new Map()
  allStrips.value.forEach((item) => {
    const el = document.querySelector(`[data-strip-id="${item.id}"]`)
    if (el) {
      currentPositions.set(item.id, el.getBoundingClientRect())
    }
  })
  
  const combined = [
    ...newSpacers.map(spacer => ({ ...spacer, type: 'spacer' })),
    ...newStrips.map(strip => ({ ...strip, type: 'strip' }))
  ]
  
  // Sort by order - both strips and spacers now have consistent ordering from server
  combined.sort((a, b) => {
    const orderA = a.type === 'spacer' ? a.order : (a.position?.order ?? 999)
    const orderB = b.type === 'spacer' ? b.order : (b.position?.order ?? 999)
    return orderA - orderB
  })
  
  console.log('Combined (remote):', combined.map(c => `${c.id}(${c.type}):${c.type === 'spacer' ? c.order : c.position?.order}`).join(', '))
  allStrips.value = combined
  
  // Apply FLIP animation on next frame (Last, Invert, Play)
  nextTick(() => {
    combined.forEach((item) => {
      const el = document.querySelector(`[data-strip-id="${item.id}"]`)
      if (!el) return
      
      const currentPos = currentPositions.get(item.id)
      if (!currentPos) return
      
      const newPos = el.getBoundingClientRect()
      const deltaY = currentPos.top - newPos.top
      
      if (Math.abs(deltaY) > 1) {
        // Invert
        el.style.transform = `translateY(${deltaY}px)`
        el.style.transition = 'none'
        
        // Play
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          el.style.transform = 'translateY(0)'
        })
      }
    })
  })
}, { immediate: true, deep: true })

// No need for this watch since spacers are now server-side

const onDragStart = () => {
  // Mark as local drag to skip FLIP animation
  isLocalDrag = true
}

const onDragEnd = () => {
  console.log('Drag ended, current order:', allStrips.value.map(s => `${s.id}(${s.type})`))
  
  // Send complete ordering to server with correct indices
  const allItems = allStrips.value.map((item, index) => {
    console.log(`Item ${item.id} (${item.type}): order ${index}`)
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      icon: item.icon,
      order: index
    }
  })
  
  console.log('Sending complete reorder with', allItems.length, 'items')
  
  emit('move-item', {
    itemId: allItems[0]?.id,
    newOrder: 0,
    allItems: allItems
  })
  
  // Reset flag after a short delay to allow server response
  setTimeout(() => {
    isLocalDrag = false
  }, 200)
}

const addSpacer = (name = 'NEW SECTION') => {
  // This is now handled by the parent component via socketService.createSpacer
  // Just emit the event to the parent
  emit('add-spacer', name)
}

// Method to set zoom level from parent
const setZoomLevel = (level) => {
  zoomLevel.value = level
}

// Expose methods so parent can call them
defineExpose({
  addSpacer,
  setZoomLevel
})

const updateSpacer = (spacerData) => {
  // This would need to be implemented as a server call if we want to sync spacer updates
  console.log('Spacer update requested:', spacerData)
}

const deleteSpacer = (spacerId) => {
  // Emit to parent to handle via socket
  emit('delete-spacer', spacerId)
}

const getDepartureCount = () => {
  return props.strips.filter(s => s.stripType === 'departure').length
}

const getArrivalCount = () => {
  return props.strips.filter(s => s.stripType === 'arrival').length
}
</script>

<style scoped>
.strip-board {
  height: calc(100vh - 48px);
  background: #2d2d2d;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #2d2d2d;
}


.airport-info-bar {
  background: #1976D2;
  padding: 8px 16px;
  color: white;
  font-weight: 600;
  font-size: 0.9em;
  border-bottom: 1px solid #1976D2;
}

.airport-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.runway-info {
  font-weight: 700;
}

.traffic-info {
  font-size: 0.85em;
  opacity: 0.9;
}

.strips-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  background: #2d2d2d;
  transition: transform 0.2s ease;
  padding: 8px;
}

.strips-container {
  min-height: 100%;
}

.draggable-area {
  width: 500px;
  min-height: 100%;
  
  /* CSS columns for multi-column layout when space allows */
  column-width: 500px;
  column-gap: 16px;
  column-fill: auto;
}

/* Enable columns when screen is wide enough for 2+ bays */
@media (min-width: 1100px) {
  .draggable-area {
    column-count: auto;
    max-height: calc(100vh - 120px);
  }
}

/* Prevent strips and spacers from breaking across columns */
.draggable-area > * {
  break-inside: avoid;
  page-break-inside: avoid;
  display: block;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  opacity: 0.6;
}

.theme--dark .strip-board {
  background: #1e1e1e;
}

.theme--dark .main-panel {
  background: #1e1e1e;
}

.theme--dark .strips-container {
  background: #1e1e1e;
}
</style>

