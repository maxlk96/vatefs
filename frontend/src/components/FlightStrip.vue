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
import { ref, computed, onMounted } from 'vue'
import { templateLoader } from '../services/templateLoader'

const props = defineProps({
  strip: {
    type: Object,
    required: true
  }
})

const templateHtml = ref('')

// Load template on mount
onMounted(async () => {
  const templateName = templateLoader.getTemplateForType(getStripType())
  templateHtml.value = await templateLoader.loadTemplate(templateName)
})

// Render template with strip data
const renderedTemplate = computed(() => {
  if (!templateHtml.value) return ''
  return templateLoader.processTemplate(templateHtml.value, props.strip)
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
  border-left: 8px solid #FDD835;
  border-right: 8px solid #FDD835;
  border-top: 3px solid #FDD835;
  border-bottom: 3px solid #FDD835;
}

.strip-arrival {
  border-left: 8px solid #42A5F5;
  border-right: 8px solid #42A5F5;
  border-top: 3px solid #42A5F5;
  border-bottom: 3px solid #42A5F5;
}

.strip-neutral {
  border-left: 8px solid #757575;
  border-right: 8px solid #757575;
  border-top: 3px solid #757575;
  border-bottom: 3px solid #757575;
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

