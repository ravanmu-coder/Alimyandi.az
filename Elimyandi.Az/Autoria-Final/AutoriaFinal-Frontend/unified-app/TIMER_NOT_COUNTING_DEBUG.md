# Timer Not Counting Down - Debug Guide

## Symptom
You see timer tick events in console (`⏰ [REAL-TIME] Server Timer: 30s`) but the timer displayed on screen doesn't count down.

## What to Check

### 1. Console Logs to Look For

When the timer tick event arrives, you should see:

```
⏰ [REAL-TIME] Timer Tick Event Received: {
  remainingSeconds: 30,
  fullData: {...},
  currentStateTimer: 30
}
⏱️ Updating timer: 30s → 30s
⏰ [REAL-TIME] Server Timer State: 30s (Client timer disabled)
🎨 UI should display: 0:30
```

### 2. Check If State Is Updating

**Problem Scenario A**: Timer stays at same value
```
⏰ Timer Tick: 30s
⏱️ Updating timer: 30s → 30s  ← STUCK!
⏰ Timer Tick: 30s
⏱️ Updating timer: 30s → 30s  ← STUCK!
```

**Solution A**: Timer value from server is wrong or not changing
- Check backend - is it actually counting down?
- Check if `data.remainingSeconds` is defined

**Problem Scenario B**: State updates but UI doesn't
```
⏱️ Updating timer: 30s → 29s  ✓
⏱️ Updating timer: 29s → 28s  ✓
⏱️ Updating timer: 28s → 27s  ✓
(But UI still shows 30)
```

**Solution B**: React not re-rendering
- Check if component is memoized incorrectly
- Check if state.timerSeconds is being read correctly

### 3. Manual Console Test

Open browser console and run:

```javascript
// Check current timer state
console.log('Timer State:', state.timerSeconds);

// Check if timer is defined
console.log('Timer exists?', state.timerSeconds !== undefined);

// Check the display
console.log('Formatted:', formatTime(state.timerSeconds));

// Force a state update (in console)
setState(prev => ({ ...prev, timerSeconds: 25 }));
// Check if UI updates
```

## Common Issues

### Issue 1: Server Not Sending Correct Data

**Check backend**: Is `remainingSeconds` being sent in the event?

```csharp
// Backend should send:
await Clients.Group(auctionId).SendAsync("TimerTick", new {
    auctionCarId = carId,
    remainingSeconds = timer  // ← Must be present!
});
```

### Issue 2: Wrong Event Handler

**Check**: Is `onTimerTick` being called?

Add this to see if event fires:
```javascript
onTimerTick: (data) => {
  alert('Timer tick received: ' + data.remainingSeconds);
  // ... rest of handler
}
```

### Issue 3: State Not Accessible in Closure

The `state` in the event handler might be stale. Try using refs:

```javascript
const timerRef = useRef(state.timerSeconds);

// Update ref when state changes
useEffect(() => {
  timerRef.current = state.timerSeconds;
}, [state.timerSeconds]);

// Use ref in event handler
onTimerTick: (data) => {
  console.log('Current timer:', timerRef.current);
  console.log('New timer:', data.remainingSeconds);
  // ...
}
```

### Issue 4: Multiple SignalR Instances

Multiple instances might be overwriting state. Check:

```javascript
// In console
console.log('SignalR instances:', 
  window.__signalRDebug || 'not available');
```

Should only see 1 instance per user.

## Quick Fixes to Try

### Fix 1: Force Re-render
Add a counter that increments to force React to re-render:

```typescript
const [renderKey, setRenderKey] = useState(0);

onTimerTick: (data) => {
  setState(prev => ({
    ...prev,
    timerSeconds: data.remainingSeconds
  }));
  setRenderKey(k => k + 1); // Force re-render
}
```

### Fix 2: Use Callback Ref for Timer Display

Instead of reading from state, use a ref:

```typescript
const timerDisplayRef = useRef<HTMLDivElement>(null);

onTimerTick: (data) => {
  // Update DOM directly
  if (timerDisplayRef.current) {
    timerDisplayRef.current.textContent = formatTime(data.remainingSeconds);
  }
  // Also update state
  setState(prev => ({ ...prev, timerSeconds: data.remainingSeconds }));
}

// In JSX
<div ref={timerDisplayRef} className="...">
  {formatTime(state.timerSeconds)}
</div>
```

### Fix 3: Verify Data Structure

The event data might have a different structure:

```javascript
onTimerTick: (data) => {
  console.log('Full event data:', JSON.stringify(data, null, 2));
  
  // Try different property names
  const seconds = data.remainingSeconds 
                || data.secondsRemaining 
                || data.timerSeconds 
                || data.seconds;
  
  console.log('Extracted seconds:', seconds);
  setState(prev => ({ ...prev, timerSeconds: seconds }));
}
```

## What I Need From You

To debug this, please provide:

1. **Console output** after page load (copy 5-10 lines)
2. **Does the timer value in console change?** (30 → 29 → 28?)
3. **Screenshot** of the UI showing the timer
4. **Browser DevTools** → Network → WS → Messages tab (screenshot of a few messages)

This will tell us exactly where the problem is!

