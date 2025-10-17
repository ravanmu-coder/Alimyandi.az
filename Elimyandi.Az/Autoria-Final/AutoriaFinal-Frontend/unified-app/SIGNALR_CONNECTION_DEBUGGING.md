# SignalR Connection State Debugging Guide

## Problem
WebSocket connection shows as connected in browser DevTools, but the React UI shows "Connection Issue: Disconnected".

## Root Cause
This is a **state synchronization issue** between the actual WebSocket connection and the React component state. The underlying connection works, but the state update isn't propagating correctly.

## Diagnostic Steps

### 1. Check Browser Console Logs

Look for these log messages in order:

#### ✅ **Good Signs** (Connection Working):
```
🔧 Initializing SignalR hook for instance: ...
SignalR: Starting connection for instance ...
SignalR: Connected successfully
🔄 useSignalR: Connection state changed to "Connected"
✅ Connected - group joining will be handled by useEffect
```

#### ❌ **Bad Signs** (State Not Updating):
```
🔍 SignalR Status Update: { isConnected: false, connectionState: "Disconnected" }
⚠️ STATE MISMATCH: connectionState is "Connected" but isConnected is false!
```

### 2. Check WebSocket in DevTools

1. Open Chrome DevTools → **Network** tab
2. Filter by **WS** (WebSockets)
3. Look for connections to `/auctionHub` and `/bidHub`
4. Status should show **101 Switching Protocols** (green)
5. Click on the connection → **Messages** tab
6. You should see messages flowing (timer ticks, bids, etc.)

### 3. Manual State Check

Open browser console and run:

```javascript
// Check the actual manager state
console.log('Manager State:', window.__signalRDebug);

// Check React component state
console.log('Component State:', {
  isConnected,
  connectionState,
  isConnecting
});
```

## Fixes Applied

### Fix 1: Enhanced State Logging
**File**: `unified-app/src/hooks/useSignalR.ts`

Added comprehensive logging to track state changes:
- Logs when initializing
- Logs every connection state change
- Logs initial state setting

### Fix 2: Periodic State Sync
**File**: `unified-app/src/hooks/useSignalR.ts`

Added a 2-second interval that checks if React state matches the actual manager state and corrects mismatches automatically:

```typescript
// Periodic state sync to ensure React state matches manager state
useEffect(() => {
  const syncInterval = setInterval(() => {
    const managerState = manager.current.getConnectionState();
    setConnectionState(prevState => {
      if (prevState !== managerState) {
        console.warn(`⚠️ State sync: Correcting state mismatch`);
        return managerState;
      }
      return prevState;
    });
  }, 2000);
  return () => clearInterval(syncInterval);
}, []);
```

### Fix 3: Manual Reconnect Button
**File**: `unified-app/src/pages/LiveAuctionPage.tsx`

Added "Try Reconnect" button that manually triggers reconnection without page refresh.

### Fix 4: Connection State Display
**File**: `unified-app/src/pages/LiveAuctionPage.tsx`

Changed UI to use `connectionState` string directly instead of derived boolean, making it more accurate.

## Testing Instructions

### Test 1: Fresh Page Load
1. Open live auction page
2. Check console for initialization logs
3. Within 2-3 seconds, connection should show as "Connected & Synced"
4. If not, click "Try Reconnect" button

### Test 2: Manual Reconnect
1. If showing "Disconnected", click "Try Reconnect"
2. Watch console logs
3. Should see:
   ```
   🔄 Manual reconnect triggered
   SignalR: Starting connection...
   ✅ Reconnect complete
   ```

### Test 3: State Mismatch Detection
1. Watch console logs
2. If you see: `⚠️ State sync: Correcting state mismatch`
3. The periodic sync is working and fixing the issue automatically

## Common Issues & Solutions

### Issue 1: "Disconnected" on Page Load
**Symptom**: Always shows "Disconnected" even though WS is connected

**Solution**: 
- The periodic state sync should fix this within 2 seconds
- If not, click "Try Reconnect"
- Check console for state mismatch warnings

### Issue 2: State Flickers Between Connected/Disconnected
**Symptom**: Connection status keeps changing

**Causes**:
- Multiple SignalR instances being created
- Config object recreated on every render
- Network instability

**Solutions**:
- Check console for multiple "Initializing SignalR hook" messages
- Ensure `baseUrl` and `token` are stable values
- Check network stability

### Issue 3: WebSocket Shows Connected, But No Events
**Symptom**: WS connected in DevTools, but no timer ticks or bid events

**Causes**:
- Not joined to auction/car groups
- Backend not broadcasting events
- Event handlers not set up

**Solutions**:
- Check console for "✅ Joined auction group" messages
- Verify backend is broadcasting events
- Check Network tab → WS → Messages for incoming data

## Debug Commands

Run these in browser console:

```javascript
// 1. Check current state
console.table({
  isConnected,
  isConnecting,
  connectionState,
  lastError
});

// 2. Force reconnect
// (Find reconnect button and click it programmatically)
document.querySelector('[onClick*="reconnect"]')?.click();

// 3. Check localStorage
console.log('Auth Token:', localStorage.getItem('authToken')?.substring(0, 20));

// 4. Check environment
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

// 5. Manual connection test
fetch('https://localhost:7249/api/health', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
}).then(r => r.ok ? console.log('✅ API reachable') : console.error('❌ API unreachable'));
```

## What the Console Should Show

### On Successful Connection:

```
🔧 Initializing SignalR hook for instance: https://localhost:7249_abc123def
SignalR: Creating connections for instance ...
SignalR: Creating AuctionHub connection to: https://localhost:7249/auctionHub
SignalR: Creating BidHub connection to: https://localhost:7249/bidHub
SignalR: Starting connection for instance ...
✅ SignalR: AuctionHub started for ...
✅ SignalR: BidHub started for ...
🔄 useSignalR: Connection state changed to "Connected"
SignalR: Connected successfully
🔍 SignalR Status Update: { isConnected: true, connectionState: "Connected", ... }
🔌 Connection ready, joining SignalR groups...
✅ Joined auction group: {auctionId}
✅ Joined active car group: {carId}
✅ Synced - Timer: 45s, Live: true
```

### On State Mismatch (Auto-Fixed):

```
🔍 SignalR Status Update: { isConnected: false, connectionState: "Disconnected", ... }
⚠️ STATE MISMATCH: connectionState is "Connected" but isConnected is false!
⚠️ State sync: Correcting state mismatch. Was "Disconnected", now "Connected"
🔍 SignalR Status Update: { isConnected: true, connectionState: "Connected", ... }
```

## Backend Requirements

For proper connection state, backend must:

1. **Accept WebSocket connections** on `/auctionHub` and `/bidHub`
2. **Authenticate** using Bearer token
3. **Broadcast events** every second (timer ticks)
4. **Accept group joining** via `JoinAuction()` and `JoinAuctionCar()` methods

## Still Not Working?

If after all fixes the connection still shows as disconnected:

### Step 1: Verify Backend
```bash
# Check if SignalR endpoints are accessible
curl -I https://localhost:7249/auctionHub
# Should return 404 for GET (normal for SignalR)

# Check health endpoint
curl https://localhost:7249/api/health
# Should return 200 OK
```

### Step 2: Check CORS
Backend must allow WebSocket connections:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

### Step 3: Check SSL Certificate
For localhost development, you might need to accept the self-signed certificate:
1. Go to https://localhost:7249 in browser
2. Click "Advanced" → "Proceed to localhost (unsafe)"
3. Reload auction page

### Step 4: Try Different Transport
If WebSockets fail, SignalR can fall back to Server-Sent Events:

**File**: `LiveAuctionPage.tsx`
```typescript
const signalRHook = useSignalR({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
  token: localStorage.getItem('authToken') || '',
  autoConnect: true,
  transport: signalR.HttpTransportType.ServerSentEvents, // Add this
  events: { ... }
});
```

## Quick Fix Checklist

- [ ] Console shows "Connected successfully"
- [ ] Console shows "Joined auction group"
- [ ] Console shows timer tick events ("⏰ [REAL-TIME] Timer Tick")
- [ ] WS tab in DevTools shows 2 connections (auctionHub + bidHub)
- [ ] WS Messages tab shows incoming data
- [ ] No "STATE MISMATCH" warnings (or auto-corrected within 2s)
- [ ] UI shows "Connected & Synced" in green
- [ ] Timer is counting down
- [ ] Can place bids successfully

## Contact Info

If issue persists after trying all fixes:
1. Take screenshot of console logs
2. Export HAR file from Network tab
3. Note which step in this guide failed
4. Share all three with development team

