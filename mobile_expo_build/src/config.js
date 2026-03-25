// ─── API Configuration ────────────────────────────────────────────────────────
// • Android Emulator  → http://10.0.2.2:8000
// • iOS Simulator     → http://localhost:8000
// • Physical Device   → Update this to your machine's local IP
// • Get your IP: Windows (ipconfig), Mac/Linux (ifconfig)

// Update this IP to match your backend server location
const BACKEND_IP = "172.16.13.132"; // Your local machine IP
const BACKEND_PORT = 8000;

export const API_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;
