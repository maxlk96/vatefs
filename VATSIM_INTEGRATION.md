# VATSIM Integration Guide

VATEFS integrates with the VATSIM network to automatically create and manage flight strips based on live traffic data.

## How It Works

### Data Source

VATEFS connects to the official VATSIM Data Feed API:
```
https://data.vatsim.net/v3/vatsim-data.json
```

This provides real-time information about:
- All connected pilots
- Flight plans
- Aircraft positions
- Active ATC controllers

### Airport Selection

When you start VATEFS, you select an airport to monitor. This can be:

1. **Preset Airports** - Quick selection of common Swedish airports:
   - ESGG - Göteborg Landvetter Airport
   - ESMS - Malmö Sturup Airport
   - ESNZ - Ängelholm-Helsingborg Airport
   - ESNU - Umeå Airport

2. **Custom Airport** - Any valid ICAO code worldwide

### Auto-Import on Startup

When you select an airport with "Auto-import" enabled:

1. VATEFS fetches all current pilots with flight plans from that airport
2. Creates a strip for each departure
3. Displays them in the strip board
4. Marks them as known flights

### Automatic Strip Creation

After startup, VATEFS monitors VATSIM for new departures:

1. **Polling** - Checks VATSIM data every 30 seconds
2. **Detection** - Identifies new flight plans from your selected airport
3. **Creation** - Automatically creates a departure strip
4. **Sync** - Broadcasts the new strip to all connected clients

### Strip Data Mapping

VATSIM flight plan data is mapped to strip fields:

| VATSIM Field | Strip Field | Description |
|--------------|-------------|-------------|
| callsign | CALLSIGN | Aircraft callsign |
| aircraft_short | ATYP | Aircraft type (ICAO code) |
| departure | ADEP | Departure airport |
| arrival | ADES | Destination airport |
| altitude | RFL | Requested flight level |
| cruise_tas | TAS | True air speed |
| flight_rules | FRUL | IFR/VFR |
| departure_procedure | SID | Standard Instrument Departure |
| transponder | ASSR | Squawk code |
| deptime | EOBT | Estimated off-block time |

### Duplicate Prevention

VATEFS prevents duplicate strips by:

1. Tracking known flights by unique ID: `callsign-departure-arrival`
2. Checking existing strips before creation
3. Only creating strips for truly new flight plans

## Usage Examples

### Monitoring a Major Hub

```
1. Select ESGG (Göteborg Landvetter)
2. Enable auto-import
3. System loads ~5-10 current departures
4. New strips appear as pilots file flight plans
```

### Multiple Controllers

VATEFS syncs across all connected clients:

```
Controller A: Monitoring strips at Clearance position
Controller B: Managing strips at Tower position
New flight files: Both see the strip appear automatically
```

### Manual Override

You can still:
- Manually create strips for non-VATSIM traffic
- Edit auto-created strips
- Delete strips as needed
- Change strip types

## Configuration

### Polling Interval

Default: 30 seconds

To change (in `frontend/src/services/vatsim.js`):
```javascript
vatsimService.startPolling(airport, callback, 60000) // 60 seconds
```

### Auto-Import

Toggle in the Airport Selector dialog:
- ✅ Enabled: Loads existing departures on startup
- ❌ Disabled: Only monitors new flight plans

### Airport Change

Click the airport chip in the top bar to:
- Change to a different airport
- See updated statistics
- Reset flight tracking

## Troubleshooting

### No Strips Appearing

**Check:**
1. Airport has active departures on VATSIM
2. Internet connection is working
3. VATSIM data feed is accessible
4. Browser console for errors

### Duplicate Strips

**Solution:**
- Restart the application
- Clear existing strips
- Re-select the airport

### Missing Data

**Note:**
- Not all VATSIM pilots fill complete flight plans
- Some fields may show "N/A"
- Edit manually if needed

### Polling Not Working

**Check:**
- Browser console for API errors
- Network tab for failed requests
- VATSIM status page

## API Rate Limits

VATSIM data feed has no strict rate limits, but:

- **Recommended**: Poll every 15-60 seconds
- **Minimum**: Don't poll faster than 15 seconds
- **Maximum**: Data updates approximately every 15 seconds

## Privacy & Data

- VATEFS only reads publicly available VATSIM data
- No authentication required
- No data is stored permanently
- All data is client-side only

## Future Enhancements

Planned features:

- [ ] Arrival strip auto-creation
- [ ] ATIS information display
- [ ] Controller coordination features
- [ ] Flight progress tracking
- [ ] Estimated arrival times
- [ ] Route display
- [ ] Aircraft position on map

## Support

For issues with VATSIM integration:

1. Check VATSIM network status
2. Verify your internet connection
3. Open browser developer console
4. Check for JavaScript errors
5. Report issues on GitHub

---

**Note**: VATEFS is not officially affiliated with VATSIM. We use their public data API in accordance with their terms of service.

