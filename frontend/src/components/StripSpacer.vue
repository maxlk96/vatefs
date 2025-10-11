<template>
  <div 
    class="strip-spacer" 
    :class="{ 'spacer-editing': isEditing }"
    :data-strip-id="spacer.id"
  >
    <div class="spacer-content drag-handle">
      <div class="spacer-text-wrapper">
        <span class="spacer-name">{{ spacer.name }}</span>
      </div>
      <v-btn 
        icon 
        size="small" 
        class="delete-spacer-btn"
        @click="$emit('delete', spacer.id)"
      >
        <v-icon size="small" color="black">mdi-close</v-icon>
      </v-btn>
    </div>
    
    <div v-if="isEditing" class="spacer-edit pa-2">
      <v-text-field
        v-model="editData.name"
        label="Section Name"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      ></v-text-field>
      <v-btn 
        color="primary" 
        size="small" 
        block
        @click="saveEdit"
      >
        Save
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  spacer: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

const isEditing = ref(false)
const editData = ref({})

watch(() => props.spacer, (newSpacer) => {
  editData.value = { ...newSpacer }
}, { immediate: true, deep: true })

const saveEdit = () => {
  emit('update', editData.value)
  isEditing.value = false
}
</script>

<style scoped>
.strip-spacer {
  background: #2d2d2d;
  margin-bottom: 6px;
  cursor: grab;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  border: none;
  border-top: 2px solid #555;
  border-bottom: 2px solid #555;
  position: relative;
  height: 40px;
  width: 500px;
}

.strip-spacer:hover {
  background: #353535;
}

.strip-spacer:active {
  cursor: grabbing;
}

.spacer-editing {
  background: #FF9800;
}

.spacer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: grab;
  height: 100%;
  position: relative;
}

.spacer-content:active {
  cursor: grabbing;
}

.spacer-text-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.spacer-name {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 1.5rem;
  font-family: 'Arial', 'Helvetica', sans-serif;
  color: #ffffff;
  user-select: none;
}

.delete-spacer-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff !important;
  width: 28px;
  height: 28px;
}

.delete-spacer-btn:hover {
  background: #f0f0f0 !important;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.spacer-edit {
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px;
}

.theme--dark .strip-spacer {
  background: #2d2d2d;
  border-color: #555;
}

.theme--dark .strip-spacer:hover {
  background: #353535;
}
</style>

