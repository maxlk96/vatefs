<template>
  <div 
    class="bay-header" 
    :data-strip-id="bayHeader.id"
  >
    <div class="bay-content drag-handle" @dblclick="startEditing">
      <div class="bay-text-wrapper">
        <span class="bay-name" ref="bayNameSpan">{{ bayHeader.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  bayHeader: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

const isEditing = ref(false)
const editData = ref({})
const bayNameSpan = ref(null)

watch(() => props.bayHeader, (newBayHeader) => {
  editData.value = { ...newBayHeader }
}, { immediate: true, deep: true })

const startEditing = (event) => {
  event.stopPropagation()
  
  if (isEditing.value) return
  isEditing.value = true
  
  // Create input overlay
  const bayElement = event.currentTarget.closest('.bay-header')
  if (!bayElement) return
  
  const input = document.createElement('input')
  input.type = 'text'
  input.value = props.bayHeader.name
  input.className = 'bay-name-input'
  input.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 400px;
    padding: 8px 12px;
    border: 3px solid #fff;
    background: #2d2d2d;
    color: #fff;
    outline: none;
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-align: center;
    font-family: 'Arial', 'Helvetica', sans-serif;
    z-index: 100;
  `
  
  // Hide the span
  const nameSpan = bayElement.querySelector('.bay-name')
  if (nameSpan) {
    nameSpan.style.visibility = 'hidden'
  }
  
  bayElement.appendChild(input)
  input.focus()
  input.select()
  
  // Handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newName = input.value.trim()
      if (newName) {
        emit('update', { ...props.bayHeader, name: newName })
      }
      cleanup()
    } else if (e.key === 'Escape') {
      cleanup()
    }
  })
  
  // Handle blur
  input.addEventListener('blur', () => {
    setTimeout(() => {
      const newName = input.value.trim()
      if (newName) {
        emit('update', { ...props.bayHeader, name: newName })
      }
      cleanup()
    }, 100)
  })
  
  const cleanup = () => {
    input.remove()
    if (nameSpan) {
      nameSpan.style.visibility = 'visible'
    }
    isEditing.value = false
  }
}
</script>

<style scoped>
.bay-header {
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
  box-sizing: border-box; /* Ensure borders are included in width calculation */
}

.bay-header:hover {
  background: #353535;
}

.bay-header:active {
  cursor: grabbing;
}


.bay-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: grab;
  height: 100%;
  position: relative;
  user-select: none;
  transition: background 0.1s;
}

.bay-content:hover {
  background: #353535;
}

.bay-content:active {
  cursor: grabbing;
}

.bay-text-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.bay-name {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 1.5rem;
  font-family: 'Arial', 'Helvetica', sans-serif;
  color: #ffffff;
  user-select: none;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.theme--dark .bay-header {
  background: #2d2d2d;
  border-color: #555;
}

.theme--dark .bay-header:hover {
  background: #353535;
}
</style>

