<template>
  <div class="bottom-bar">
    <div class="bottom-left"></div>

    <!-- Center: Creation Buttons -->
    <div class="bottom-center">
      <div class="button-container-horizontal">
        <v-btn
          variant="elevated"
          class="text-btn btn-departure"
          @click="$emit('create-strip', 'departure')"
        >
          NEW DEP
        </v-btn>

        <v-btn
          variant="elevated"
          class="text-btn btn-arrival"
          @click="$emit('create-strip', 'arrival')"
        >
          NEW ARR
        </v-btn>

        <v-btn
          variant="elevated"
          class="text-btn btn-neutral"
          @click="$emit('create-strip', 'neutral')"
        >
          NEW LOCAL
        </v-btn>

        <v-btn
          variant="elevated"
          class="text-btn btn-freetext"
          @click="$emit('create-strip', 'freetext')"
        >
          NEW FREETEXT
        </v-btn>

        <v-btn
          color="grey-darken-1"
          variant="outlined"
          class="text-btn btn-header"
          @click="$emit('create-spacer')"
        >
          NEW HEADER
        </v-btn>
      </div>
    </div>

    <!-- Right: Clock + Trash Zone -->
    <div class="bottom-right">
      <div class="zulu-clock-bottom">
        <span class="zulu-time">{{ zuluTime }}</span>
      </div>
      <div class="button-container-horizontal">
        <div class="trash-zone-wrapper" @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop" @dblclick="handleTrashDoubleClick">
          <VueDraggable
            v-model="trashItems"
            group="strips"
            @add="handleTrashDrop"
            class="trash-zone"
            :class="{ 'trash-zone-active': isDraggingOver }"
            :sort="false"
          >
            <div class="trash-icon-container">
              <v-icon size="32" :color="isDraggingOver ? 'error' : 'grey-darken-1'">
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
  },
  zuluTime: {
    type: String,
    default: '00:00:00'
  }
})

const emit = defineEmits([
  'create-strip',
  'create-spacer',
  'delete-item',
  'update-dep-runway',
  'update-arr-runway',
  'reset-fpb'
])

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

const handleTrashDoubleClick = (event) => {
  event.stopPropagation()
  
  // Show confirmation dialog
  const confirmed = confirm(
    'Are you sure you want to reset the Flight Progress Board?\n\n' +
    'This will:\n' +
    '- Clear all flight strips\n' +
    '- Reset all bay headers to defaults\n' +
    '- Reset runway selections\n\n' +
    'This action cannot be undone.'
  )
  
  if (confirmed) {
    emit('reset-fpb')
  }
}
</script>

<style scoped>
.bottom-bar {
  width: 100%;
  min-width: max-content; /* Allow bottom bar to extend with content */
  background: #1e1e1e;
  border-top: 1px solid #333;
  padding: 6px 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 56px;
  overflow-x: auto;
  overflow-y: hidden;
  position: fixed;
  bottom: 0; /* Position at the very bottom of the window */
  left: 0;
  right: 0;
  z-index: 10; /* Ensure bottom bar is above everything */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3); /* Add shadow to indicate it's above content */
}

.bottom-bar.has-scrollbar {
  bottom: 20px; /* Position above scrollbar when it exists */
}

.bottom-left,
.bottom-center,
.bottom-right {
  display: flex;
  align-items: center;
}

.bottom-left {
  flex: 1;
}

.bottom-center {
  justify-content: center;
  gap: 12px;
  flex: 0 0 auto;
}

.bottom-right {
  flex: 1;
  justify-content: flex-end;
  gap: 16px;
}

.button-container-horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.text-btn {
  height: 40px !important;
  min-width: 100px !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  padding: 0 12px !important;
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

.btn-header {
  color: #fff !important;
  border-color: #757575 !important;
}

.zulu-clock-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  height: 40px;
  padding: 0 16px;
}

.zulu-clock-bottom .zulu-time {
  font-weight: 700;
  font-size: 1.3rem;
}

.trash-zone-wrapper {
  width: 80px;
}

.trash-zone {
  border: 2px dashed #555;
  border-radius: 10px;
  padding: 6px 10px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 40px;
  height: 40px;
  width: 80px;
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

