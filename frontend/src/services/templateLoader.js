// Template Loader Service
// Loads and processes HTML templates for flight strips

class TemplateLoader {
  constructor() {
    this.templates = new Map()
    this.templateCache = new Map()
  }

  /**
   * Load a template from the templates directory
   * @param {string} templateName - Name of the template file (without extension)
   * @returns {Promise<string>} The template HTML
   */
  async loadTemplate(templateName) {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)
    }

    try {
      // Fetch template from public directory
      const response = await fetch(`/templates/${templateName}.html`)
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templateName}`)
      }
      
      const html = await response.text()
      this.templateCache.set(templateName, html)
      return html
    } catch (error) {
      console.error('Error loading template:', error)
      // Return a fallback template
      return this.getDefaultTemplate()
    }
  }

  /**
   * Process template with data
   * @param {string} templateHtml - The template HTML string
   * @param {object} data - Data object to interpolate into template
   * @returns {string} Processed HTML
   */
  processTemplate(templateHtml, data) {
    let processed = templateHtml

    // Replace {{{variable}}} patterns with raw HTML (no escaping)
    processed = processed.replace(/\{\{\{([^}]+)\}\}\}/g, (match, expression) => {
      try {
        expression = expression.trim()
        const value = this.evaluateExpression(expression, data)
        return value !== undefined && value !== null ? String(value) : ''
      } catch (error) {
        console.warn(`Error processing raw HTML expression: ${expression}`, error)
        return ''
      }
    })

    // Replace {{variable}} patterns with data values (HTML escaped)
    processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        // Trim whitespace
        expression = expression.trim()
        
        // Handle conditional expressions (e.g., {{value || 'N/A'}})
        if (expression.includes('||')) {
          const parts = expression.split('||').map(p => p.trim())
          let value = this.evaluateExpression(parts[0], data)
          
          // If value is falsy, use the fallback
          if (!value) {
            // Remove quotes from fallback string
            value = parts[1].replace(/['"]/g, '')
          }
          return this.escapeHtml(value)
        }
        
        // Handle simple variable access
        const value = this.evaluateExpression(expression, data)
        return value !== undefined && value !== null ? this.escapeHtml(value) : ''
      } catch (error) {
        console.warn(`Error processing expression: ${expression}`, error)
        return ''
      }
    })

    // Handle v-if directives (simple implementation)
    processed = processed.replace(/<([^>]+)v-if="([^"]+)"([^>]*)>/g, (match, tagStart, condition, tagEnd) => {
      try {
        const shouldShow = this.evaluateExpression(condition, data)
        if (!shouldShow) {
          // Find closing tag and remove entire element
          return '<!-- removed by v-if -->'
        }
        // Remove v-if attribute
        return `<${tagStart}${tagEnd}>`
      } catch (error) {
        return match
      }
    })

    return processed
  }

  /**
   * Evaluate a simple expression against data
   * @param {string} expression - Expression to evaluate
   * @param {object} data - Data context
   * @returns {any} Result of evaluation
   */
  evaluateExpression(expression, data) {
    // Handle nested property access (e.g., "position.order")
    const parts = expression.split('.')
    let value = data
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined
      }
      value = value[part]
    }
    
    return value
  }

  /**
   * Escape HTML special characters
   * @param {any} value - Value to escape
   * @returns {string} Escaped string
   */
  escapeHtml(value) {
    const str = String(value)
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return str.replace(/[&<>"']/g, char => map[char])
  }

  /**
   * Get default fallback template
   * @returns {string} Default template HTML
   */
  getDefaultTemplate() {
    return `
      <div class="strip-layout">
        <div class="strip-header-row">
          <div class="field-group callsign-group">
            <span class="field-value callsign">{{callsign}}</span>
          </div>
        </div>
        <div class="strip-row">
          <div class="field-group flex-1">
            <label class="field-label">ATYP</label>
            <span class="field-value">{{atyp}}</span>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Get template name based on strip type
   * @param {string} stripType - Type of strip (departure, arrival, neutral, freetext)
   * @returns {string} Template filename
   */
  getTemplateForType(stripType) {
    switch (stripType) {
      case 'departure':
        return 'departure-strip-template'
      case 'arrival':
        return 'arrival-strip-template'
      case 'freetext':
        return 'freetext-strip-template'
      default:
        return 'strip-template'
    }
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear()
  }
}

export const templateLoader = new TemplateLoader()

