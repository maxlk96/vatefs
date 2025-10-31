<template>
  <div class="strip-board">
    <!-- Main Panel -->
    <div class="main-panel">
      <!-- Strips Container with Multiple Bays -->
      <div class="strips-wrapper">
        <div class="bays-container">
          <div 
            v-for="bayIndex in numBays" 
            :key="bayIndex - 1" 
            class="bay-column"
            :data-bay-index="bayIndex - 1"
            @drop="handleBayDrop($event, bayIndex - 1)"
            @dragover.prevent
            @dragenter.prevent
          >
            <VueDraggable
              v-model="bayItemsRefs[bayIndex - 1]"
              :animation="300"
              group="strips"
              handle=".drag-handle"
              @start="onDragStart"
              @end="onDragEnd(bayIndex - 1)"
              @add="handleItemAdd($event, bayIndex - 1)"
              :force-fallback="false"
              :fallback-on-body="true"
              :swap-threshold="0.5"
              class="bay-draggable"
            >
              <template v-for="item in (bayItemsRefs[bayIndex - 1] || [])" :key="item.id">
                <BayHeader
                  v-if="item.type === 'spacer'"
                  :bay-header="item"
                  @update="updateSpacer"
                  @delete="deleteSpacer"
                />
                <FlightStrip
                  v-else
                  :strip="item"
                  :selected-dep-runway="selectedDepRunway"
                  @update-strip="handleStripUpdate"
                />
              </template>
            </VueDraggable>
          </div>
          
        </div>
        
        <!-- Empty State -->
        <div v-if="totalItems === 0" class="empty-state">
          <v-icon size="48" color="grey-darken-2">mdi-tray</v-icon>
          <p class="text-grey-darken-2 text-subtitle-1 mt-2">No strips available</p>
          <p class="text-grey text-caption">Select an airport or create a strip manually</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import FlightStrip from './FlightStrip.vue'
import BayHeader from './BayHeader.vue'

const STRIP_WIDTH = 500
const BAY_GAP = 16

const props = defineProps({
  strips: {
    type: Array,
    required: true
  },
  spacers: {
    type: Array,
    required: true
  },
  selectedDepRunway: {
    type: String,
    default: ''
  },
  selectedArrRunway: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['delete-strip', 'move-item', 'add-spacer', 'strips-reordered', 'spacers-reordered', 'update-strip', 'update-spacer'])

const containerWidth = ref(1000)
let draggedItem = null
let draggedFromBay = null
let skipNextAnimation = false // Skip animation after drag operations

// Use a fixed number of bays based on content, or calculate minimum based on items
// For consistency, calculate based on a fixed minimum width requirement
const minBaysFromContent = computed(() => {
  // Find the highest bay number used by any item
  const maxBay = Math.max(
    ...allItems.value.map(item => item.bay ?? 0),
    0 // Default to at least bay 0
  )
  return maxBay + 1 // Need at least maxBay + 1 bays (0-indexed)
})

// Calculate number of bays that fit in viewport
const numBaysFromViewport = computed(() => {
  const availableWidth = containerWidth.value
  return Math.max(1, Math.floor((availableWidth - BAY_GAP) / (STRIP_WIDTH + BAY_GAP)))
})

// Use the maximum of content-based and viewport-based bays to ensure consistency
const numBays = computed(() => {
  return Math.max(minBaysFromContent.value, numBaysFromViewport.value)
})

// Calculate total width needed for all bays (for horizontal scrolling)
const totalBaysWidth = computed(() => {
  return numBays.value * STRIP_WIDTH + (numBays.value - 1) * BAY_GAP
})

// Combine strips and spacers, defaulting missing bay to 0
const allItems = computed(() => {
  const combined = [
    ...props.spacers.map(spacer => ({ 
      ...spacer, 
      type: 'spacer',
      bay: spacer.bay ?? 0 // Default to bay 0
    })),
    ...props.strips.map(strip => ({ 
      ...strip, 
      type: 'strip',
      bay: strip.position?.bay ?? 0 // Default to bay 0
    }))
  ]
  
  // Sort by bay first, then by order within each bay
  // ARR strips should appear at the top, so they need to sort FIRST (lowest order) before reverse
  // After reverse, they'll be LAST in array, which flex-end positions at the top
  combined.sort((a, b) => {
    const bayA = a.bay ?? 0
    const bayB = b.bay ?? 0
    if (bayA !== bayB) {
      return bayA - bayB
    }
    
    const orderA = a.type === 'spacer' ? (a.order ?? 999) : (a.position?.order ?? 999)
    const orderB = b.type === 'spacer' ? (b.order ?? 999) : (b.position?.order ?? 999)
    return orderA - orderB
  })
  
  return combined
})

// Group items by bay - reactive to ensure updates
const itemsByBay = computed(() => {
  const grouped = {}
  allItems.value.forEach(item => {
    const bay = item.bay ?? 0
    // Clamp bay to valid range
    const validBay = Math.max(0, Math.min(bay, numBays.value - 1))
    if (!grouped[validBay]) {
      grouped[validBay] = []
    }
    grouped[validBay].push(item)
  })
  
  // Sort items within each bay by order
  // ARR strips should appear at the top, so they need to sort FIRST (lowest order) before reverse
  // After reverse, they'll be LAST in array, which flex-end positions at the top
  Object.keys(grouped).forEach(bay => {
    grouped[bay].sort((a, b) => {
      const orderA = a.type === 'spacer' ? (a.order ?? 999) : (a.position?.order ?? 999)
      const orderB = b.type === 'spacer' ? (b.order ?? 999) : (b.position?.order ?? 999)
      return orderA - orderB
    })
  })
  
  // Ensure all bays up to numBays exist
  for (let i = 0; i < numBays.value; i++) {
    if (!grouped[i]) {
      grouped[i] = []
    }
  }
  
  return grouped
})

// Create ref for each bay's items (for VueDraggable v-model)
// Use an array of arrays, where each inner array is reactive
const bayItemsRefs = ref([])

// Sync bayItemsRefs with itemsByBay computed property
watch([itemsByBay, numBays], ([grouped, bayCount]) => {
  // Capture current positions (First) for FLIP animation
  const currentPositions = new Map()
  for (let bay = 0; bay < bayItemsRefs.value.length; bay++) {
    const items = bayItemsRefs.value[bay] || []
    items.forEach((item) => {
      const el = document.querySelector(`[data-strip-id="${item.id}"]`)
      if (el) {
        currentPositions.set(item.id, {
          rect: el.getBoundingClientRect(),
          bay: bay
        })
      }
    })
  }
  
  // Ensure we have arrays for all bays
  while (bayItemsRefs.value.length < bayCount) {
    bayItemsRefs.value.push([])
  }
  
  // Trim if needed
  if (bayItemsRefs.value.length > bayCount) {
    bayItemsRefs.value = bayItemsRefs.value.slice(0, bayCount)
  }
  
  // Update each bay's array (only if not dragging to avoid conflicts)
  if (!draggedItem) {
    for (let i = 0; i < bayCount; i++) {
      if (grouped[i]) {
        // Reverse array so first item (index 0) appears at the bottom
        bayItemsRefs.value[i] = [...grouped[i]].reverse()
      } else {
        bayItemsRefs.value[i] = []
      }
    }
    
    // Skip animation if this update was triggered by a drag operation
    // Don't reset the flag here - let it be reset by the drag handlers after a delay
    // This ensures we catch all watch triggers during and after drag operations
    if (skipNextAnimation) {
      return
    }
    
    // Apply FLIP animation on next frame (Last, Invert, Play)
    // Only animate when items are moved by server updates, not by local drag-and-drop
    nextTick(() => {
      for (let bay = 0; bay < bayCount; bay++) {
        const items = bayItemsRefs.value[bay] || []
        items.forEach((item) => {
          const el = document.querySelector(`[data-strip-id="${item.id}"]`)
          if (!el) return
          
          const currentPos = currentPositions.get(item.id)
          if (!currentPos) return
          
          // Skip if item is in the same bay and we expect it hasn't moved visually
          if (currentPos.bay === bay) {
            // Only animate if position changed significantly
            const newPos = el.getBoundingClientRect()
            const deltaY = Math.abs(currentPos.rect.top - newPos.top)
            const deltaX = Math.abs(currentPos.rect.left - newPos.left)
            
            // Only animate if there's a significant position change (more than 5px)
            // This prevents animation for tiny movements due to layout recalculation
            if (deltaY <= 5 && deltaX <= 5) {
              return
            }
          }
          
          const newPos = el.getBoundingClientRect()
          const deltaY = currentPos.rect.top - newPos.top
          const deltaX = currentPos.rect.left - newPos.left
          
          // Animate if position changed significantly (more than 1px) or bay changed
          const bayChanged = currentPos.bay !== bay
          if (Math.abs(deltaY) > 1 || Math.abs(deltaX) > 1 || bayChanged) {
            // Invert - set element to old position
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`
            el.style.transition = 'none'
            
            // Force a reflow
            el.offsetHeight
            
            // Play - animate to new position
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                el.style.transform = 'translate(0, 0)'
                
                // Clean up after animation
                setTimeout(() => {
                  el.style.transition = ''
                  el.style.transform = ''
                }, 500)
              })
            })
          }
        })
      }
    })
  }
}, { immediate: true, deep: true })

const totalItems = computed(() => allItems.value.length)

// Handle window resize to update bay count
const updateContainerWidth = () => {
  const container = document.querySelector('.strips-wrapper')
  if (container) {
    containerWidth.value = container.clientWidth
  }
}

onMounted(() => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
})

// Watch for changes to strips/spacers
watch([() => props.strips, () => props.spacers], ([newStrips, newSpacers]) => {
  // Update will be handled by computed properties
  updateContainerWidth()
}, { immediate: true, deep: true })

const onDragStart = (event) => {
  // Skip animations immediately when drag starts to prevent animation during drag
  skipNextAnimation = true
  
  // Find which bay this item is in
  const itemElement = event.item
  const stripId = itemElement.getAttribute('data-strip-id')
  
  if (stripId) {
    // Find in allItems
    draggedItem = allItems.value.find(item => 
      (item.type === 'strip' && item.id === parseInt(stripId)) ||
      (item.type === 'spacer' && item.id === stripId)
    )
    
    if (draggedItem) {
      draggedFromBay = draggedItem.bay ?? 0
    }
  }
}

const onDragEnd = (targetBay) => {
  // Skip animation for the next watch update since VueDraggable already reordered items
  skipNextAnimation = true
  
  // Wait for VueDraggable to update the model
  nextTick(() => {
    sendCompleteOrder(targetBay)
    // Keep skipNextAnimation true a bit longer to catch any delayed watch triggers
    setTimeout(() => {
      skipNextAnimation = false
    }, 100)
  })
}

const handleItemAdd = (event, targetBay) => {
  // Skip animation for the next watch update since VueDraggable already moved the item
  skipNextAnimation = true
  
  // Item was added to this bay - VueDraggable has already inserted it
  // We need to detect the final position after the add
  nextTick(() => {
    sendCompleteOrder(targetBay)
    // Keep skipNextAnimation true a bit longer to catch any delayed watch triggers
    setTimeout(() => {
      skipNextAnimation = false
    }, 100)
  })
}

const sendCompleteOrder = (targetBay) => {
  if (!draggedItem) {
    return
  }
  
  // Create complete item list with updated bays and orders from the refs
  const allItemsList = []
  
  // Process all bays from the refs (which reflect the current drag state)
  for (let bay = 0; bay < numBays.value; bay++) {
    const items = bayItemsRefs.value[bay] || []
    // Reverse array back to original order for server
    const reversedItems = [...items].reverse()
    reversedItems.forEach((item, index) => {
      // Update bay - if this is the dragged item, use targetBay, otherwise keep original bay
      const itemBay = (item.id === draggedItem.id && item.type === draggedItem.type) ? targetBay : (item.bay ?? 0)
      const itemOrder = index
      
      allItemsList.push({
        id: item.id,
        type: item.type,
        name: item.name,
        icon: item.icon,
        bay: itemBay,
        order: itemOrder
      })
    })
  }
  
  console.log('Sending complete reorder with bays:', allItemsList)
  
  emit('move-item', {
    itemId: draggedItem.id,
    newOrder: 0,
    allItems: allItemsList
  })
  
  // Reset flags
  draggedItem = null
  draggedFromBay = null
}

const handleBayDrop = (event, bayIndex) => {
  // This handles direct drops on the bay column
  // The VueDraggable component should handle most of this
}

const handleStripUpdate = (updatedStrip) => {
  emit('update-strip', updatedStrip)
}

const updateSpacer = (spacerData) => {
  console.log('Spacer update requested:', spacerData)
  emit('update-spacer', spacerData)
}

const deleteSpacer = (spacerId) => {
  emit('delete-spacer', spacerId)
}

const addSpacer = (name = 'NEW SECTION') => {
  emit('add-spacer', name)
}
</script>

<style scoped>
.strip-board {
  height: 100%;
  background: #9e9e9e;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #9e9e9e;
  min-height: 0; /* Allow flex item to shrink */
  width: max-content !important; /* Allow content to extend beyond viewport */
  min-width: 100%; /* But at least fill viewport */
}

.strips-wrapper {
  flex: 1;
  overflow-y: hidden; /* No vertical scrolling - content shouldn't overflow vertically */
  overflow-x: visible; /* Let parent handle scrolling */
  background: #9e9e9e;
  padding: 8px 8px 80px 8px; /* Add bottom padding to account for bottom bar (72px) + extra margin */
  margin-bottom: 0;
  min-height: 0; /* Allow flex item to shrink */
  position: relative;
  z-index: 1; /* Ensure scrollbar renders above background */
  width: max-content !important; /* Allow content to extend beyond viewport */
  min-width: 100%; /* But at least fill viewport */
}

/* Browser-level scrollbar handled by body in App.vue */

.bays-container {
  position: relative;
  display: flex;
  gap: 16px;
  height: 100%; /* Match parent height */
  min-height: 0; /* Allow flex item to shrink below content size */
  align-items: flex-end;
  width: max-content; /* Allow container to be wider than viewport */
  min-width: 100%; /* At least fill the viewport */
  flex-wrap: nowrap; /* Prevent wrapping - force horizontal scroll */
}

.bay-column {
  position: relative;
  width: 500px;
  height: 100%; /* Match parent height, not viewport height */
  flex-shrink: 0;
  min-height: 0; /* Allow flex item to shrink below content size */
  /* Ensure full height for drop zones */
  display: flex;
  flex-direction: column;
  box-sizing: border-box; /* Ensure width calculation is consistent */
}

.bay-draggable {
  flex: 1;
  min-height: 0; /* Allow flex item to shrink below content size */
  width: 100%;
  overflow-y: auto; /* Allow vertical scrolling within bay if needed */
  /* Make entire area a valid drop zone */
  position: relative;
  /* Ensure items can be dropped anywhere in the list */
  display: flex;
  flex-direction: column; /* Normal column direction for proper dragging */
  justify-content: flex-end; /* Align items to the bottom */
}

/* Style for drag placeholder */
.bay-draggable :deep(.sortable-ghost) {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.2);
}

/* Style for drag over indicator */
.bay-draggable :deep(.sortable-drag) {
  opacity: 0.8;
}

/* Visual Rails between bays - generated based on bay positions only, full height */
/* Rails extend the full height of the bay column, which extends with content */
.bay-column:not(:first-child)::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  min-height: 100%; /* At least full height */
  height: 100%; /* Match column height */
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  z-index: 1;
}

/* Also add a rail at the right edge of the last bay */
.bay-column:last-child::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 0;
  bottom: 0;
  min-height: 100%; /* At least full height */
  height: 100%; /* Match column height */
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  z-index: 1;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  opacity: 0.6;
}

/* Prevent strips and bay headers from breaking */
.bay-draggable > * {
  break-inside: avoid;
  page-break-inside: avoid;
  display: block;
}

.theme--dark .strip-board {
  background: #9e9e9e;
}

.theme--dark .main-panel {
  background: #9e9e9e;
}
</style>
