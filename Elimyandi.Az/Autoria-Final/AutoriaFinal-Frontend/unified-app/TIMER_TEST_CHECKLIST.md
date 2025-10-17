# Timer Synchronization Test Checklist

## Quick Testing Steps

### ✅ Test 1: Basic Timer Sync (2 minutes)
1. Open live auction in Browser 1 (Chrome)
2. Open same auction in Browser 2 (Firefox/Incognito)
3. **Verify**: Both show same timer counting down together

### ✅ Test 2: Join Mid-Auction (2 minutes)
1. Start auction and wait 20 seconds
2. Open auction in a new browser (Browser 2)
3. **Verify**: Browser 2 shows current time (NOT full timer)
4. **Verify**: Both browsers continue in sync

### ✅ Test 3: Timer Reset on Bid (1 minute)
1. Have 2 browsers open on same auction
2. Place a bid in Browser 1
3. **Verify**: Timer resets to 10s in BOTH browsers simultaneously
4. **Verify**: Both continue counting from 10s together

### ✅ Test 4: Reconnection (3 minutes)
1. Open auction in browser
2. Open DevTools → Network tab → Go offline
3. Wait 10 seconds
4. Go back online
5. **Verify**: Timer re-syncs to correct current time
6. **Verify**: No jump to wrong time

### ✅ Test 5: Console Verification (1 minute)
1. Open auction with DevTools console
2. Look for these logs:
   - `✅ Joined auction group`
   - `✅ Joined active car group`
   - `⏱️ Timer Info: { timerSeconds: X, isLive: true }`
   - `✅ Synced - Timer: Xs, Live: true`
   - `⏰ [REAL-TIME] Timer Tick: Xs` (every second)

## What to Watch For

### ✅ Good Signs
- Both browsers show same time (±1 second)
- Timer counts down smoothly
- On bid, both reset together
- Console shows tick events every second
- Reconnection re-syncs properly

### ❌ Bad Signs
- Timers drift apart by >2 seconds
- New user sees full timer instead of current
- Timer doesn't reset on bid
- Console shows "disconnected" repeatedly
- No tick events in console

## Console Commands for Testing

### Check Current Timer State
```javascript
// In browser console while on live auction page
console.log('Timer:', state.timerSeconds);
console.log('Is Live:', state.isLive);
console.log('Is Connected:', isConnected);
```

### Manual Timer Fetch
```javascript
// Test the timer API endpoint
fetch('https://localhost:7249/api/Auction/{auctionId}/timer', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
.then(r => r.json())
.then(console.log);
```

### Check SignalR Connection
```javascript
// Check connection state
console.log('Connection State:', connectionState);
console.log('Is Connected:', isConnected);
```

## Expected Results Summary

| Test | Expected Behavior | Acceptable Variance |
|------|------------------|---------------------|
| Multi-user sync | Same time displayed | ±1 second |
| Join mid-auction | Shows current server time | ±2 seconds |
| Bid reset | Both reset simultaneously | < 1 second |
| Reconnection | Re-syncs to current time | ±2 seconds |
| Timer ticks | Receive every second | Events may batch |

## Backend Verification

If issues persist, check backend is:
1. Broadcasting `onTimerTick` events every second
2. Endpoint `/api/Auction/{id}/timer` returns correct data
3. SignalR hubs are running and accessible
4. Authentication tokens are valid

## Quick Fix Guide

### Issue: Timer not syncing
**Solution**: Refresh page to rejoin groups

### Issue: Disconnections
**Solution**: Check auth token, re-login if expired

### Issue: No timer updates
**Solution**: Verify backend SignalR is running and broadcasting events

### Issue: Wrong time on join
**Solution**: Check timer API endpoint is returning correct `timerSeconds`

---

## How to Run Tests

1. **Start Backend**: Ensure backend is running on https://localhost:7249
2. **Start Frontend**: Run `npm run dev` in unified-app folder
3. **Open Multiple Browsers**: Chrome + Firefox (or Chrome + Incognito)
4. **Login**: Login as different users in each browser
5. **Navigate to Live Auction**: Go to active auction
6. **Run Tests**: Follow checklist above

## Expected Test Duration
- **Total**: ~10 minutes
- **Quick smoke test**: 3 minutes (Tests 1, 2, 3)
- **Full verification**: 10 minutes (All tests)

## Report Issues

If you find any issues, please provide:
1. Browser console logs
2. Which test failed
3. Expected vs actual behavior
4. Screenshots if possible
5. Network tab showing SignalR connections

