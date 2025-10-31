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
import { ref, computed, onMounted, onUnmounted, nextTick, watch, inject } from 'vue'
import { templateLoader } from '../services/templateLoader'
import { socketService } from '../services/socket'
import { aircraftDataService } from '../services/aircraftData'
import { sidStarDataService } from '../services/sidstarData'

const props = defineProps({
  strip: {
    type: Object,
    required: true
  },
  selectedDepRunway: {
    type: String,
    default: ''
  }
})

const templateHtml = ref('')
const isEditingAta = ref(false)
const customAtaValue = ref('')
const isEditingStand = ref(false)
const isEditingColumn1 = ref(false)
const isEditingFreetext = ref(false)
const isEditingPushback = ref(false)
const isEditingCol3 = ref(false)
const isEditingSid = ref(false)
const isEditingNumeral = ref(false)
const isEditingNumeral2 = ref(false)
const isEditingTimeMinutes = ref(false)
const isEditingCol6Freetext = ref(false)
const isEditingAtaMinutes = ref(false)
let ataClickTimer = null
let numeralClickTimer = null
let numeral2ClickTimer = null
let timeMinutesClickTimer = null
let pushbackClickTimer = null
let ataRightClickTimer = null

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
  
  // Format symbol for rendering
  data.symbol_svg = ''
  if (data.symbol === 'vertical') {
    data.symbol_svg = '<line x1="10" y1="0" x2="10" y2="20" stroke="#f44336" stroke-width="2"/>'
  } else if (data.symbol === 'T') {
    data.symbol_svg = '<line x1="10" y1="0" x2="10" y2="20" stroke="#f44336" stroke-width="2"/><line x1="0" y1="20" x2="20" y2="20" stroke="#f44336" stroke-width="2"/>'
  }
  
  // Format pushback indicator for departure strips
  data.pushback_indicator = ''
  if (data.pushbackArrow === 'right') {
    data.pushback_indicator = '<span class="pushback-indicator">→</span>'
  } else if (data.pushbackArrow === 'left') {
    data.pushback_indicator = '<span class="pushback-indicator">←</span>'
  }
  
  // Format pushback freetext (separate from arrows)
  data.pushback_freetext = ''
  if (data.pushbackFreetext && data.pushbackFreetext !== '') {
    data.pushback_freetext = `<span class="pushback-freetext-value">${data.pushbackFreetext.substring(0, 3)}</span>`
  }
  
  // Format blue dash for symbol cell
  data.blue_dash_svg = ''
  if (data.blueDash) {
    data.blue_dash_svg = '-'
  }
  
  // Format diagonal line for callsign box
  data.diagonal_line_svg = ''
  if (data.diagonalLine) {
    // Create SVG line from bottom left to top right of the callsign box
    data.diagonal_line_svg = '<svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; overflow: visible;"><line x1="0" y1="100%" x2="100%" y2="0" stroke="#1976d2" stroke-width="2"/></svg>'
  }
  
  // Time minutes (just pass through)
  data.time_minutes = data.timeMinutes || ''
  
  // Column 6 freetext (just pass through)
  data.col6_freetext = data.col6Freetext || ''
  
  // Format ATA for arrival strips: split L indicator and minutes
  data.ata_l_indicator = ''
  data.ata_minutes = ''
  if (data.ata) {
    const ataMatch = data.ata.match(/^L(\d{2})$/)
    if (ataMatch) {
      data.ata_l_indicator = 'L'
      data.ata_minutes = ataMatch[1]
    } else if (data.ata === 'L') {
      data.ata_l_indicator = 'L'
      data.ata_minutes = ''
    }
  }
  
  // Format curved arrow for arrival strips (pointing left to right with upward sweep)
  data.curved_arrow_svg = ''
  if (data.curvedArrow) {
    // Create curved arrow SVG (starts left, dips down slightly, then sweeps significantly upwards to right)
    data.curved_arrow_svg = '<svg class="curved-arrow-svg" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M 10 25 Q 30 50, 50 45 T 90 15" stroke="#1976d2" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/><defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#1976d2"/></marker></defs></svg>'
  }
  
  // Format diagonal line for arrival strips (only if curved arrow is selected)
  data.diagonal_line_svg_arr = ''
  if (data.diagonalLineArr && data.curvedArrow) {
    // Create SVG line from bottom left to top right of the callsign box
    data.diagonal_line_svg_arr = '<svg class="diagonal-line-arr" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; overflow: visible;"><line x1="0" y1="100%" x2="100%" y2="0" stroke="#1976d2" stroke-width="2"/></svg>'
  }
  
  // Format WTC circle (red circle around WTC if not M)
  data.wtc_circle_svg = ''
  if (data.wake && data.wake.toUpperCase() !== 'M') {
    // Create SVG circle around WTC badge, centered on the text
    // The circle should be slightly larger than the text (approximately 14px diameter for 12px text)
    data.wtc_circle_svg = '<svg class="wtc-circle-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="#f44336" stroke-width="1.5" fill="none"/></svg>'
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
    
    // ATA field click handlers for arrival strips (split into L and minutes)
    if (getStripType() === 'arrival') {
      const ataLeftCell = stripElement.querySelector('.ata-left-cell')
      if (ataLeftCell) {
        ataLeftCell.addEventListener('click', handleAtaLeftClick)
        eventHandlers.value.set('ata-left-click', { element: ataLeftCell, event: 'click', fn: handleAtaLeftClick })
      }
      
      const ataRightCell = stripElement.querySelector('.ata-right-cell')
      if (ataRightCell) {
        ataRightCell.addEventListener('click', handleAtaRightClick)
        ataRightCell.addEventListener('dblclick', handleAtaRightDoubleClick)
        eventHandlers.value.set('ata-right-click', { element: ataRightCell, event: 'click', fn: handleAtaRightClick })
        eventHandlers.value.set('ata-right-dblclick', { element: ataRightCell, event: 'dblclick', fn: handleAtaRightDoubleClick })
      }
      
      // Curved arrow click handler
      const curvedArrowCell = stripElement.querySelector('.column3-bottom-curved-arrow')
      if (curvedArrowCell) {
        curvedArrowCell.addEventListener('click', handleCurvedArrowClick)
        eventHandlers.value.set('curved-arrow-click', { element: curvedArrowCell, event: 'click', fn: handleCurvedArrowClick })
      }
      
      // Callsign box click handler (for diagonal line, only if curved arrow is selected)
      const callsignBoxArr = stripElement.querySelector('.callsign-column-arr')
      if (callsignBoxArr) {
        callsignBoxArr.addEventListener('click', handleCallsignBoxArrClick)
        eventHandlers.value.set('callsign-box-arr-click', { element: callsignBoxArr, event: 'click', fn: handleCallsignBoxArrClick })
      }
    } else {
      // Keep old ATA handler for non-arrival strips
      const ataCell = stripElement.querySelector('.ata-cell')
      if (ataCell) {
        ataCell.addEventListener('click', handleAtaClick)
        ataCell.addEventListener('dblclick', handleAtaDoubleClick)
        eventHandlers.value.set('ata-click', { element: ataCell, event: 'click', fn: handleAtaClick })
        eventHandlers.value.set('ata-dblclick', { element: ataCell, event: 'dblclick', fn: handleAtaDoubleClick })
      }
    }
    
    // Pushback field click handlers (departure strips only)
    if (getStripType() === 'departure') {
      const pushbackCell = stripElement.querySelector('.pushback-cell')
      if (pushbackCell) {
        pushbackCell.addEventListener('click', handlePushbackClick)
        pushbackCell.addEventListener('dblclick', handlePushbackDoubleClick)
        eventHandlers.value.set('pushback-click', { element: pushbackCell, event: 'click', fn: handlePushbackClick })
        eventHandlers.value.set('pushback-dblclick', { element: pushbackCell, event: 'dblclick', fn: handlePushbackDoubleClick })
      }
      
      // Stand field click handler (right part of stand box)
      const standCell = stripElement.querySelector('.stand-cell-right')
      if (standCell) {
        standCell.addEventListener('click', handleStandClick)
        eventHandlers.value.set('stand-click', { element: standCell, event: 'click', fn: handleStandClick })
      }
    } else {
      // For non-departure strips, use original stand-cell
      const standCell = stripElement.querySelector('.stand-cell')
      if (standCell) {
        standCell.addEventListener('click', handleStandClick)
        eventHandlers.value.set('stand-click', { element: standCell, event: 'click', fn: handleStandClick })
      }
    }
    
    // Callsign box click handler (departure strips only)
    if (getStripType() === 'departure') {
      const callsignBox = stripElement.querySelector('.callsign-column')
      if (callsignBox) {
        callsignBox.addEventListener('click', handleCallsignBoxClick)
        eventHandlers.value.set('callsign-box-click', { element: callsignBox, event: 'click', fn: handleCallsignBoxClick })
      }
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
    
    // SID field double-click for manual selection (departure strips)
    const sidElement = stripElement.querySelector('.edit-sid')
    if (sidElement) {
      sidElement.style.userSelect = 'none'
      sidElement.addEventListener('dblclick', handleSidDoubleClick)
      eventHandlers.value.set('sid-dblclick', { element: sidElement, event: 'dblclick', fn: handleSidDoubleClick })
    }
    
    // Numeral field click and double-click (general strips)
    const numeralCell = stripElement.querySelector('.numeral-cell')
    if (numeralCell) {
      numeralCell.addEventListener('click', handleNumeralClick)
      numeralCell.addEventListener('dblclick', handleNumeralDoubleClick)
      eventHandlers.value.set('numeral-click', { element: numeralCell, event: 'click', fn: handleNumeralClick })
      eventHandlers.value.set('numeral-dblclick', { element: numeralCell, event: 'dblclick', fn: handleNumeralDoubleClick })
    }
    
    // Symbol field click handlers
    if (getStripType() === 'departure') {
      // For departure strips: left and right click areas (merged into two parts)
      const symbolLeftCell = stripElement.querySelector('.col2-left-blue')
      if (symbolLeftCell) {
        symbolLeftCell.addEventListener('click', handleSymbolLeftClick)
        eventHandlers.value.set('symbol-left-click', { element: symbolLeftCell, event: 'click', fn: handleSymbolLeftClick })
      }
      
      const symbolRightCell = stripElement.querySelector('.col2-right-blue')
      if (symbolRightCell) {
        symbolRightCell.addEventListener('click', handleSymbolRightClick)
        symbolRightCell.addEventListener('dblclick', handleSymbolRightDoubleClick)
        eventHandlers.value.set('symbol-right-click', { element: symbolRightCell, event: 'click', fn: handleSymbolRightClick })
        eventHandlers.value.set('symbol-right-dblclick', { element: symbolRightCell, event: 'dblclick', fn: handleSymbolRightDoubleClick })
      }
    } else {
      // For other strips: original symbol cell behavior
      const symbolCell = stripElement.querySelector('.symbol-cell')
      if (symbolCell) {
        symbolCell.addEventListener('click', handleSymbolClick)
        eventHandlers.value.set('symbol-click', { element: symbolCell, event: 'click', fn: handleSymbolClick })
      }
    }
    
    // Numeral2 field click and double-click (departure strips)
    const numeral2Cell = stripElement.querySelector('.numeral2-cell')
    if (numeral2Cell) {
      numeral2Cell.addEventListener('click', handleNumeral2Click)
      numeral2Cell.addEventListener('dblclick', handleNumeral2DoubleClick)
      eventHandlers.value.set('numeral2-click', { element: numeral2Cell, event: 'click', fn: handleNumeral2Click })
      eventHandlers.value.set('numeral2-dblclick', { element: numeral2Cell, event: 'dblclick', fn: handleNumeral2DoubleClick })
    }
    
    // Column 6 freetext field click handler (departure strips only)
    if (getStripType() === 'departure') {
      const col6FreetextWrapper = stripElement.querySelector('.col6-freetext-wrapper')
      if (col6FreetextWrapper) {
        col6FreetextWrapper.addEventListener('click', handleCol6FreetextClick)
        eventHandlers.value.set('col6-freetext-click', { element: col6FreetextWrapper, event: 'click', fn: handleCol6FreetextClick })
      }
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

// Arrival strip handlers
const handleAtaLeftClick = (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  // Toggle L indicator
  const currentAta = props.strip.ata || ''
  let newAta = ''
  
  if (currentAta === 'L' || currentAta.startsWith('L')) {
    // Clear L (and minutes if present)
    newAta = ''
  } else {
    // Set L only (no minutes yet)
    newAta = 'L'
  }
  
  const updatedStrip = {
    ...props.strip,
    ata: newAta
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleAtaRightClick = (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  // Don't handle if in edit mode
  if (isEditingAtaMinutes.value) return
  
  // Clear any existing timer
  if (ataRightClickTimer) {
    clearTimeout(ataRightClickTimer)
    ataRightClickTimer = null
  }
  
  // Delay to allow double-click to take precedence
  ataRightClickTimer = setTimeout(() => {
    // Only insert time if L is selected
    const currentAta = props.strip.ata || ''
    if (!currentAta || !currentAta.startsWith('L')) {
      return // L must be selected first
    }
    
    // Add current minutes
    const now = new Date()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const newAta = `L${minutes}`
    
    const updatedStrip = {
      ...props.strip,
      ata: newAta
    }
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    
    ataRightClickTimer = null
  }, 250) // 250ms delay to detect double-click
}

const handleAtaRightDoubleClick = (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  // Clear the single-click timer
  if (ataRightClickTimer) {
    clearTimeout(ataRightClickTimer)
    ataRightClickTimer = null
  }
  
  // Enter edit mode
  isEditingAtaMinutes.value = true
  
  // Show input field
  const ataRightCell = event.currentTarget
  const ataMValueSpan = ataRightCell.querySelector('.ata-m-value')
  
  if (ataMValueSpan) {
    const currentAta = props.strip.ata || ''
    const currentMinutes = currentAta.match(/^L(\d{2})$/) ? currentAta.match(/^L(\d{2})$/)[1] : ''
    
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 2
    input.placeholder = 'xx'
    input.value = currentMinutes
    input.className = 'ata-minutes-input'
    input.style.cssText = `
      width: 30px;
      text-align: center;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #1976d2;
      font-size: 16px;
      font-weight: 600;
      border: 1px solid #1976d2;
      background: white;
      outline: none;
      padding: 2px;
    `
    
    // Replace span with input
    ataMValueSpan.style.display = 'none'
    ataRightCell.appendChild(input)
    input.focus()
    input.select()
    
    // Real-time validation to only allow digits
    input.addEventListener('input', (e) => {
      let value = input.value
      
      // Only allow digits, max 2 digits
      if (!/^\d{0,2}$/.test(value)) {
        input.value = value.substring(0, value.length - 1)
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let value = input.value.trim()
        
        if (value.length > 0 && /^\d{1,2}$/.test(value)) {
          // Pad with leading zero if single digit
          const paddedValue = value.padStart(2, '0')
          
          // Check if L is present, if not add it
          const currentAta = props.strip.ata || ''
          let newAta = ''
          
          if (currentAta.startsWith('L')) {
            newAta = `L${paddedValue}`
          } else {
            // No L present, add it automatically
            newAta = `L${paddedValue}`
          }
          
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
        ataMValueSpan.style.display = ''
        isEditingAtaMinutes.value = false
      } else if (e.key === 'Escape') {
        // Cancel edit
        input.remove()
        ataMValueSpan.style.display = ''
        isEditingAtaMinutes.value = false
      }
    })
    
    // Handle blur (click outside)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        input.remove()
        ataMValueSpan.style.display = ''
        isEditingAtaMinutes.value = false
      }, 100)
    })
  }
}

const handleCurvedArrowClick = (event) => {
  event.stopPropagation()
  
  // Toggle curved arrow
  const currentCurvedArrow = props.strip.curvedArrow || false
  const newCurvedArrow = !currentCurvedArrow
  
  const updatedStrip = {
    ...props.strip,
    curvedArrow: newCurvedArrow
  }
  
  // If curved arrow is cleared, also clear diagonal line
  if (!newCurvedArrow && props.strip.diagonalLineArr) {
    updatedStrip.diagonalLineArr = false
  }
  
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleCallsignBoxArrClick = (event) => {
  event.stopPropagation()
  
  // Only allow diagonal line if curved arrow is selected
  if (!props.strip.curvedArrow) {
    return
  }
  
  // Toggle diagonal line
  const currentDiagonalLine = props.strip.diagonalLineArr || false
  const newDiagonalLine = !currentDiagonalLine
  
  const updatedStrip = {
    ...props.strip,
    diagonalLineArr: newDiagonalLine
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handlePushbackClick = (event) => {
  event.stopPropagation()
  
  // Don't handle if in edit mode
  if (isEditingPushback.value) return
  
  // Clear any existing timer
  if (pushbackClickTimer) {
    clearTimeout(pushbackClickTimer)
    pushbackClickTimer = null
  }
  
  // Delay to allow double-click to take precedence
  pushbackClickTimer = setTimeout(() => {
    // Single click: cycle through arrow right → arrow left → clear
    const currentArrow = props.strip.pushbackArrow || ''
    let newArrow = ''
    
    if (!currentArrow || currentArrow === '') {
      newArrow = 'right' // Arrow to the right
    } else if (currentArrow === 'right') {
      newArrow = 'left' // Arrow to the left
    } else if (currentArrow === 'left') {
      newArrow = '' // Clear
    }
    
    const updatedStrip = {
      ...props.strip,
      pushbackArrow: newArrow
    }
    
    // If arrow is cleared and freetext is present, also clear freetext
    if (newArrow === '' && props.strip.pushbackFreetext) {
      updatedStrip.pushbackFreetext = ''
    }
    
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    
    pushbackClickTimer = null
  }, 250) // 250ms delay to detect double-click
}

const handlePushbackDoubleClick = (event) => {
  event.stopPropagation()
  
  // Clear the single-click timer
  if (pushbackClickTimer) {
    clearTimeout(pushbackClickTimer)
    pushbackClickTimer = null
  }
  
  if (isEditingPushback.value) return
  
  isEditingPushback.value = true
  
  const pushbackCell = event.currentTarget
  const currentText = props.strip.pushbackFreetext || ''
  
  // Create input element
  const input = document.createElement('input')
  input.type = 'text'
  input.maxLength = 3
  input.placeholder = 'txt'
  input.value = currentText
  input.className = 'pushback-input'
  input.style.cssText = `
    width: 100%;
    text-align: center;
    font-family: 'Segoe Print', 'Comic Sans MS', cursive;
    color: #1976d2;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid #1976d2;
    background: white;
    outline: none;
    padding: 2px;
    text-transform: uppercase;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  `
  
  // Clear existing content and add input
  const freetextValue = pushbackCell.querySelector('.pushback-freetext-value')
  if (freetextValue) {
    freetextValue.style.display = 'none'
  }
  
  // Make pushback cell relative for absolute positioning
  pushbackCell.style.position = 'relative'
  pushbackCell.appendChild(input)
  input.focus()
  input.select()
  
  // Handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = input.value.trim().toUpperCase().substring(0, 3)
      const updatedStrip = {
        ...props.strip,
        pushbackFreetext: value || ''
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
      
      // Clean up
      input.remove()
      if (freetextValue) {
        freetextValue.style.display = ''
      }
      pushbackCell.style.position = ''
      isEditingPushback.value = false
    } else if (e.key === 'Escape') {
      // Cancel edit
      input.remove()
      if (freetextValue) {
        freetextValue.style.display = ''
      }
      pushbackCell.style.position = ''
      isEditingPushback.value = false
    }
  })
  
  // Handle blur
  input.addEventListener('blur', () => {
    setTimeout(() => {
      const value = input.value.trim().toUpperCase().substring(0, 3)
      const updatedStrip = {
        ...props.strip,
        pushbackFreetext: value || ''
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
      
      input.remove()
      if (freetextValue) {
        freetextValue.style.display = ''
      }
      pushbackCell.style.position = ''
      isEditingPushback.value = false
    }, 100)
  })
}

const handleCol6FreetextClick = (event) => {
  event.stopPropagation()
  
  if (isEditingCol6Freetext.value) return
  
  isEditingCol6Freetext.value = true
  
  const col6Wrapper = event.currentTarget
  const col6ValueSpan = col6Wrapper.querySelector('.col6-freetext-value')
  
  if (col6ValueSpan) {
    const currentValue = props.strip.col6Freetext || ''
    
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 2
    input.placeholder = 'L#'
    input.value = currentValue
    input.className = 'col6-freetext-input'
    input.style.cssText = `
      width: 100%;
      text-align: center;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #1976d2;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid #1976d2;
      background: white;
      outline: none;
      padding: 2px;
      text-transform: uppercase;
    `
    
    // Replace span with input
    col6ValueSpan.style.display = 'none'
    col6Wrapper.appendChild(input)
    input.focus()
    input.select()
    
    // Real-time validation - only allow one letter followed by one digit
    input.addEventListener('input', () => {
      let value = input.value.toUpperCase()
      
      // Remove any invalid characters
      value = value.replace(/[^A-Z0-9]/g, '')
      
      // If we have a letter, only allow digits after
      if (value.length > 0 && /[A-Z]/.test(value[0])) {
        if (value.length > 1) {
          // Keep only letter + digit
          const letter = value[0]
          const digit = value[1]
          if (/[0-9]/.test(digit)) {
            input.value = letter + digit
          } else {
            // If second char is not digit, keep only letter
            input.value = letter
          }
        } else {
          input.value = value
        }
      } else if (value.length > 0 && /[0-9]/.test(value[0])) {
        // If starts with digit, clear it (must start with letter)
        input.value = ''
      } else if (value.length === 0) {
        input.value = ''
      } else {
        // If first char is not letter or digit, clear
        input.value = ''
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let value = input.value.trim().toUpperCase()
        
        // Validate format: one letter followed by one number
        if (value.length === 2 && /[A-Z]/.test(value[0]) && /[0-9]/.test(value[1])) {
          saveCol6Freetext(value)
        } else if (value.length === 0) {
          saveCol6Freetext('')
        }
        cleanup()
      } else if (e.key === 'Escape') {
        cleanup()
      }
    })
    
    // Handle blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        let value = input.value.trim().toUpperCase()
        
        // Validate format: one letter followed by one number
        if (value.length === 2 && /[A-Z]/.test(value[0]) && /[0-9]/.test(value[1])) {
          saveCol6Freetext(value)
        } else if (value.length === 0) {
          saveCol6Freetext('')
        }
        cleanup()
      }, 100)
    })
    
    const saveCol6Freetext = (value) => {
      const updatedStrip = {
        ...props.strip,
        col6Freetext: value
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
    }
    
    const cleanup = () => {
      input.remove()
      col6ValueSpan.style.display = ''
      isEditingCol6Freetext.value = false
    }
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
      color: black;
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

const handleSidDoubleClick = async (event) => {
  event.stopPropagation()
  event.preventDefault()
  
  if (isEditingSid.value) return
  
  isEditingSid.value = true
  
  const sidContainer = event.currentTarget
  const sidValueSpan = sidContainer.querySelector('.sid-large')
  
  if (sidValueSpan) {
    // Get available SIDs for the runway
    let availableSids = []
    
    if (props.strip.adep && props.selectedDepRunway) {
      const sids = sidStarDataService.getSIDsForRunway(props.strip.adep, props.selectedDepRunway)
      availableSids = sids.map(s => s.name)
    }
    
    // Create container for input and dropdown
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      width: 100%;
      z-index: 100;
    `
    
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.value = props.strip.sid || ''
    input.maxLength = 10
    input.placeholder = 'SID'
    input.className = 'sid-input'
    input.style.cssText = `
      width: 90%;
      padding: 4px 8px;
      border: 2px solid #2a9af3;
      background: white;
      color: black;
      outline: none;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    `
    
    // Create dropdown for available SIDs
    const dropdown = document.createElement('div')
    dropdown.className = 'sid-dropdown'
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 5%;
      width: 90%;
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border: 2px solid #2a9af3;
      border-top: none;
      z-index: 101;
      display: ${availableSids.length > 0 ? 'block' : 'none'};
    `
    
    // Populate dropdown
    availableSids.forEach(sidName => {
      const option = document.createElement('div')
      option.textContent = sidName
      option.style.cssText = `
        padding: 6px 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        font-family: 'Courier New', monospace;
      `
      option.addEventListener('mouseenter', () => {
        option.style.background = '#e3f2fd'
      })
      option.addEventListener('mouseleave', () => {
        option.style.background = 'white'
      })
      option.addEventListener('click', () => {
        input.value = sidName
        saveSid(sidName)
        cleanup()
      })
      dropdown.appendChild(option)
    })
    
    container.appendChild(input)
    container.appendChild(dropdown)
    
    // Replace span with container
    sidValueSpan.style.display = 'none'
    sidContainer.appendChild(container)
    input.focus()
    input.select()
    
    // Auto-uppercase and filter dropdown
    input.addEventListener('input', () => {
      const value = input.value.toUpperCase()
      input.value = value
      
      // Filter dropdown options
      if (availableSids.length > 0) {
        const options = dropdown.querySelectorAll('div')
        let hasVisible = false
        options.forEach(option => {
          const sidName = option.textContent
          if (sidName.includes(value) || value === '') {
            option.style.display = 'block'
            hasVisible = true
          } else {
            option.style.display = 'none'
          }
        })
        dropdown.style.display = hasVisible ? 'block' : 'none'
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveSid(input.value)
        cleanup()
      } else if (e.key === 'Escape') {
        cleanup()
      }
    })
    
    // Handle blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        saveSid(input.value)
        cleanup()
      }, 150)
    })
    
    const saveSid = (text) => {
      const updatedStrip = {
        ...props.strip,
        sid: text.trim()
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
    }
    
    const cleanup = () => {
      container.remove()
      sidValueSpan.style.display = ''
      isEditingSid.value = false
    }
  }
}

const handleNumeralClick = (event) => {
  event.stopPropagation()
  
  if (numeralClickTimer) {
    return // Double-click is happening
  }
  
  numeralClickTimer = setTimeout(() => {
    // Single click: clear the numeral value
    const updatedStrip = {
      ...props.strip,
      numeral: ''
    }
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    numeralClickTimer = null
  }, 250)
}

const handleNumeralDoubleClick = (event) => {
  event.stopPropagation()
  
  // Clear the single-click timer
  if (numeralClickTimer) {
    clearTimeout(numeralClickTimer)
    numeralClickTimer = null
  }
  
  if (isEditingNumeral.value) return
  
  isEditingNumeral.value = true
  
  const numeralCell = event.currentTarget
  const numeralValueSpan = numeralCell.querySelector('.numeral-value')
  
  if (numeralValueSpan) {
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 2
    input.placeholder = 'xx'
    input.className = 'numeral-input'
    input.style.cssText = `
      width: 25px;
      text-align: center;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #f44336;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #f44336;
      background: white;
      outline: none;
      padding: 2px;
    `
    
    // Replace span with input
    numeralValueSpan.style.display = 'none'
    numeralCell.appendChild(input)
    input.focus()
    
    // Real-time validation
    input.addEventListener('input', () => {
      const value = input.value
      // Only allow digits, max 2
      if (!/^\d{0,2}$/.test(value)) {
        input.value = value.substring(0, value.length - 1)
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim()
        if (value.length > 0 && /^\d{1,2}$/.test(value)) {
          const paddedValue = value.padStart(2, '0')
          saveNumeral(paddedValue)
        }
        cleanup()
      } else if (e.key === 'Escape') {
        cleanup()
      }
    })
    
    // Handle blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        const value = input.value.trim()
        if (value.length > 0 && /^\d{1,2}$/.test(value)) {
          const paddedValue = value.padStart(2, '0')
          saveNumeral(paddedValue)
        }
        cleanup()
      }, 100)
    })
    
    const saveNumeral = (value) => {
      const updatedStrip = {
        ...props.strip,
        numeral: value
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
    }
    
    const cleanup = () => {
      input.remove()
      numeralValueSpan.style.display = ''
      isEditingNumeral.value = false
    }
  }
}

const handleSymbolLeftClick = (event) => {
  event.stopPropagation()
  
  // Click on left part: create "-" in blue color
  // If both dash and minute are filled, clear both
  if (props.strip.blueDash && props.strip.timeMinutes) {
    const updatedStrip = {
      ...props.strip,
      blueDash: false,
      timeMinutes: ''
    }
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    return
  }
  
  // Otherwise, toggle the dash
  const updatedStrip = {
    ...props.strip,
    blueDash: !props.strip.blueDash
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleSymbolRightClick = (event) => {
  event.stopPropagation()
  
  // Don't handle if in edit mode
  if (isEditingTimeMinutes.value) return
  
  // Clear any existing timer
  if (timeMinutesClickTimer) {
    clearTimeout(timeMinutesClickTimer)
    timeMinutesClickTimer = null
  }
  
  // Delay to allow double-click to take precedence
  timeMinutesClickTimer = setTimeout(() => {
    // Single click: create "-" to the left (if not already present) and add present time in minutes
    const now = new Date()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    
    const updatedStrip = {
      ...props.strip,
      timeMinutes: minutes
    }
    
    // If blueDash not present, add it
    if (!props.strip.blueDash) {
      updatedStrip.blueDash = true
    }
    
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    
    timeMinutesClickTimer = null
  }, 250) // 250ms delay to detect double-click
}

const handleSymbolRightDoubleClick = (event) => {
  event.stopPropagation()
  
  // Clear the single-click timer
  if (timeMinutesClickTimer) {
    clearTimeout(timeMinutesClickTimer)
    timeMinutesClickTimer = null
  }
  
  if (isEditingTimeMinutes.value) return
  
  isEditingTimeMinutes.value = true
  
  const timeCell = event.currentTarget
  const timeValueSpan = timeCell.querySelector('.symbol-time-value')
  
  if (timeValueSpan) {
    const currentTime = props.strip.timeMinutes || ''
    
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 2
    input.placeholder = 'mm'
    input.value = currentTime
    input.className = 'time-input'
    input.style.cssText = `
      width: 30px;
      text-align: center;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #1976d2;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #1976d2;
      background: white;
      outline: none;
      padding: 2px;
    `
    
    // Replace span with input
    timeValueSpan.style.display = 'none'
    timeCell.appendChild(input)
    input.focus()
    input.select()
    
    // Real-time validation - only allow digits, max 2
    input.addEventListener('input', () => {
      const value = input.value
      if (!/^\d{0,2}$/.test(value)) {
        input.value = value.substring(0, value.length - 1)
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let value = input.value.trim()
        if (value.length > 0) {
          // Add leading zero if single digit
          if (value.length === 1) {
            value = '0' + value
          }
          // Ensure max 2 digits
          if (/^\d{1,2}$/.test(value)) {
            saveTimeMinutes(value)
          }
        } else {
          saveTimeMinutes('')
        }
        cleanup()
      } else if (e.key === 'Escape') {
        cleanup()
      }
    })
    
    // Handle blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        let value = input.value.trim()
        if (value.length > 0) {
          // Add leading zero if single digit
          if (value.length === 1) {
            value = '0' + value
          }
          // Ensure max 2 digits
          if (/^\d{1,2}$/.test(value)) {
            saveTimeMinutes(value)
          }
        } else {
          saveTimeMinutes('')
        }
        cleanup()
      }, 100)
    })
    
    const saveTimeMinutes = (value) => {
      const updatedStrip = {
        ...props.strip,
        timeMinutes: value
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
    }
    
    const cleanup = () => {
      input.remove()
      timeValueSpan.style.display = ''
      isEditingTimeMinutes.value = false
    }
  }
}

const handleSymbolClick = (event) => {
  // This handler is for the middle content area - keep original behavior for now
  // But for DEP strips, we want different behavior
  if (getStripType() === 'departure') {
    return // Don't handle clicks on the middle for departure strips
  }
  
  event.stopPropagation()
  
  // Toggle between empty → vertical → T → empty (for non-departure strips)
  const currentSymbol = props.strip.symbol || ''
  let newSymbol = ''
  
  if (currentSymbol === '') {
    newSymbol = 'vertical'
  } else if (currentSymbol === 'vertical') {
    newSymbol = 'T'
  } else {
    newSymbol = '' // Back to empty
  }
  
  const updatedStrip = {
    ...props.strip,
    symbol: newSymbol
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleCallsignBoxClick = (event) => {
  event.stopPropagation()
  
  // Single click: toggle diagonal line
  const updatedStrip = {
    ...props.strip,
    diagonalLine: !props.strip.diagonalLine
  }
  socketService.updateStrip(updatedStrip)
  emit('update-strip', updatedStrip)
}

const handleNumeral2Click = (event) => {
  event.stopPropagation()
  
  if (numeral2ClickTimer) {
    return // Double-click is happening
  }
  
  numeral2ClickTimer = setTimeout(() => {
    // Single click: clear the numeral2 value
    const updatedStrip = {
      ...props.strip,
      numeral2: ''
    }
    socketService.updateStrip(updatedStrip)
    emit('update-strip', updatedStrip)
    numeral2ClickTimer = null
  }, 250)
}

const handleNumeral2DoubleClick = (event) => {
  event.stopPropagation()
  
  // Clear the single-click timer
  if (numeral2ClickTimer) {
    clearTimeout(numeral2ClickTimer)
    numeral2ClickTimer = null
  }
  
  if (isEditingNumeral2.value) return
  
  isEditingNumeral2.value = true
  
  const numeral2Cell = event.currentTarget
  const numeral2ValueSpan = numeral2Cell.querySelector('.numeral2-value')
  
  if (numeral2ValueSpan) {
    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 2
    input.placeholder = 'xx'
    input.className = 'numeral2-input'
    input.style.cssText = `
      width: 25px;
      text-align: center;
      font-family: 'Segoe Print', 'Comic Sans MS', cursive;
      color: #f44336;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #f44336;
      background: white;
      outline: none;
      padding: 2px;
    `
    
    // Replace span with input
    numeral2ValueSpan.style.display = 'none'
    numeral2Cell.appendChild(input)
    input.focus()
    
    // Real-time validation
    input.addEventListener('input', () => {
      const value = input.value
      // Only allow digits, max 2
      if (!/^\d{0,2}$/.test(value)) {
        input.value = value.substring(0, value.length - 1)
      }
    })
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim()
        if (value.length > 0 && /^\d{1,2}$/.test(value)) {
          const paddedValue = value.padStart(2, '0')
          saveNumeral2(paddedValue)
        }
        cleanup()
      } else if (e.key === 'Escape') {
        cleanup()
      }
    })
    
    // Handle blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        const value = input.value.trim()
        if (value.length > 0 && /^\d{1,2}$/.test(value)) {
          const paddedValue = value.padStart(2, '0')
          saveNumeral2(paddedValue)
        }
        cleanup()
      }, 100)
    })
    
    const saveNumeral2 = (value) => {
      const updatedStrip = {
        ...props.strip,
        numeral2: value
      }
      socketService.updateStrip(updatedStrip)
      emit('update-strip', updatedStrip)
    }
    
    const cleanup = () => {
      input.remove()
      numeral2ValueSpan.style.display = ''
      isEditingNumeral2.value = false
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
  if (props.strip.star) {
    return 'arrival'
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
  box-sizing: border-box; /* Ensure borders are included in width calculation */
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
  border-left: 8px solid #f44336;
  border-right: 8px solid #f44336;
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

