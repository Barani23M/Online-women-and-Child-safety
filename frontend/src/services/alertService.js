/**
 * Enhanced Alarm Manager with Vibration Support
 * Plays loud siren + vibrates mobile for SOS alerts
 */
class EnhancedAlarmManager {
  constructor() {
    this.ctx = null;
    this.intervalId = null;
    this.vibrateIntervalId = null;
  }

  _init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  // Unlock audio context from user gesture
  unlock() {
    this._init();
    const buf = this.ctx.createBuffer(1, 1, 22050);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    src.start(0);
  }

  // Enhanced siren burst with louder volume
  _burst() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Siren frequencies: alternating high-low pattern (emergency siren style)
    [
      [960,  t,        0.14],
      [1440, t + 0.17, 0.14],
      [960,  t + 0.34, 0.14],
      [1760, t + 0.51, 0.22],
      [960,  t + 0.80, 0.14],
      [1440, t + 0.97, 0.14],
    ].forEach(([freq, start, dur]) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      // Increased volume for louder siren (0.45 -> 0.7)
      gain.gain.setValueAtTime(0.7, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  // Vibrate pattern for mobile (pulse vibration)
  async _vibrate() {
    try {
      // Use browser's native Vibration API
      // Pattern: 200ms vibrate, 100ms pause
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      console.log("Vibration not available:", err);
    }
  }

  // Start alarm with siren + vibration
  start() {
    if (this.intervalId) return;
    
    this._init();
    this.unlock(); // Ensure audio context is ready
    
    // Initial burst
    this._burst();
    this._vibrate();
    
    // Repeat siren burst every 4 seconds + vibrate
    this.intervalId = setInterval(() => {
      this._burst();
      this._vibrate();
    }, 4000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.vibrateIntervalId) {
      clearInterval(this.vibrateIntervalId);
      this.vibrateIntervalId = null;
    }
  }

  isPlaying() {
    return this.intervalId !== null;
  }
}

export const alertService = new EnhancedAlarmManager();

/**
 * Send native push notification when SOS alert arrives
 * Plays system sound + notification sound on mobile
 */
export const sendSOSNotification = (wardName, location) => {
  try {
    // Browser Notification API
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification("🚨 EMERGENCY SOS ALERT!", {
        body: `${wardName} triggered SOS${location ? ` near ${location}` : ""}`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23ef4444'/><text x='50' y='60' font-size='60' fill='white' text-anchor='middle' dominant-baseline='middle'>!</text></svg>",
        badge: "🚨",
        tag: "sos-alert",
        requireInteraction: true, // Keep on screen until user interacts
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  } catch (err) {
    console.log("Notification API not available:", err);
  }
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (err) {
      console.log("Failed to request notification permission:", err);
      return false;
    }
  }

  return false;
};
