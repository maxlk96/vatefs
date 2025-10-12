<template>
  <div 
    class="flight-strip mb-2" 
    :class="[
      `strip-${getStripType()}`
    ]"
    :data-strip-id="strip.id"
  >
    <!-- Template-based content -->
    <div 
      class="strip-content drag-handle"
      v-html="renderedTemplate"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { templateLoader } from '../services/templateLoader'
import { socketService } from '../services/socket'
import { aircraftDataService } from '../services/aircraftData'

const props = defineProps({
  strip: {
    type: Object,
    required: true
  }
})

const templateHtml = ref('')
const isEditingAta = ref(false)
const customAtaValue = ref('')
const isEditingStand = ref(false)
const isEditingColumn1 = ref(false)
const isEditingFreetext = ref(false)
const isEditingCol3 = ref(false)
let ataClickTimer = null

// Store refs to event handlers for cleanup
const eventHandlers = ref(new Map())

// Editing values for column 1
const editValues = ref({
  callsign: '',
  tas: '',
  frul: '',
  atyp: '',
  assr: ''
})

// Load template on mount
onMounted(async () => {
  const templateName = templateLoader.getTemplateForType(getStripType())
  templateHtml.value = await templateLoader.loadTemplate(templateName)
})

// Format strip data for display
const formattedStripData = computed(() => {
  const data = { ...props.strip }
  
  // Format TAS with N0 prefix and 3-digit padding
  if (data.tas && data.tas !== '' && !isNaN(data.tas)) {
    const tasNum = parseInt(data.tas)
    data.tas = `N0${tasNum.toString().padStart(3, '0')}`
  }
  
  // Format FRUL as single letter
  if (data.frul) {
    const route = (data.route || '').toUpperCase()
    const frul = data.frul.toUpperCase()
    
    if (frul === 'IFR') {
      // Check if VFR is in the route
      if (route.includes('VFR')) {
        data.frul = 'Y'
      } else {
        data.frul = 'I'
      }
    } else if (frul === 'VFR') {
      // Check if IFR is in the route
      if (route.includes('IFR')) {
        data.frul = 'Z'
      } else {
        data.frul = 'V'
      }
    } else if (frul === 'SVFR') {
      data.frul = 'S'
    } else {
      // Already a single letter or unknown, keep as is
      data.frul = frul.charAt(0)
    }
  }
  
  // Handle ASSR = 2000 as empty (no squawk assigned)
  if (data.assr === '2000' || data.assr === 2000) {
    data.assr = ''
  }
  
  // Format route: remove SID from beginning if present
  if (data.route && data.sid) {
    const route = data.route.trim()
    const sid = data.sid.trim()
    
    // Check if route starts with SID (with or without trailing space)
    if (route.toUpperCase().startsWith(sid.toUpperCase())) {
      // Remove SID and any following spaces
      data.route = route.substring(sid.length).trim()
    }
  }
  
  // Format RFL: transition level at 5000ft
  if (data.rfl) {
    const rflNum = parseInt(data.rfl)
    if (!isNaN(rflNum)) {
      const flightLevel = Math.floor(rflNum / 100)
      const flString = flightLevel.toString().padStart(3, '0')
      
      if (rflNum >= 5000) {
        // Flight Level (at or above transition level)
        data.rfl_formatted = `F${flString}`
      } else {
        // Altitude (below transition level)
        data.rfl_formatted = `A${flString}`
      }
    }
  }
  
  return data
})

// Render template with strip data
const renderedTemplate = computed(() => {
  if (!templateHtml.value) return ''
  return templateLoader.processTemplate(templateHtml.value, formattedStripData.value)
})

// Cleanup old event listeners
const cleanupEventHandlers = () => {
  eventHandlers.value.forEach((handler) => {
    const { element, event, fn } = handler
    if (element && element.removeEventListener) {
      element.removeEventListener(event, fn)
    }
  })
  eventHandlers.value.clear()
}

// Setup click handlers for interactive fields
const setupClickHandlers = () => {
  // Clean up old handlers first
  cleanupEventHandlers()
  
  // Use nextTick to ensure DOM is ready
  nextTick(() => {
    const stripElement = document.querySelector(`[data-strip-id="${props.strip.id}"]`)
    if (!stripElement) return
    
    // ATA field click handler for arrival strips
    const ataCell = stripElement.querySelector('.ata-cell')
    if (ataCell) {
      ataCell.addEventListener('click', handleAtaClick)
      ataCell.addEventListener('dblclick', handleAtaDoubleClick)
      eventHandlers.value.set('ata-click', { element: ataCell, event: 'click', fn: handleAtaClick })
      eventHandlers.value.set('ata-dblclick', { element: ataCell, event: 'dblclick', fn: handleAtaDoubleClick })
    }
    
    // Stand field click handler
    const standCell = stripElement.querySelector('.stand-cell')
    if (standCell) {
      standCell.addEventListener('click', handleStandClick)
      eventHandlers.value.set('stand-click', { element: standCell, event: 'click', fn: handleStandClick })
    }
    
    // Checkmark click handlers for departure strips
    const checkCells = stripElement.querySelectorAll('.check-cell')
    checkCells.forEach((checkCell, index) => {
      checkCell.addEventListener('click', handleCheckClick)
      eventHandlers.value.set('check-click-' + index, { element: checkCell, event: 'click', fn: handleCheckClick })
    })
    
    // Column 1 double-click for editing all fields
    const editColumn = stripElement.querySelector('.edit-column')
    if (editColumn) {
      // Prevent text selection on double-click
      editColumn.style.userSelect = 'none'
      editColumn.addEventListener('dblclick', handleColumn1DoubleClick)
      eventHandlers.value.set('column1-dblclick', { element: editColumn, event: 'dblclick', fn: handleColumn1DoubleClick })
    }
    
    // Freetext double-click for editing
    const freetextColumn = stripElement.querySelector('.edit-freetext')
    if (freetextColumn) {
      freetextColumn.style.userSelect = 'none'
      freetextColumn.addEventListener('dblclick', handleFreetextDoubleClick)
      eventHandlers.value.set('freetext-dblclick', { element: freetextColumn, event: 'dblclick', fn: handleFreetextDoubleClick })
    }
    
    // Column 3 double-click for editing (general strips)
    const col3Element = stripElement.querySelector('.edit-col3')
    if (col3Element) {
      col3Element.style.userSelect = 'none'
      col3Element.addEventListener('dblclick', handleCol3DoubleClick)
      eventHandlers.value.set('col3-dblclick', { element: col3Element, event: 'dblclick', fn: handleCol3DoubleClick })
    }
  })
}

const emit = defineEmits(['update-strip'])

const handleAtaClick = (event) => {
  event.stopPropagation() // Prevent drag from triggering
  
  // Don't handle if in edit mode
  if (isEditingAta.value) return
  
  // Clear any existing timer
  if (ataClickTimer) {
    clearTimeout(ataClickTimer)
  }
  
  // Delay to allow double-click to take precedence
  ataClickTimer = setTimeout(() => {
    // Toggle ATA: if empty/undefined, set to current minutes; if set, clear it
    const currentAta = props.strip.ata
    let newAta = ''
    
    if (!currentAta || currentAta === '') {
      // Set to Lxx format with current minutes
      const now = new Date()
      const minutes = now.getMinutes().toString().padStart(2, '0')
      newAta = `L${minutes}`
    }
    // else: leave empty to clear
    
    // Update the strip via socket
    const updatedStrip = {
      ...props.strip,
      ata: newAta
    }
    socketService.updateStrip(updatedStrip)
    
    // Emit to parent to update local state immediately
    emit('update-strip', updatedStrip)
  }, 250) // 250ms delay to detect double-click
}

const handleAtaDoubleClick = (event) => {
  event.stopPropagation()
  
  // Clear the single-click timer
  if (ataClickTimer) {
    clearTimeout(ataClickTimer)
    ataClickTimer = null
  }
  
  // Enter edit mode
  isEditingAta.value = true
  customAtaValue.value = ''
  
  // Show input field
  const ataCell = event.currentTarget
  const ataValueSpan = ataCell.querySelector('.ata-value')
  
  if (ataValueSpan) {
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 3
    input.placeholder = 'xx'
    input.className = 'ata-input'
    input.style.cssText = `
      width: 30px;
      text-align: center;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #1976d2;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid #1976d2;
      background: white;
      outline: none;
      padding: 2px;
    `
    
    // Replace span with input
    ataValueSpan.style.display = 'none'
    ataCell.appendChild(input)
    input.focus()
    
    // Real-time validation to prevent invalid lengths
    input.addEventListener('input', (e) => {
      let value = input.value.toUpperCase()
      
      // If starts with L, allow max 3 chars (L + max 2 digits)
      if (value.startsWith('L')) {
        const digits = value.substring(1)
        if (digits.length > 2 || (digits.length > 0 && !/^\d+$/.test(digits))) {
          // Too long or non-numeric, revert
          input.value = value.substring(0, value.length - 1)
        } else {
          input.value = value
        }
      } else {
        // No L, allow max 2 digits
        if (value.length > 2 || !/^\d*$/.test(value)) {
          // Too long or non-numeric, revert
          input.value = value.substring(0, value.length - 1)
        }
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let value = input.value.trim().toUpperCase()
        let newAta = ''
        
        // Check if value starts with L
        if (value.startsWith('L')) {
          // Format: Lx or Lxx (max 3 chars total)
          const digits = value.substring(1)
          if (digits.length > 0 && /^\d{1,2}$/.test(digits)) {
            const paddedValue = digits.padStart(2, '0')
            newAta = `L${paddedValue}`
          }
        } else {
          // Format: x or xx (max 2 chars total, no L)
          if (value.length > 0 && /^\d{1,2}$/.test(value)) {
            const paddedValue = value.padStart(2, '0')
            newAta = `L${paddedValue}`
          }
        }
        
        if (newAta) {
          // Update the strip
          const updatedStrip = {
            ...props.strip,
            ata: newAta
          }
          socketService.updateStrip(updatedStrip)
          emit('update-strip', updatedStrip)
        }
        
        // Clean up
        input.remove()
        ataValueSpan.style.display = ''
        isEditingAta.value = false
      } else if (e.key === 'Escape') {
        // Cancel edit
        input.remove()
        ataValueSpan.style.display = ''
        isEditingAta.value = false
      }
    })
    
    // Handle blur (click outside)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        input.remove()
        ataValueSpan.style.display = ''
        isEditingAta.value = false
      }, 100)
    })
  }
}

const handleStandClick = (event) => {
  event.stopPropagation()
  
  // If already has stand, clear it
  if (props.strip.stand && props.strip.stand !== '') {
    const updatedStrip = {
      ...props.strip,
      stand: ''
    }
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    return
  }
  
  // Enter edit mode for stand entry
  if (isEditingStand.value) return
  
  isEditingStand.value = true
  const standCell = event.currentTarget
  const standValueSpan = standCell.querySelector('.stand-value')
  
  if (standValueSpan) {
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 6
    input.placeholder = 'Stand'
    input.className = 'stand-input'
    input.style.cssText = `
      width: 80px;
      text-align: center;
      font-family: 'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive;
      color: #000;
      font-size: 32px;
      font-weight: bold;
      font-style: italic;
      border: 2px solid #000;
      background: white;
      outline: none;
      padding: 2px;
      text-transform: uppercase;
    `
    
    // Replace span with input
    standValueSpan.style.display = 'none'
    standCell.appendChild(input)
    input.focus()
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim().toUpperCase()
        if (value.length > 0) {
          // Update the strip
          const updatedStrip = {
            ...props.strip,
            stand: value
          }
          socketService.updateStrip(updatedStrip)
          emit('update-strip', updatedStrip)
        }
        
        // Clean up
        input.remove()
        standValueSpan.style.display = ''
        isEditingStand.value = false
      } else if (e.key === 'Escape') {
        // Cancel edit
        input.remove()
        standValueSpan.style.display = ''
        isEditingStand.value = false
      }
    })
    
    // Handle blur (click outside)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        input.remove()
        standValueSpan.style.display = ''
        isEditingStand.value = false
      }, 100)
    })
  }
}

const handleCheckClick = (event) => {
  event.stopPropagation()
  
  const checkCell = event.currentTarget
  const fieldName = checkCell.dataset.field // 'check1' or 'check2'
  
  // Toggle checkmark: if empty/undefined, add checkmark; if set, clear it
  const currentValue = props.strip[fieldName]
  let newValue = ''
  
  if (!currentValue || currentValue === '') {
    newValue = '✓'
  }
  // else: leave empty to clear
  
  // Update the strip
  const updatedStrip = {
    ...props.strip,
    [fieldName]: newValue
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleColumn1DoubleClick = async (event) => {
  event.stopPropagation()
  event.preventDefault()
  
  if (isEditingColumn1.value) return
  
  console.log('Column 1 double-clicked for strip:', props.strip.callsign)
  
  // Initialize edit values
  editValues.value = {
    callsign: props.strip.callsign || '',
    tas: props.strip.tas || '',
    frul: props.strip.frul || '',
    atyp: props.strip.atyp || '',
    assr: props.strip.assr || ''
  }
  
  isEditingColumn1.value = true
  
  // Create overlay editor
  const stripElement = document.querySelector(`[data-strip-id="${props.strip.id}"]`)
  if (!stripElement) return
  
  const overlay = document.createElement('div')
  overlay.className = 'column1-editor'
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 300px;
    background: white;
    border: 3px solid #1976d2;
    border-radius: 8px;
    padding: 16px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `
  
  const isDeparture = getStripType() === 'departure'
  
  overlay.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 12px; color: #1976d2; font-size: 14px;">Edit Strip Data</div>
    <div style="margin-bottom: 8px;">
      <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 2px;">Callsign</label>
      <input id="edit-callsign" type="text" value="${editValues.value.callsign}" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; text-transform: uppercase;">
    </div>
    ${isDeparture ? `
    <div style="margin-bottom: 8px;">
      <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 2px;">TAS</label>
      <input id="edit-tas" type="text" value="${editValues.value.tas}" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
    </div>
    ` : ''}
    <div style="margin-bottom: 8px;">
      <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 2px;">FRUL</label>
      <select id="edit-frul" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <option value="IFR" ${editValues.value.frul === 'IFR' ? 'selected' : ''}>IFR</option>
        <option value="VFR" ${editValues.value.frul === 'VFR' ? 'selected' : ''}>VFR</option>
        <option value="SVFR" ${editValues.value.frul === 'SVFR' ? 'selected' : ''}>SVFR</option>
      </select>
    </div>
    <div style="margin-bottom: 8px;">
      <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 2px;">Aircraft Type</label>
      <input id="edit-atyp" type="text" value="${editValues.value.atyp}" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; text-transform: uppercase;">
    </div>
    <div style="margin-bottom: 12px;">
      <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 2px;">Squawk (ASSR)</label>
      <input id="edit-assr" type="text" value="${editValues.value.assr}" maxlength="4" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="edit-cancel" style="padding: 6px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Cancel</button>
      <button id="edit-save" style="padding: 6px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Save</button>
    </div>
  `
  
  stripElement.appendChild(overlay)
  
  // Focus first input
  const callsignInput = overlay.querySelector('#edit-callsign')
  if (callsignInput) callsignInput.focus()
  
  // Save handler
  const saveBtn = overlay.querySelector('#edit-save')
  saveBtn.addEventListener('click', () => {
    const callsign = overlay.querySelector('#edit-callsign').value.trim().toUpperCase()
    const frul = overlay.querySelector('#edit-frul').value
    const atyp = overlay.querySelector('#edit-atyp').value.trim().toUpperCase()
    const assr = overlay.querySelector('#edit-assr').value.trim()
    
    if (!callsign || !atyp || !frul) {
      alert('Callsign, Aircraft Type, and Flight Rules are required')
      return
    }
    
    const updatedData = {
      callsign,
      frul,
      atyp,
      assr
    }
    
    if (isDeparture) {
      const tas = overlay.querySelector('#edit-tas').value.trim()
      updatedData.tas = tas
    }
    
    // Update WTC based on new ATYP
    const wtc = aircraftDataService.getWTC(atyp)
    updatedData.wake = wtc || '?'
    
    const updatedStrip = {
      ...props.strip,
      ...updatedData
    }
    
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    
    overlay.remove()
    isEditingColumn1.value = false
  })
  
  // Cancel handler
  const cancelBtn = overlay.querySelector('#edit-cancel')
  cancelBtn.addEventListener('click', () => {
    overlay.remove()
    isEditingColumn1.value = false
  })
  
  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove()
      isEditingColumn1.value = false
      document.removeEventListener('keydown', handleEscape)
    }
  }
  document.addEventListener('keydown', handleEscape)
}

const handleFreetextDoubleClick = (event) => {
  event.stopPropagation()
  event.preventDefault()
  
  if (isEditingFreetext.value) return
  
  isEditingFreetext.value = true
  
  const freetextContainer = event.currentTarget
  const freetextValueSpan = freetextContainer.querySelector('.freetext-value')
  
  if (freetextValueSpan) {
    // Create textarea element
    const textarea = document.createElement('textarea')
    textarea.value = props.strip.freetext || ''
    textarea.className = 'freetext-input'
    textarea.style.cssText = `
      width: 100%;
      height: 50px;
      padding: 8px;
      border: 2px solid #f44336;
      background: white;
      outline: none;
      resize: none;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #000;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
    `
    
    // Replace span with textarea
    freetextValueSpan.style.display = 'none'
    freetextContainer.appendChild(textarea)
    textarea.focus()
    textarea.select()
    
    // Handle Enter key (Ctrl+Enter to save, Esc to cancel)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        saveFreetext(textarea.value)
        textarea.remove()
        freetextValueSpan.style.display = ''
        isEditingFreetext.value = false
      } else if (e.key === 'Escape') {
        textarea.remove()
        freetextValueSpan.style.display = ''
        isEditingFreetext.value = false
      }
    })
    
    // Handle blur (click outside)
    textarea.addEventListener('blur', () => {
      setTimeout(() => {
        saveFreetext(textarea.value)
        textarea.remove()
        freetextValueSpan.style.display = ''
        isEditingFreetext.value = false
      }, 100)
    })
  }
}

const saveFreetext = (text) => {
  const updatedStrip = {
    ...props.strip,
    freetext: text.trim()
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleCol3DoubleClick = (event) => {
  event.stopPropagation()
  event.preventDefault()
  
  if (isEditingCol3.value) return
  
  isEditingCol3.value = true
  
  const col3Container = event.currentTarget
  const col3ValueSpan = col3Container.querySelector('.sid-large')
  
  if (col3ValueSpan) {
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.value = props.strip.col3_text || ''
    input.maxLength = 10
    input.className = 'col3-input'
    input.style.cssText = `
      width: 90%;
      padding: 4px 8px;
      border: 2px solid #757575;
      background: white;
      outline: none;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    `
    
    // Replace span with input
    col3ValueSpan.style.display = 'none'
    col3Container.appendChild(input)
    input.focus()
    input.select()
    
    // Auto-uppercase
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase()
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveCol3(input.value)
        cleanup()
      } else if (e.key === 'Escape') {
        cleanup()
      }
    })
    
    // Handle blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        saveCol3(input.value)
        cleanup()
      }, 100)
    })
    
    const saveCol3 = (text) => {
      const updatedStrip = {
        ...props.strip,
        col3_text: text.trim()
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
    }
    
    const cleanup = () => {
      input.remove()
      col3ValueSpan.style.display = ''
      isEditingCol3.value = false
    }
  }
}

// Watch for template changes to setup click handlers
watch(renderedTemplate, () => {
  setupClickHandlers()
})

// Watch for strip ID changes to re-setup handlers (component reuse)
watch(() => props.strip.id, () => {
  setupClickHandlers()
})

// Cleanup on unmount
onUnmounted(() => {
  cleanupEventHandlers()
})

const getFlightRuleColor = (frul) => {
  switch (frul) {
    case 'IFR': return 'blue'
    case 'VFR': return 'green'
    case 'SVFR': return 'orange'
    default: return 'grey'
  }
}

const getStripType = () => {
  // Determine if it's a departure or arrival based on the strip data
  if (props.strip.stripType) {
    return props.strip.stripType
  }
  // Auto-detect based on fields
  if (props.strip.sid) {
    return 'departure'
  }
  // Default to neutral
  return 'neutral'
}
</script>

<style scoped>
.flight-strip {
  background: #e8e8e8;
  margin-bottom: 2px;
  cursor: grab;
  position: relative;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  width: 500px;
}

.theme--dark .flight-strip {
  background: #e8e8e8;
}

.strip-departure {
  border-left: 8px solid #2a9af3;
  border-right: 8px solid #2a9af3;
  border-top: 3px solid #2a9af3;
  border-bottom: 3px solid #2a9af3;
}

.strip-arrival {
  border-left: 8px solid #fdd835;
  border-right: 8px solid #fdd835;
  border-top: 3px solid #fdd835;
  border-bottom: 3px solid #fdd835;
}

.strip-neutral {
  border-left: 8px solid #757575;
  border-right: 8px solid #757575;
  border-top: 3px solid #757575;
  border-bottom: 3px solid #757575;
}

.strip-freetext {
  border-left: 8px solid #f44336;
  border-right: 8px solid #f44336;
  border-top: 3px solid #f44336;
  border-bottom: 3px solid #f44336;
}

.flight-strip:hover {
  background: #f0f0f0;
}

.flight-strip:active {
  cursor: grabbing;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.strip-content {
  padding: 6px 8px;
  cursor: grab;
}

.strip-content:active {
  cursor: grabbing;
}

.strip-field {
  padding: 1px 3px;
}

/* Template-based layout styles */
:deep(.strip-layout) {
  width: 100%;
}

:deep(.strip-header-row) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

:deep(.strip-row) {
  display: flex;
  gap: 8px;
  margin: 2px 0;
}

:deep(.field-group) {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

:deep(.field-group.flex-1) {
  flex: 1;
}

:deep(.field-group.flex-2) {
  flex: 2;
}

:deep(.field-group.callsign-group) {
  flex: 1;
}

:deep(.field-group.frul-chip),
:deep(.field-group.wake-badge) {
  flex: 0 0 auto;
}

.field-label {
  font-size: 0.55em;
  font-weight: 600;
  color: #B0BEC5;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 1px;
  font-family: 'Courier New', monospace;
}

:deep(.field-label) {
  font-size: 0.55em;
  font-weight: 600;
  color: #B0BEC5;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 1px;
  font-family: 'Courier New', monospace;
}

.field-value {
  font-size: 0.75em;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

:deep(.field-value) {
  font-size: 0.75em;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.field-value.callsign) {
  font-size: 0.9em;
  font-weight: bold;
  letter-spacing: 0.02em;
}

:deep(.field-value.highlight) {
  color: #FDD835;
}

:deep(.field-value.airport) {
  color: #42A5F5;
}

:deep(.field-value.route) {
  color: #66BB6A;
}

:deep(.field-value.time) {
  color: #FF9800;
}

:deep(.chip) {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65em;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

:deep(.chip-IFR) {
  background-color: #1976D2;
  color: white;
}

:deep(.chip-VFR) {
  background-color: #4CAF50;
  color: white;
}

:deep(.chip-SVFR) {
  background-color: #FF9800;
  color: white;
}

:deep(.badge) {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.6em;
  font-weight: 700;
  background-color: #757575;
  color: white;
  font-family: 'Courier New', monospace;
}

.strip-divider {
  height: 1px;
  background: #555;
  margin: 2px 0;
}

:deep(.strip-divider) {
  height: 1px;
  background: #555;
  margin: 2px 0;
}

.theme--dark .flight-strip {
  background: #e8e8e8;
}

.theme--dark .strip-divider {
  background: #555;
}
</style>

