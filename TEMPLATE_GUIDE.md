# VATEFS Template Customization Guide

This guide explains how to customize the look and layout of flight strips in VATEFS using HTML templates.

## Quick Start

Flight strip layouts are now fully customizable using HTML templates located in `frontend/public/templates/`. You can edit these files directly to change how strips appear.

### Template Files

Three template files are available by default:

1. **`strip-template.html`** - Standard/neutral strips
2. **`departure-strip-template.html`** - Departure-optimized strips (yellow border)
3. **`arrival-strip-template.html`** - Arrival-optimized strips (blue border)

## Making Your First Customization

### Example 1: Add a New Field

Let's add a "Remarks" field to the standard template:

1. Open `frontend/public/templates/strip-template.html`
2. Add this code before the closing `</div>`:

```html
<div class="strip-divider"></div>

<div class="strip-row">
  <div class="field-group flex-1">
    <label class="field-label">REMARKS</label>
    <span class="field-value">{{remarks || 'None'}}</span>
  </div>
</div>
```

3. Reload your browser - the change will appear immediately!

### Example 2: Rearrange Fields

Want to show the runway before the SID? Just move the HTML blocks:

**Before:**
```html
<div class="field-group flex-1">
  <label class="field-label">SID</label>
  <span class="field-value route">{{sid || 'DCT'}}</span>
</div>
<div class="field-group flex-1">
  <label class="field-label">RWY</label>
  <span class="field-value">{{rwy || '--'}}</span>
</div>
```

**After:**
```html
<div class="field-group flex-1">
  <label class="field-label">RWY</label>
  <span class="field-value">{{rwy || '--'}}</span>
</div>
<div class="field-group flex-1">
  <label class="field-label">SID</label>
  <span class="field-value route">{{sid || 'DCT'}}</span>
</div>
```

### Example 3: Change Field Sizes

Use `flex-1`, `flex-2`, etc. to control field widths:

```html
<!-- Small field (1 unit) -->
<div class="field-group flex-1">
  <label class="field-label">RWY</label>
  <span class="field-value">{{rwy}}</span>
</div>

<!-- Large field (2 units) -->
<div class="field-group flex-2">
  <label class="field-label">SID</label>
  <span class="field-value">{{sid}}</span>
</div>
```

## Template Syntax Reference

### Variables

Use `{{variableName}}` to insert data:

```html
<span>{{callsign}}</span>
<span>{{atyp}}</span>
<span>{{adep}}</span>
```

### Default Values

Use `||` to provide fallback values when data is missing:

```html
<span>{{assr || 'N/A'}}</span>
<span>{{sid || 'DCT'}}</span>
<span>{{remarks || 'No remarks'}}</span>
```

### Conditional Display

Show elements only when data exists using `v-if`:

```html
<!-- Only show wake turbulence if it's set -->
<div class="field-group" v-if="wake">
  <label class="field-label">WAKE</label>
  <span class="badge">{{wake}}</span>
</div>
```

## Available Data Fields

### Core Fields (Always Available)
- `callsign` - Aircraft callsign (e.g., "SAS123")
- `atyp` - Aircraft type (e.g., "B738")
- `adep` - Departure airport (e.g., "ESSA")
- `ades` - Destination airport (e.g., "ENGM")
- `frul` - Flight rules (IFR/VFR/SVFR)

### Optional Fields
- `assr` - Squawk code (e.g., "1234")
- `sid` - Standard Instrument Departure
- `star` - Standard Terminal Arrival
- `rfl` - Requested Flight Level
- `cfl` - Cleared Flight Level
- `tas` - True Air Speed
- `eobt` - Estimated Off-Block Time
- `eta` - Estimated Time of Arrival
- `rwy` - Runway
- `wake` - Wake turbulence category (L/M/H/J)

You can add custom fields - just add them to your strip data and reference them in the template!

## Styling

### Layout Classes

- `strip-layout` - Main container
- `strip-header-row` - Horizontal header layout
- `strip-row` - Horizontal content row
- `strip-divider` - Horizontal line separator

### Field Classes

- `field-group` - Container for label + value
- `field-label` - Small uppercase label
- `field-value` - Larger data value

### Flex Sizing

- `flex-1` - Takes 1 unit of available space
- `flex-2` - Takes 2 units of available space
- (Tip: All flex values in a row should sum to equal parts)

### Value Styling (Colors)

Apply these classes to `field-value` for semantic colors:

```html
<span class="field-value callsign">{{callsign}}</span>      <!-- Bold, standard -->
<span class="field-value highlight">{{assr}}</span>         <!-- Yellow -->
<span class="field-value airport">{{adep}}</span>           <!-- Blue -->
<span class="field-value route">{{sid}}</span>              <!-- Green -->
<span class="field-value time">{{eobt}}</span>              <!-- Orange -->
```

### Chips and Badges

```html
<!-- Flight rule chip (auto-colored) -->
<span class="chip chip-{{frul}}">{{frul}}</span>

<!-- Wake turbulence badge -->
<span class="badge badge-wake">{{wake}}</span>
```

## Complete Examples

### Compact Layout

A minimal strip showing only essential information:

```html
<div class="strip-layout">
  <div class="strip-row">
    <div class="field-group flex-2">
      <span class="field-value callsign">{{callsign}}</span>
    </div>
    <div class="field-group flex-1">
      <span class="chip chip-{{frul}}">{{frul}}</span>
    </div>
  </div>
  
  <div class="strip-row">
    <div class="field-group flex-1">
      <span class="field-value airport">{{adep}}</span>
    </div>
    <div class="field-group flex-1">
      <span class="field-value">→</span>
    </div>
    <div class="field-group flex-1">
      <span class="field-value airport">{{ades}}</span>
    </div>
  </div>
</div>
```

### Detailed Layout

A comprehensive strip with all available fields:

```html
<div class="strip-layout">
  <!-- Header -->
  <div class="strip-header-row">
    <div class="field-group callsign-group">
      <span class="field-value callsign">{{callsign}}</span>
    </div>
    <div class="field-group">
      <span class="chip chip-{{frul}}">{{frul}}</span>
    </div>
    <div class="field-group" v-if="wake">
      <span class="badge">{{wake}}</span>
    </div>
  </div>

  <!-- Aircraft Info -->
  <div class="strip-row">
    <div class="field-group flex-1">
      <label class="field-label">TYPE</label>
      <span class="field-value highlight">{{atyp}}</span>
    </div>
    <div class="field-group flex-1">
      <label class="field-label">SQUAWK</label>
      <span class="field-value highlight">{{assr || '----'}}</span>
    </div>
    <div class="field-group flex-1">
      <label class="field-label">SPEED</label>
      <span class="field-value">{{tas || '---'}}</span>
    </div>
  </div>

  <div class="strip-divider"></div>

  <!-- Route -->
  <div class="strip-row">
    <div class="field-group flex-1">
      <label class="field-label">FROM</label>
      <span class="field-value airport">{{adep}}</span>
    </div>
    <div class="field-group flex-2">
      <label class="field-label">VIA</label>
      <span class="field-value route">{{sid || star || 'DCT'}}</span>
    </div>
    <div class="field-group flex-1">
      <label class="field-label">TO</label>
      <span class="field-value airport">{{ades}}</span>
    </div>
  </div>

  <div class="strip-divider"></div>

  <!-- Level & Time -->
  <div class="strip-row">
    <div class="field-group flex-1">
      <label class="field-label">RFL</label>
      <span class="field-value">{{rfl || '---'}}</span>
    </div>
    <div class="field-group flex-1">
      <label class="field-label">RWY</label>
      <span class="field-value">{{rwy || '--'}}</span>
    </div>
    <div class="field-group flex-1">
      <label class="field-label">TIME</label>
      <span class="field-value time">{{eobt || eta || '--:--'}}</span>
    </div>
  </div>
</div>
```

## Tips & Tricks

### 1. Live Editing

Changes to templates take effect immediately - just refresh your browser!

### 2. Keep Backups

Before making major changes, copy the template file:

```bash
cp frontend/public/templates/strip-template.html frontend/public/templates/strip-template.backup.html
```

### 3. Test Different Strip Types

Create different strips (departure/arrival/neutral) to see how your template looks with various data.

### 4. Use Browser DevTools

Right-click on a strip and select "Inspect Element" to experiment with CSS in real-time.

### 5. Share Your Templates

Created an awesome template? Share it with the community! Templates are just HTML files that are easy to distribute.

## Troubleshooting

### Template Not Updating?

1. **Hard refresh** your browser: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache**: In browser settings, clear cached images and files
3. **Check console**: Open browser DevTools (F12) and look for errors

### Fields Not Showing?

- Make sure the field exists in your strip data
- Use default values: `{{fieldName || 'N/A'}}`
- Check for typos in variable names

### Layout Broken?

- Ensure all `<div>` tags are properly closed
- Check that class names are spelled correctly
- Verify flexbox values add up correctly

### Template Not Loading?

- Confirm the file is in `frontend/public/templates/`
- Check the filename matches exactly (case-sensitive)
- Look for JavaScript errors in browser console

## Going Further

### Custom Strip Types

Want to create your own strip type? 

1. Create a new template: `frontend/public/templates/my-custom-template.html`
2. Edit `frontend/src/services/templateLoader.js`
3. Add your type to the `getTemplateForType()` method:

```javascript
getTemplateForType(stripType) {
  switch (stripType) {
    case 'departure':
      return 'departure-strip-template'
    case 'arrival':
      return 'arrival-strip-template'
    case 'my-custom':
      return 'my-custom-template'
    default:
      return 'strip-template'
  }
}
```

### Advanced Styling

Add custom CSS by editing `frontend/src/components/FlightStrip.vue` in the `<style>` section. Use `:deep()` to style template content:

```css
:deep(.my-custom-class) {
  background-color: #ff0000;
  font-weight: bold;
}
```

## Need Help?

- Check `templates/README.md` for detailed documentation
- Look at the existing templates for examples
- File an issue on GitHub for support

Happy customizing! ✈️

