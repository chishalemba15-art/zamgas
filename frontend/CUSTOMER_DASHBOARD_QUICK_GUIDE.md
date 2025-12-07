# Customer Dashboard - Quick Testing Guide

## 🚀 Quick Start

### 1. Access the Dashboard
```
http://localhost:8080/customer/dashboard
```

### 2. Test Location Permission Modal

**First, reset the permission flag:**
```javascript
// Open Browser DevTools (F12) → Console
localStorage.removeItem('locationPermissionAsked')
// Then refresh the page
```

**You should see:**
- Beautiful modal with location permission request
- Red/orange gradient design
- Benefits list
- Two buttons: "Allow Location Access" and "Maybe Later"

### 3. Test "Allow Location" Flow

**Click "Allow Location Access"**

**Expected behavior:**
1. Browser shows native location permission dialog
2. Modal closes
3. Toast appears: "Location updated successfully!"
4. Location coordinates appear in the header
5. Toast appears: "Selected nearest provider: [Provider Name]"
6. Provider is highlighted in the list
7. "Place Order" button is ACTIVE ✅

**To verify location was saved:**
```javascript
// In Console
console.log(localStorage.getItem('locationPermissionAsked')) // Should be 'true'
```

### 4. Test "Maybe Later" Flow

**Reset and test denial:**
```javascript
localStorage.removeItem('locationPermissionAsked')
// Refresh page
```

**Click "Maybe Later"**

**Expected behavior:**
1. Modal closes
2. Toast appears: "We'll select a provider for you"
3. Toast appears: "Selected [Random Provider] as your provider"
4. Random provider is highlighted
5. "Place Order" button is ACTIVE ✅

### 5. Test Provider Selection

**Manual selection:**
- Click on any provider card
- Provider card should:
  - Get a red border
  - Show shadow effect
  - Be visually highlighted

**Nearest provider banner:**
- Only appears if location is available
- Shows provider name and distance
- Has "Select" button

## 🐛 Debugging

### Check Current State
```javascript
// In Browser Console
console.log('Permission asked:', localStorage.getItem('locationPermissionAsked'))
console.log('Location:', {
  lat: /* check state */,
  lng: /* check state */
})
```

### Network Requests to Monitor

**When location is allowed:**
```
PUT /user/location
{
  "latitude": -15.xxxx,
  "longitude": 28.xxxx
}
```

**Provider endpoints:**
```
GET /providers                        // All providers
POST /customer/nearest-provider       // Nearest based on location
GET /customer/preferences             // User's saved preferences
```

### Common Issues & Fixes

**Issue: Modal doesn't appear**
```javascript
// Fix: Clear the flag
localStorage.removeItem('locationPermissionAsked')
// Refresh page
```

**Issue: Location permission denied**
- Check browser settings (chrome://settings/content/location)
- Make sure localhost is allowed
- Try allowing location when browser prompts

**Issue: No provider selected**
- Check that providers exist: `GET /providers`
- Check browser console for errors
- Verify backend is running

## 📱 Mobile Testing

### iOS Safari
- Requires HTTPS (or localhost)
- May prompt differently
- Test in simulator or real device

### Android Chrome
- Works on localhost
- Clear site data if testing multiple times
- Check Chrome → Settings → Site Settings → Location

## 🎨 Visual Indicators

### Location Enabled
```
✅ Header shows: [MapPin Icon] -15.4167, 28.2833
✅ "Nearest Provider" banner visible
✅ Provider shows distance (e.g., "2.3 km away")
✅ Toast: "Selected nearest provider: XYZ"
```

### No Location
```
ℹ️  No coordinates in header
⚠️  No "Nearest Provider" banner
ℹ️  Toast: "Selected [Provider] as your provider"
✅ Random provider still selected
```

### Provider Selected
```
✅ Red border (2px solid)
✅ Shadow effect
✅ Visual highlight
✅ "Place Order" button active
```

## 🔄 Reset Everything for Fresh Test

```javascript
// Complete reset
localStorage.clear()
location.reload()
```

## 📊 Test Scenarios

### Scenario 1: Happy Path
1. ✅ First visit
2. ✅ Allow location
3. ✅ Nearest provider selected
4. ✅ Fill delivery address
5. ✅ Click "Place Order"
6. ✅ Order created successfully

### Scenario 2: No Location
1. ✅ First visit
2. ✅ Deny location
3. ✅ Random provider selected
4. ✅ Fill delivery address
5. ✅ Click "Place Order"
6. ✅ Order created successfully

### Scenario 3: Returning User
1. ✅ Already visited before
2. ✅ No modal
3. ✅ Provider auto-selected
4. ✅ Ready to order

### Scenario 4: Saved Preference
1. ✅ User has preferred provider
2. ✅ That provider auto-selected
3. ✅ Overrides nearest/random logic

## 🎯 Success Criteria

- [ ] Modal appears only on first visit
- [ ] Location permission works
- [ ] Provider is always auto-selected
- [ ] "Place Order" button is always active
- [ ] Orders can be placed successfully
- [ ] Location coordinates are displayed
- [ ] User experience is smooth

## 🔍 Advanced Testing

### Test with Network Throttling
```
DevTools → Network → Throttling → Fast 3G
```
Verify:
- Loading states work
- Timeouts are handled
- Error messages are shown

### Test with Location API Failure
```javascript
// Mock geolocation error
navigator.geolocation.getCurrentPosition = (success, error) => {
  error({ code: 1, message: 'User denied' })
}
```
Verify:
- Fallback to random provider
- Error toast appears
- App doesn't crash

---

**Happy Testing! 🎉**

If you find any issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for API errors
4. Database for data presence
