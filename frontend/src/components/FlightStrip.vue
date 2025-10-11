<template>
  <div 
    class="flight-strip mb-2" 
    :class="[
      { 'strip-editing': isEditing },
      `strip-${getStripType()}`
    ]"
    :data-strip-id="strip.id"
  >
    <div class="strip-header drag-handle">
      <v-icon size="small" class="drag-icon">mdi-drag-vertical</v-icon>
      <span class="callsign">{{ strip.callsign }}</span>
      <v-spacer></v-spacer>
      <v-chip 
        size="x-small" 
        :color="getFlightRuleColor(strip.frul)"
        class="mr-2"
      >
        {{ strip.frul }}
      </v-chip>
      <v-btn 
        icon 
        size="x-small" 
        variant="text"
        @click="isEditing = !isEditing"
      >
        <v-icon size="small">{{ isEditing ? 'mdi-close' : 'mdi-pencil' }}</v-icon>
      </v-btn>
      <v-btn 
        icon 
        size="x-small" 
        variant="text"
        color="error"
        @click="$emit('delete', strip.id)"
      >
        <v-icon size="small">mdi-delete</v-icon>
      </v-btn>
    </div>

    <div v-if="!isEditing" class="strip-content">
      <v-row dense class="ma-0">
        <v-col cols="4" class="strip-field">
          <div class="field-label">ATYP</div>
          <div class="field-value">{{ strip.atyp }}</div>
        </v-col>
        <v-col cols="4" class="strip-field">
          <div class="field-label">ASSR</div>
          <div class="field-value">{{ strip.assr || 'N/A' }}</div>
        </v-col>
        <v-col cols="4" class="strip-field">
          <div class="field-label">TAS</div>
          <div class="field-value">{{ strip.tas || 'N/A' }}</div>
        </v-col>
      </v-row>

      <div class="strip-divider"></div>

      <v-row dense class="ma-0">
        <v-col cols="6" class="strip-field">
          <div class="field-label">ADEP</div>
          <div class="field-value">{{ strip.adep }}</div>
        </v-col>
        <v-col cols="6" class="strip-field">
          <div class="field-label">ADES</div>
          <div class="field-value">{{ strip.ades }}</div>
        </v-col>
      </v-row>

      <div class="strip-divider"></div>

      <v-row dense class="ma-0">
        <v-col cols="4" class="strip-field">
          <div class="field-label">SID</div>
          <div class="field-value">{{ strip.sid || 'N/A' }}</div>
        </v-col>
        <v-col cols="4" class="strip-field">
          <div class="field-label">RFL</div>
          <div class="field-value">{{ strip.rfl || 'N/A' }}</div>
        </v-col>
        <v-col cols="4" class="strip-field">
          <div class="field-label">EOBT</div>
          <div class="field-value">{{ strip.eobt || 'N/A' }}</div>
        </v-col>
      </v-row>
    </div>

    <!-- Edit Mode -->
    <div v-else class="strip-edit pa-3">
      <v-row dense>
        <v-col cols="6">
          <v-text-field
            v-model="editData.callsign"
            label="Callsign"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="editData.atyp"
            label="Aircraft Type"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="editData.adep"
            label="ADEP"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="editData.ades"
            label="ADES"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="editData.assr"
            label="Squawk"
            density="compact"
            variant="outlined"
            hide-details
            maxlength="4"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="editData.tas"
            label="TAS"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="editData.frul"
            label="Flight Rules"
            :items="['IFR', 'VFR', 'SVFR']"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="editData.stripType"
            label="Strip Type"
            :items="['departure', 'arrival', 'neutral']"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="editData.sid"
            label="SID"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="editData.rfl"
            label="RFL"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="editData.eobt"
            label="EOBT"
            density="compact"
            variant="outlined"
            hide-details
            type="time"
          ></v-text-field>
        </v-col>
      </v-row>
      
      <v-btn 
        color="primary" 
        size="small" 
        class="mt-3" 
        block
        @click="saveEdit"
      >
        Save Changes
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  strip: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

const isEditing = ref(false)
const editData = ref({})

watch(() => props.strip, (newStrip) => {
  editData.value = { ...newStrip }
}, { immediate: true, deep: true })

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
  // If SID exists, it's likely a departure
  // You can also add a specific 'stripType' field to the strip data
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

const saveEdit = () => {
  emit('update', editData.value)
  isEditing.value = false
}
</script>

<style scoped>
.flight-strip {
  background: #424242;
  border: 1px solid #555;
  margin-bottom: 2px;
  cursor: grab;
  position: relative;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  width: 500px;
}

.theme--dark .flight-strip {
  background: #424242;
}

.strip-departure {
  border-left: 3px solid #FDD835;
}

.strip-arrival {
  border-left: 3px solid #42A5F5;
}

.strip-neutral {
  border-left: 3px solid #757575;
}

.flight-strip:hover {
  background: #4a4a4a;
}

.flight-strip:active {
  cursor: grabbing;
}

.strip-editing {
  border-left-color: #FF9800;
}

.strip-header {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #555;
  cursor: grab;
  min-height: 28px;
}

.strip-header:active {
  cursor: grabbing;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-icon {
  opacity: 0.3;
  margin-right: 6px;
  font-size: 14px;
}

.callsign {
  font-weight: bold;
  font-size: 0.9em;
  letter-spacing: 0.02em;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.strip-content {
  padding: 4px 6px;
}

.strip-field {
  padding: 1px 3px;
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

.field-value {
  font-size: 0.75em;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.strip-divider {
  height: 1px;
  background: #555;
  margin: 2px 0;
}

.strip-edit {
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid #555;
  padding: 4px;
}

:deep(.v-chip) {
  font-weight: 600;
  font-size: 0.6em;
  height: 16px;
}

:deep(.v-btn) {
  min-width: 24px;
  height: 20px;
}

:deep(.v-btn .v-icon) {
  font-size: 14px;
}

.theme--dark .flight-strip {
  background: #424242;
}

.theme--dark .strip-header {
  background: rgba(0, 0, 0, 0.1);
  border-bottom-color: #555;
}

.theme--dark .strip-divider {
  background: #555;
}

.theme--dark .strip-edit {
  background: rgba(0, 0, 0, 0.2);
  border-top-color: #555;
}
</style>

