# Pokemon AR Hunt - Testing Guide

## How to Test the New Features

### 1. Pokemon Spawning (5-20m radius)

**Test Steps:**
1. Open the app and navigate to the "Hunt" tab
2. Tap "Start Hunt" button
3. Observe Pokemon spawning around your location

**Expected Results:**
- Pokemon should appear within a small radius around your position
- Maximum of 5 Pokemon on the map at once
- New Pokemon spawn every 10 seconds when under the limit
- Pokemon automatically disappear after 5 minutes

### 2. Distance-based Interaction (10-15m range)

**Test Steps:**
1. Look at the Pokemon markers on the map
2. Notice the visual differences between nearby and distant Pokemon
3. Tap on different Pokemon at various distances

**Expected Results:**
- **Nearby Pokemon (≤15m):**
  - Green border and light green background
  - Shows "📱 Tap to catch!" text
  - Distance shown in meters
  - Tapping shows interaction options
  
- **Distant Pokemon (>15m):**
  - Orange border and light orange background
  - Shows distance in meters
  - Tapping shows "You need to get closer!" message

### 3. AR Camera Integration

**Test Steps:**
1. Find a Pokemon within 15m (green border)
2. Tap on the Pokemon
3. Select "Enter AR Mode" from the dialog
4. Wait for AR camera to load

**Expected Results:**
- Should navigate to AR Camera tab
- Pokemon should auto-spawn in AR view after ~1.5 seconds
- "Spawning Pokemon..." loading message should appear initially
- Pokemon should appear with stats (height/weight)

### 4. AR Catch Mechanics

**Test Steps:**
1. In AR mode with a spawned Pokemon
2. Tap the "🎯 CATCH" button
3. Try multiple times to test success rate

**Expected Results:**
- ~80% success rate (much higher than quick catch)
- Success shows "Gotcha!" message and returns to hunt
- Failure shows "escaped" message but stays in AR

### 5. Navigation Flow

**Test Steps:**
1. From Hunt screen → Enter AR Mode
2. Use "← Back to Hunt" button in AR
3. Test tab navigation between Hunt and AR tabs

**Expected Results:**
- Smooth navigation between Hunt and AR modes
- Back button returns to Hunt tab
- Direct AR tab access also works
- No navigation errors or crashes

### 6. Quick Catch vs AR Catch

**Test Steps:**
1. Find nearby Pokemon (≤15m)
2. Try "Quick Catch" option several times
3. Try "Enter AR Mode" and catch several times
4. Compare success rates

**Expected Results:**
- Quick Catch: Lower success rate (~40-60%)
- AR Catch: Higher success rate (~80%)
- AR mode provides better catching experience

## Visual Indicators Guide

### Pokemon Marker Colors:
- **Green border + light green bg**: Interactable (≤15m)
- **Orange border + light orange bg**: Too far (>15m)
- **Distance number**: Shows exact meters away
- **"📱 Tap to catch!"**: Appears on nearby Pokemon

### AR Mode UI:
- **Auto-spawn loading**: "Spawning Pokemon..." with spinner
- **Pokemon display**: Large Pokemon with name and stats
- **Catch button**: Green "🎯 CATCH" button
- **Photo button**: Camera icon for screenshots
- **Back button**: "← Back to Hunt" in top-left

## Troubleshooting

### If Pokemon don't spawn:
1. Make sure "Start Hunt" is pressed
2. Wait up to 10 seconds for first spawn
3. Check that location services are enabled

### If AR mode doesn't work:
1. Grant camera permissions when prompted
2. Wait for auto-spawn (1.5 seconds)
3. Use back button to return to hunt if needed

### If navigation fails:
1. Make sure you're tapping nearby Pokemon (green border)
2. Try using the AR tab directly if needed
3. Restart app if navigation gets stuck

## Performance Notes

- Pokemon cleanup happens every 10 seconds
- Maximum 5 Pokemon prevents performance issues
- AR auto-spawn has built-in delay for camera initialization
- Mock location mode avoids GPS conflicts during development

## Success Criteria

✅ Pokemon spawn within 5-20m radius  
✅ Visual indicators show interaction range  
✅ AR mode auto-spawns Pokemon  
✅ Higher catch rates in AR mode  
✅ Smooth navigation between modes  
✅ No crashes or navigation errors  
✅ Proper cleanup and performance management