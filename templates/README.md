# VATEFS Strip Templates

This directory contains template definitions for electronic flight strips used in VATEFS.

## Template System

VATEFS now uses **HTML-based templates** for maximum customizability. Templates are regular HTML files with template variables that get replaced with actual flight data.

### Available Templates

- `strip-template.html` - Standard flight strip (neutral)
- `departure-strip-template.html` - Departure-optimized layout
- `arrival-strip-template.html` - Arrival-optimized layout

## Template Syntax

Templates use a simple `{{variable}}` syntax for data interpolation:

```html
<div class="field-group">
  <label class="field-label">CALLSIGN</label>
  <span class="field-value">{{callsign}}</span>
</div>
```

### Available Variables

All strip data fields are available as template variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{callsign}}` | Aircraft callsign | SAS123 |
| `{{atyp}}` | Aircraft type (ICAO) | B738 |
| `{{adep}}` | Departure aerodrome | ESSA |
| `{{ades}}` | Destination aerodrome | ENGM |
| `{{assr}}` | SSR code (squawk) | 1234 |
| `{{frul}}` | Flight rules | IFR/VFR/SVFR |
| `{{sid}}` | Standard Instrument Departure | ELTOK1A |
| `{{star}}` | Standard Terminal Arrival | OSMOD2A |
| `{{rfl}}` | Requested Flight Level | 350 |
| `{{cfl}}` | Cleared Flight Level | 240 |
| `{{tas}}` | True Air Speed | 450 |
| `{{eobt}}` | Estimated Off-Block Time | 14:30 |
| `{{eta}}` | Estimated Time of Arrival | 15:45 |
| `{{rwy}}` | Runway | 19L |
| `{{wake}}` | Wake turbulence category | M |

### Default Values

Use the `||` operator to provide fallback values:

```html
<span class="field-value">{{assr || 'N/A'}}</span>
<span class="field-value">{{sid || 'DCT'}}</span>
```

### Conditional Display

Use the `v-if` directive to conditionally show elements:

```html
<div class="field-group" v-if="wake">
  <span class="badge">{{wake}}</span>
</div>
```

## Creating Custom Templates

### 1. Create a New HTML File

Copy an existing template as a starting point:

```bash
cp templates/strip-template.html templates/my-custom-template.html
```

### 2. Edit the HTML

Modify the layout, add/remove fields, change styling:

```html
<div class="strip-layout my-custom-layout">
  <!-- Your custom layout here -->
  <div class="strip-row">
    <div class="field-group flex-1">
      <label class="field-label">CUSTOM FIELD</label>
      <span class="field-value">{{myfield}}</span>
    </div>
  </div>
</div>
```

### 3. Add Custom Styles

Use CSS classes to style your template. Available CSS utilities:

- `strip-layout` - Main container
- `strip-header-row` - Header row
- `strip-row` - Content row
- `field-group` - Field container
- `field-label` - Field label styling
- `field-value` - Field value styling
- `flex-1`, `flex-2` - Flex sizing
- `chip` - Badge/chip styling
- `strip-divider` - Horizontal divider

### 4. Deploy the Template

Copy your template to the frontend public directory:

```bash
cp templates/my-custom-template.html frontend/public/templates/
```

## Layout Classes & Styling

### Flexbox Utilities

```html
<div class="strip-row">
  <div class="field-group flex-1">...</div>  <!-- Takes 1 unit of space -->
  <div class="field-group flex-2">...</div>  <!-- Takes 2 units of space -->
</div>
```

### Value Styling Classes

Apply semantic colors to field values:

- `callsign` - Bold callsign styling
- `highlight` - Yellow highlight (for important data)
- `airport` - Blue color (for airports)
- `route` - Green color (for routes/procedures)
- `time` - Orange color (for times)

```html
<span class="field-value highlight">{{assr}}</span>
<span class="field-value airport">{{adep}}</span>
```

### Chips and Badges

```html
<span class="chip chip-{{frul}}">{{frul}}</span>
<span class="badge badge-wake">{{wake}}</span>
```

## JSON Templates (Legacy)

The JSON template files (`*.json`) are kept for reference and field validation but are no longer used for layout rendering. HTML templates have superseded them for layout control.

## Examples

### Minimal Template

```html
<div class="strip-layout">
  <div class="strip-row">
    <span class="field-value callsign">{{callsign}}</span>
    <span class="field-value">{{atyp}}</span>
  </div>
</div>
```

### Complex Template with Conditional Fields

```html
<div class="strip-layout">
  <div class="strip-header-row">
    <span class="field-value callsign">{{callsign}}</span>
    <span class="chip chip-{{frul}}">{{frul}}</span>
  </div>
  
  <div class="strip-row">
    <div class="field-group flex-2">
      <label class="field-label">ATYP</label>
      <span class="field-value highlight">{{atyp}}</span>
    </div>
    <div class="field-group flex-1" v-if="wake">
      <label class="field-label">WAKE</label>
      <span class="badge">{{wake}}</span>
    </div>
  </div>
  
  <div class="strip-divider"></div>
  
  <div class="strip-row">
    <div class="field-group flex-1">
      <label class="field-label">FROM</label>
      <span class="field-value airport">{{adep}}</span>
    </div>
    <div class="field-group flex-1">
      <label class="field-label">TO</label>
      <span class="field-value airport">{{ades}}</span>
    </div>
  </div>
</div>
```

## Template Selection

Templates are automatically selected based on strip type:
- `departure` → `departure-strip-template.html`
- `arrival` → `arrival-strip-template.html`
- `neutral` → `strip-template.html`

To use a custom template, modify `frontend/src/services/templateLoader.js` and add your template to the `getTemplateForType()` method.

