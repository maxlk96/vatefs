# WAN Access Configuration for VATEFS

This guide explains how to access VATEFS from outside your local network (WAN/Internet).

## Prerequisites

✅ You've already forwarded these ports on your router:
- **Port 5173** (Frontend - Vite Dev Server)
- **Port 3000** (Backend - WebSocket Server)

## Server Configuration

The server is already configured to accept WAN connections:

### Backend (Port 3000)
- ✅ Listens on `0.0.0.0` (all network interfaces)
- ✅ CORS allows all origins
- ✅ WebSocket accepts connections from any IP

### Frontend (Port 5173)
- ✅ Listens on `0.0.0.0` (all network interfaces)
- ✅ Auto-detects backend URL based on hostname

## How to Access from WAN

### 1. Find Your Public IP Address

Visit https://whatismyipaddress.com/ to find your public IP address.

Example: `203.0.113.45`

### 2. Access VATEFS

From any device on the internet, open your browser and navigate to:

```
http://YOUR_PUBLIC_IP:5173
```

Example:
```
http://203.0.113.45:5173
```

The frontend will automatically connect to the backend at `YOUR_PUBLIC_IP:3000`.

## Starting the Servers

Make sure both servers are running on your host machine:

### Start Backend (Terminal 1)
```bash
cd backend
npm start
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Or use the provided start script:
```bash
start.bat
```

## Verification

After starting the servers, you should see:

**Backend Terminal:**
```
VATEFS Backend running on 0.0.0.0:3000
WebSocket server ready for connections
CORS origin: All origins allowed
```

**Frontend Terminal:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
➜  Network: http://YOUR_PUBLIC_IP:5173/
```

## Firewall Configuration

If you're still having issues, ensure Windows Firewall allows incoming connections:

### Windows Firewall Rules

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Choose "Port" → "TCP"
5. Enter port numbers: `3000, 5173`
6. Allow the connection
7. Apply to all profiles (Domain, Private, Public)
8. Name the rule "VATEFS"

## Troubleshooting

### Connection Failed

1. **Check if ports are open:**
   - Use https://www.yougetsignal.com/tools/open-ports/ to verify ports 3000 and 5173 are open
   
2. **Check firewall:**
   - Temporarily disable Windows Firewall to test
   - If it works, add firewall rules as described above

3. **Check router port forwarding:**
   - Ensure ports are forwarded to the correct local IP address
   - Your local IP may change (use DHCP reservation or static IP)

4. **Check if servers are running:**
   ```bash
   netstat -an | findstr "3000 5173"
   ```
   You should see:
   ```
   TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
   TCP    0.0.0.0:5173           0.0.0.0:0              LISTENING
   ```

### Backend Connection Errors

If the frontend loads but shows "Server connection" as red:

1. Check browser console (F12) for connection errors
2. Verify backend URL in console logs
3. Make sure backend server is running
4. Try accessing backend directly: `http://YOUR_PUBLIC_IP:3000/api/health`

## Security Considerations

⚠️ **Important Security Notes:**

1. **No Authentication:** The current setup has no authentication. Anyone with your IP can access VATEFS.

2. **HTTP Only:** The connection is not encrypted (no HTTPS/SSL). Consider setting up a reverse proxy with SSL if you need security.

3. **Production Use:** For production deployment, consider:
   - Using a proper web server (nginx, Apache)
   - Setting up SSL certificates (Let's Encrypt)
   - Implementing authentication
   - Using a domain name instead of IP address
   - Building the frontend for production (`npm run build`)

## Using a Dynamic DNS Service

If your ISP changes your public IP frequently, consider using a Dynamic DNS service:

- **No-IP** (https://www.noip.com/)
- **DynDNS** (https://dyn.com/)
- **Duck DNS** (https://www.duckdns.org/) - Free

This gives you a permanent domain name (e.g., `myvatefs.ddns.net`) that automatically updates when your IP changes.

## Local Network Access

Devices on your local network can access VATEFS using:
- Your local IP: `http://192.168.x.x:5173`
- localhost (on the host machine): `http://localhost:5173`

## Testing

Before sharing with others, test the WAN access:

1. Use your phone's mobile data (not WiFi)
2. Navigate to `http://YOUR_PUBLIC_IP:5173`
3. Verify both green indicators (Server + VATSIM) appear
4. Try creating and dragging strips

If it works on mobile data, it will work from anywhere on the internet!

## Questions?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console logs in both terminals
3. Check browser console (F12) for errors

