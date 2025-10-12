<template>
  <v-dialog v-model="show" max-width="600" :persistent="!hasSelectedAirport">
    <v-card>
      <v-card-title class="dialog-header-neutral">
        <v-icon class="mr-2">mdi-airport</v-icon>
        <span class="text-h5">{{ hasSelectedAirport ? 'Change Airport' : 'Select Airport' }}</span>
      </v-card-title>
      
      <v-card-text class="pt-6">
        <v-alert 
          v-if="!hasSelectedAirport"
          type="info" 
          variant="tonal" 
          class="mb-4"
        >
          Select an airport to monitor VATSIM traffic. Departure strips will be created automatically.
        </v-alert>
        
        <v-alert 
          v-else
          type="warning" 
          variant="tonal" 
          class="mb-4"
        >
          <strong>Changing airports will clear all existing strips.</strong> Current: {{ props.currentAirport }}
        </v-alert>

        <!-- Preset Airports -->
        <div class="mb-4">
          <v-label class="text-subtitle-2 mb-2">Quick Select</v-label>
          <v-row dense>
            <v-col 
              v-for="preset in presetAirports" 
              :key="preset.icao"
              cols="6"
            >
              <v-card 
                :class="{ 'selected-card': selectedAirport === preset.icao }"
                class="preset-card"
                variant="outlined"
                hover
                @click="selectPreset(preset.icao)"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-center">
                    <v-icon size="large" class="mr-3">mdi-airplane</v-icon>
                    <div>
                      <div class="text-h6">{{ preset.icao }}</div>
                      <div class="text-caption text-grey">{{ preset.name }}</div>
                    </div>
                  </div>
                  <v-progress-linear
                    v-if="loading && selectedAirport === preset.icao"
                    indeterminate
                    color="primary"
                    class="mt-2"
                  ></v-progress-linear>
                  <div v-if="airportStats[preset.icao]" class="mt-2 text-caption">
                    <v-chip size="x-small" class="mr-1">
                      <v-icon size="x-small" start>mdi-airplane-takeoff</v-icon>
                      {{ airportStats[preset.icao].departures }} DEP
                    </v-chip>
                    <v-chip size="x-small">
                      <v-icon size="x-small" start>mdi-airplane-landing</v-icon>
                      {{ airportStats[preset.icao].arrivals }} ARR
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Custom Airport -->
        <div>
          <v-label class="text-subtitle-2 mb-2">Or Enter Custom Airport</v-label>
          <v-text-field
            v-model="customAirport"
            label="Airport ICAO Code"
            variant="outlined"
            density="comfortable"
            placeholder="e.g., KJFK, EGLL"
            maxlength="4"
            @input="customAirport = customAirport.toUpperCase()"
            @keyup.enter="selectCustom"
          >
            <template v-slot:append>
              <v-btn
                icon
                size="small"
                :disabled="customAirport.length !== 4"
                @click="selectCustom"
              >
                <v-icon>mdi-check</v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <!-- Options -->
        <v-checkbox
          v-model="autoImport"
          label="Auto-import existing flight plans on startup"
          density="compact"
          hide-details
        ></v-checkbox>
      </v-card-text>
      
      <v-card-actions>
        <v-btn
          v-if="hasSelectedAirport"
          color="grey"
          variant="text"
          @click="show = false"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          variant="elevated"
          :disabled="!selectedAirport"
          :loading="loading"
          @click="confirmSelection"
        >
          {{ hasSelectedAirport ? 'Change Airport' : 'Start Monitoring' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { vatsimService } from '../services/vatsim'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentAirport: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'airport-selected'])

const show = ref(props.modelValue)

// Watch for changes to modelValue prop
watch(() => props.modelValue, (newVal) => {
  show.value = newVal
})

// Watch for changes to show and emit to parent
watch(show, (newVal) => {
  emit('update:modelValue', newVal)
})
const selectedAirport = ref('')
const customAirport = ref('')
const autoImport = ref(true)
const loading = ref(false)
const airportStats = ref({})
const hasSelectedAirport = ref(false)

// Check if we have a current airport
watch(() => props.currentAirport, (newVal) => {
  hasSelectedAirport.value = !!newVal
}, { immediate: true })

const presetAirports = ref([
  { icao: 'ESGG', name: 'Göteborg Landvetter' },
  { icao: 'ESMS', name: 'Malmö Sturup' },
  { icao: 'ESNZ', name: 'Ängelholm-Helsingborg' },
  { icao: 'ESNU', name: 'Umeå' }
])

const selectPreset = async (icao) => {
  selectedAirport.value = icao
  await loadAirportStats(icao)
}

const selectCustom = async () => {
  if (customAirport.value.length === 4) {
    selectedAirport.value = customAirport.value
    await loadAirportStats(customAirport.value)
  }
}

const loadAirportStats = async (icao) => {
  loading.value = true
  try {
    const stats = await vatsimService.getAirportInfo(icao)
    if (stats) {
      airportStats.value[icao] = stats
    }
  } catch (error) {
    console.error('Error loading airport stats:', error)
  }
  loading.value = false
}

const confirmSelection = () => {
  if (selectedAirport.value) {
    emit('airport-selected', {
      airport: selectedAirport.value,
      autoImport: autoImport.value
    })
    show.value = false
  }
}

// Load stats for preset airports on mount
onMounted(async () => {
  for (const preset of presetAirports.value) {
    await loadAirportStats(preset.icao)
  }
})
</script>

<style scoped>
.preset-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.selected-card {
  border-color: #1976D2;
  border-width: 2px;
  background: rgba(25, 118, 210, 0.05);
}

.theme--dark .selected-card {
  background: rgba(25, 118, 210, 0.15);
}

.dialog-header-neutral {
  background-color: #424242 !important;
  color: #fff !important;
}
</style>

