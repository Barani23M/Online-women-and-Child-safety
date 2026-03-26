# 🚨 Enhanced SOS Alert System - Complete Setup Guide

## Overview
The SOS emergency alert system now includes:
- **Loud Siren**: High-frequency audio alarm (880Hz+ pattern) that repeats every 4 seconds
- **Mobile Vibration**: Haptic feedback pattern that vibrates in sync with siren
- **Push Notifications**: Browser/OS notifications with emergency details  
- **Real-time Polling**: Parent dashboard checks for alerts every 15 seconds

---

## How It Works

### 1. **Child/Ward Triggers SOS**
- Opens SafeGuard app → Dashboard
- Taps "SOS Emergency" button
- SOS alert is sent to backend with:
  - Ward location (GPS)
  - Current timestamp
  - Ward contact info
  - Selfie (if enabled)

### 2. **Backend Creates Family Alert**
- Endpoint: `POST /api/sos`
- Creates `FamilyAlert` record linked to all linked parents
- Sends `Notification` to each parent: "[Child Name] triggered SOS!"

### 3. **Parent Dashboard Receives Alert**
- Polling every 15 seconds fetches new alerts
- **Sound Alerts ENABLED** (default after first "Enable Sound Alerts"):
  - ✅ Loud repeating siren plays automatically
  - ✅ Mobile vibrates in pulse pattern
  - ✅ Browser notification shows with "SOS ALERT!" message
  - ✅ Tab switches to "Alerts" automatically
  - ✅ Red warning banner shown with STOP button

### 4. **Parent Takes Action**
- Views alert details (location map, selfie, etc.)
- Clicks "Mark as Read" to stop siren + vibration
- Can call ward directly from alert card
- Can confirm alert was a drill/false alarm

---

## Technical Components

### Frontend Components

#### **alertService.js** (New)
```javascript
// Enhanced Alarm Manager with:
// - Louder siren (volume 0.7 vs 0.45)
// - Vibration patterns via Vibration API
// - Browser notification with emergency details
// - Automatic request for notification permissions

export const alertService = new EnhancedAlarmManager()
```

**Key Methods:**
- `alertService.start()` - Begin siren + vibration
- `alertService.stop()` - Stop alarm (when alert marked read)
- `alertService.unlock()` - Initialize audio context for autoplay

#### **ParentDashboard.jsx Updates**
```javascript
import { alertService, sendSOSNotification, requestNotificationPermission } from '../services/alertService'

// Changes:
// 1. Replaced old alarm with alertService
// 2. Added native push notifications on SOS
// 3. Request browser notification permission on mount
// 4. Updated warning message: "LOUD repeating siren + vibrations"
```

---

## Step-by-Step Testing

### **Scenario: Child sends SOS, Parent receives alert with sound + vibration**

#### Prerequisites:
1. ✅ Backend running: `http://localhost:8000`
2. ✅ Frontend running: `http://localhost:3000`
3. ✅ Linked child-parent accounts via Family Linking
4. ✅ Parent logged into ParentDashboard

#### Test Steps:

```
PARENT SIDE:
1. Log in to SafeGuard as Parent account
2. Go to "Parent Dashboard" 
3. Look for yellow warning banner (Sound alerts OFF)
4. Click "Enable Sound Alerts" button
   → You'll hear a test siren burst
   → Mobile might vibrate (test)
   → Toast appears: "Sound alerts enabled! You'll hear LOUD repeating siren + vibrations"

CHILD SIDE (in another browser window or device):
5. Log in as Child account
6. Go to Dashboard
7. Click "SOS Emergency" button
   → Red popup asks to confirm
   → Click "SEND SOS" (or auto-sends after 5 sec)
   → SOS is sent to backend

PARENT SIDE (watch carefully):
8. Within 15 seconds:
   🔊 LOUD siren starts playing repeatedly
   📳 Mobile vibrates in pulse pattern
   🔔 Browser notification appears: "🚨 EMERGENCY SOS ALERT!"
   🔴 Red "ACTIVE ALARM" banner appears at top
   ✨ "Alerts" tab automatically selected
   
9. To stop alarm:
   - Click "STOP ALARM" button in red banner, OR
   - Mark alert as read in alerts list
   → Siren stops immediately
   → Vibration stops
   → Notification dismissed

VERIFY SUCCESS:
✅ Siren played for 4+ seconds
✅ Vibration felt on mobile
✅ Notification appeared
✅ Alert visible in dashboard
✅ Child location shown on map
✅ Stopping alarm works
```

---

## Vibration & Sound Features

### Audio (Siren)
**Frequency Pattern:**
```
960Hz  → 0.14s
1440Hz → 0.14s  
960Hz  → 0.14s
1760Hz → 0.22s  (higher pitched)
960Hz  → 0.14s
1440Hz → 0.14s
```
**Repeats every 4 seconds** until stopped

**Volume:** 0.7 (max is 1.0) - Very loud on mobile devices

### Vibration (Mobile)
**Pattern:** `[200ms ON, 100ms OFF, 200ms ON]`

Works on:
- ✅ Android phones (via Capacitor WebView)
- ✅ iPhones (limited support via Vibration API)
- ✅ Desktop browsers (not applicable but won't error)

---

## Browser Notification Permission

First time you visit ParentDashboard:
- Browser asks: "Allow SafeGuard notifications?"
- Click "Allow" to enable push notifications
- Each SOS will show system notification with ward name + location

If you decline:
- SOS still plays sound + vibration in browser
- But native notifications won't show

To re-enable:
- Go to browser settings → Notifications → SafeGuard → Allow

---

## Mobile (Android APK) Testing

The APK at `Desktop/SafeGuard-app-debug.apk` includes:
- ✅ Vibration API hooked into native Android vibration
- ✅ Audio plays through system speakers at max volume
- ✅ Background tab polling continues (15s intervals)
- ✅ Web assets synced with latest vibration code

#### To test on phone:
1. Install APK on Android device
2. Open app → Log in as Parent
3. Enable sound alerts
4. Go to Dashboard as Child → Send SOS
5. Parent phone should:
   - 📳 Vibrate forcefully
   - 🔊 Emit loud repeating siren
   - 🔔 Show notification (if permissions granted)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No sound on parent dashboard | ✅ Click "Enable Sound Alerts" first |
| Sound won't stop | ✅ Click "STOP ALARM" or mark alert as read |
| No vibration | ✅ Browser may not support (check settings) OR mobile vibration disabled in OS |
| Notification not showing | ✅ Browser notification permission denied → Allow in settings |
| Alert not appearing | ✅ Ensure child-parent link **Accepted** (parent dashboard Pending Requests tab) |
| Polling not updating | ✅ Parent dashboard needs audio context unlocked (click Enable Alerts first) |

---

## Backend Integration

The backend already supports everything needed:

### **Endpoints Involved:**
- `POST /api/sos` - Child sends SOS
- `POST /api/family/alert` - Backend creates FamilyAlert for each parent
- `GET /api/family/alerts` - Parent polls for new alerts
- `GET /api/family/unread-count` - Parent checks alert count
- `POST /api/family/mark-read/{alert_id}` - Parent marks alert as read
- `POST /api/notifications` - Backend sends notification to parent

### **Database Models:**
- `FamilyAlert` - Stores SOS alert details (parent_id, ward_id, location, timestamp)
- `Notification` - Stores notifications (user_id, type, title, message, is_read)

---

## Next Steps / Optional Enhancements

1. **Firebase Cloud Messaging (FCM)**
   - For push notifications even when browser is closed
   - Requires backend + Android/iOS setup

2. **Sound File Upload**
   - Custom siren sound instead of synthetic oscillator
   - Better audio quality on older devices

3. **Vibration Patterns**
   - Multiple patterns (SOS rhythm, morse code, etc.)
   - User-configurable intensity

4. **Escalation Alerts**
   - SMS to parent if app alert not marked read in 1 minute
   - Call forwarding to backup contacts

5. **Alert History**
   - Store all SOS alerts with parent response times
   - Analytics dashboard

---

## Testing Checklist

- [ ] Parent dashboard shows "Sound alerts are OFF" warning
- [ ] Clicking "Enable Sound Alerts" plays test siren burst
- [ ] Child sends SOS from mobile or web
- [ ] Parent receives loud repeating siren within 15 seconds
- [ ] Mobile vibrates along with siren
- [ ] Browser notification shows (if permission granted)
- [ ] Red "ACTIVE ALARM" banner appears with stop button
- [ ] Dashboard auto-switches to "Alerts" tab
- [ ] Alert card shows ward name, location, timestamp
- [ ] Clicking "STOP ALARM" stops sound + vibration immediately
- [ ] Marking alert as read also stops sound + vibration
- [ ] False SOS can be confirmed/dismissed
- [ ] Multiple children = simultaneous alerts work
- [ ] Sound is loud enough to hear across room
- [ ] Vibration is noticeable on phone

---

## References

- **Browser Vibration API**: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
- **Web Audio API (Siren)**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Capacitor**: https://capacitorjs.com/
- **Android WebView Vibration**: Automatically supported via Capacitor bridge

---

## Support

For issues or questions:
1. Check server logs: `Backend running on http://localhost:8000`
2. Check browser console: `Ctrl+Shift+J` or `F12`
3. Test notification permission in browser settings
4. Ensure child-parent family link is **Accepted** status (not Pending/Rejected)

