# 🚨 Quick SOS Alert Test - 5 Minute Guide

## ✅ Prerequisites
- Backend running: `http://localhost:8000` ✅
- Frontend running: `http://localhost:3000` ✅
- Parent & Child accounts linked (Family Linking completed)

---

## 🎯 Test in 5 Steps

### Step 1: Open Parent Dashboard
```
1. Go to http://localhost:3000
2. Log in as PARENT account
3. You'll see yellow warning: "Sound alerts are OFF"
```

### Step 2: Enable Sound Alerts
```
1. Look for top-right corner
2. Click "🔔 Enable Sound Alerts" button
3. You should hear a SHORT test siren burst
4. Feel a vibration pattern
5. Toast message: "Sound alerts enabled!"
```

### Step 3: Open Child Dashboard (New Browser Window)
```
1. Open new browser window/tab
2. Go to http://localhost:3000
3. Log in as CHILD/WARD account
4. Click "SOS Emergency" button on Dashboard
```

### Step 4: Confirm SOS Alert
```
1. Red popup appears: "Send SOS to your guardians?"
2. Click "SEND SOS" button (or wait 5 seconds)
3. Alert is sent to backend
```

### Step 5: Watch Parent Dashboard (Go Back to First Window)
```
Within 15 seconds, you should see:

🔊 LOUD REPEATING SIREN
   → Sounds like alarm/siren pattern
   → Repeats every 4 seconds
   → MUCH LOUDER than normal volume

📳 VIBRATION
   → Feel phone/device vibrate
   → Pulse pattern (ON-OFF-ON)
   → Viibrates in sync with siren

🔔 BROWSER NOTIFICATION
   → "🚨 EMERGENCY SOS ALERT!"
   → Shows ward name + location
   → Stays on screen prominently

🔴 RED BANNER AT TOP
   → "ACTIVE ALARM" flashing banner
   → Shows ward name who triggered SOS
   → Big red "STOP ALARM" button

✨ AUTO-SWITCH TO ALERTS TAB
   → Dashboard automatically shows Alerts tab
   → Shows full alert card with:
      - Ward name & photo
      - Location on live map
      - Timestamp
      - Call button
      - Options to mark as read
```

---

## 🛑 To Stop the Alarm

**Option 1:** Click "STOP ALARM" button in red banner
**Option 2:** Click "Mark as Read" on alert card
**Option 3:** Click "✓ Mark All as Read"

```
Expected:
✅ Siren stops immediately
✅ Vibration stops
✅ Red banner disappears
✅ Notification can be dismissed
```

---

## ✅ Success Indicators

- [ ] Test siren played when you clicked "Enable Sound Alerts"
- [ ] You heard LOUD repeating siren (should be startling)
- [ ] Mobile/device vibrated along with siren
- [ ] Browser notification appeared
- [ ] Red alarm banner showed up
- [ ] Stopped when you clicked button
- [ ] Location map showed on alert card
- [ ] Parent can see child details

---

## ⚠️ If Something Doesn't Work

| Problem | Solution |
|---------|----------|
| No sound | 1. Check system volume<br>2. Click "Enable Sound Alerts" first<br>3. Check browser console (F12) for errors |
| No vibration | 1. Check phone vibration is ON in settings<br>2. Try on Android device (iPhone limited support) |
| No notification | 1. Click "Allow" if browser asks for permission<br>2. Check browser notification settings |
| No alert showing | 1. Ensure child-parent link is ACCEPTED (not Pending)<br>2. Wait up to 15 seconds for polling |
| Won't stop | 1. Refresh page<br>2. Use browser DevTools to check network |

---

## 📊 What's Being Tested

✅ **Web Audio API** - Siren generation
✅ **Vibration API** - Mobile vibration
✅ **Browser Notifications** - Push alerts
✅ **Real-time Polling** - 15-second interval
✅ **Family Alert System** - Parent-child link
✅ **Database** - FamilyAlert creation
✅ **State Management** - Alert counter

---

## 🎬 Video Test Script (Optional)

If recording a demo:
1. Start both browser windows side-by-side
2. Show Parent dashboard with "Sound OFF" warning
3. Click "Enable Sound Alerts" - show test siren
4. Switch to Child window, send SOS
5. Show siren + vibration + notification on Parent
6. Show full alert details (map, info)
7. Stop alarm with button
8. All alerts visible in history

---

## 📝 Notes

- First time visiting ParentDashboard: Browser will ask for notification permission
- Sound is loud by design - use headphones if in quiet office!
- Vibration works best on actual mobile devices (Android > iOS)
- Polling happens every 15 seconds - wait if SOS doesn't appear immediately
- Multiple wards can trigger SOS - alarms stack
- Clicking "Enable Sound Alerts" unlocks audio context for autoplay

---

## 🚀 Next Steps After Testing

If everything works:
1. Test with multiple child-parent pairs
2. Try on actual Android device (APK on Desktop)
3. Test in background (browser tab in background)
4. Test notification permissions flow
5. Check database alerts are saved correctly

---

**Status:** ✅ Ready to test
**Both servers running on:** localhost:3000 (frontend) & localhost:8000 (backend)

