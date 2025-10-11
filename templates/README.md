# VATEFS Strip Templates

This directory contains template definitions for electronic flight strips used in VATEFS.

## Template Structure

Each template is defined in JSON format and includes:

- **fields**: Array of field definitions with validation rules
- **layout**: Visual layout configuration for the strip
- **colors**: Color scheme for different flight rules

## Standard Template

The `strip-template.json` file defines the standard VATSIM flight strip with the following fields:

| Field | Label | Description | Required |
|-------|-------|-------------|----------|
| callsign | CALLSIGN | Aircraft callsign | Yes |
| tas | TAS | True Air Speed (knots) | No |
| frul | FRUL | Flight Rules (IFR/VFR/SVFR) | Yes |
| atyp | ATYP | Aircraft Type (ICAO) | Yes |
| assr | ASSR | SSR Code (Squawk) | No |
| sid | SID | Standard Instrument Departure | No |
| eobt | EOBT | Estimated Off-Block Time | No |
| adep | ADEP | Departure Aerodrome (ICAO) | Yes |
| ades | ADES | Destination Aerodrome (ICAO) | Yes |
| rfl | RFL | Requested Flight Level | No |

## Creating Custom Templates

To create a custom template:

1. Copy `strip-template.json` to a new file
2. Modify the fields array to add/remove/change fields
3. Update the layout configuration
4. Adjust colors as needed
5. Save with a descriptive name (e.g., `arrival-strip-template.json`)

## Field Types

Supported field types:
- `text`: Free text input
- `number`: Numeric input
- `select`: Dropdown selection
- `time`: Time picker

## Validation

Fields support various validation rules:
- `required`: Field must be filled
- `maxLength`: Maximum character length
- `pattern`: RegEx pattern for validation
- `options`: Valid values for select fields

