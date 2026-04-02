import axios from "axios";

const PRODUCTION_API_URL = "https://online-women-and-child-safety-p6ju.onrender.com";
const DEFAULT_WEB_API_URL = process.env.REACT_APP_API_BASE_URL || PRODUCTION_API_URL;
const DEFAULT_ANDROID_API_URL = process.env.REACT_APP_ANDROID_API_BASE_URL || PRODUCTION_API_URL;
const DEFAULT_ANDROID_API_CANDIDATES = [
  PRODUCTION_API_URL,
  "http://192.168.139.220:8000",
  "http://192.168.31.127:8000",
  "http://10.52.179.58:8000",
  "http://172.16.15.12:8000",
];

const normalizeHttpUrl = (url) => {
  const value = (url || "").trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
};

const normalizeWsUrl = (url) => {
  const value = (url || "").trim();
  if (!value) return null;
  const withScheme = /^wss?:\/\//i.test(value)
    ? value
    : /^https?:\/\//i.test(value)
      ? value.replace(/^http/i, "ws")
      : `wss://${value}`;
  return withScheme.replace(/\/+$/, "");
};

const uniqueUrls = (items) => {
  const out = [];
  const seen = new Set();
  items.forEach((item) => {
    const url = normalizeHttpUrl(item);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  });
  return out;
};

const getAndroidApiCandidates = () => {
  const envCandidates = (process.env.REACT_APP_ANDROID_API_BASE_URLS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return uniqueUrls([
    ...envCandidates,
    process.env.REACT_APP_ANDROID_API_BASE_URL,
    ...DEFAULT_ANDROID_API_CANDIDATES,
  ]);
};

const isNativeAndroidApp = () =>
  typeof window !== "undefined" &&
  (
    !!window.Capacitor?.isNativePlatform?.() ||
    (
      typeof navigator !== "undefined" &&
      /android/i.test(navigator.userAgent || "") &&
      typeof window.location !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    )
  );

export function resolveApiBaseUrl() {
  if (process.env.REACT_APP_API_BASE_URL) {
    return normalizeHttpUrl(process.env.REACT_APP_API_BASE_URL);
  }

  return isNativeAndroidApp() ? getAndroidApiCandidates()[0] : DEFAULT_WEB_API_URL;
}

const IS_NATIVE_ANDROID = isNativeAndroidApp();
const ANDROID_API_CANDIDATES = IS_NATIVE_ANDROID ? getAndroidApiCandidates() : [];
const API_BASE_URL = resolveApiBaseUrl();
const API = axios.create({ baseURL: API_BASE_URL, timeout: 6000 });
let androidCandidateIndex = Math.max(0, ANDROID_API_CANDIDATES.indexOf(API_BASE_URL));
let androidBaseSelectionPromise = null;

const canUseAbortController = () => typeof AbortController !== "undefined";

const healthCheckWithTimeout = async (baseUrl, timeoutMs = 2500) => {
  const target = `${baseUrl}/health`;

  if (!canUseAbortController()) {
    const response = await fetch(target, { method: "GET" });
    return response.ok;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target, { method: "GET", signal: controller.signal });
    return response.ok;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const selectReachableAndroidBaseUrl = async () => {
  if (!IS_NATIVE_ANDROID || ANDROID_API_CANDIDATES.length === 0) return API_BASE_URL;

  if (!androidBaseSelectionPromise) {
    androidBaseSelectionPromise = (async () => {
      for (let i = 0; i < ANDROID_API_CANDIDATES.length; i += 1) {
        const candidate = ANDROID_API_CANDIDATES[i];
        const ok = await healthCheckWithTimeout(candidate);
        if (ok) {
          androidCandidateIndex = i;
          API.defaults.baseURL = candidate;
          return candidate;
        }
      }

      return API.defaults.baseURL || API_BASE_URL;
    })().finally(() => {
      androidBaseSelectionPromise = null;
    });
  }

  return androidBaseSelectionPromise;
};

export function resolveWsBaseUrl() {
  if (process.env.REACT_APP_WS_BASE_URL) {
    return normalizeWsUrl(process.env.REACT_APP_WS_BASE_URL);
  }
  if (IS_NATIVE_ANDROID) {
    const apiUrl = ANDROID_API_CANDIDATES[androidCandidateIndex] || DEFAULT_ANDROID_API_URL;
    return apiUrl.replace(/^http/i, "ws");
  }
  return "wss://online-women-and-child-safety-p6ju.onrender.com";
}

API.interceptors.request.use(async (config) => {
  if (IS_NATIVE_ANDROID) {
    const resolvedBase = await selectReachableAndroidBaseUrl();
    config.baseURL = resolvedBase;
  }

  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const canSwitchHost =
      IS_NATIVE_ANDROID &&
      !!config &&
      ANDROID_API_CANDIDATES.length > 1 &&
      !error?.response;

    if (!canSwitchHost) {
      return Promise.reject(error);
    }

    config.__hostRetryCount = config.__hostRetryCount || 0;
    if (config.__hostRetryCount >= ANDROID_API_CANDIDATES.length - 1) {
      return Promise.reject(error);
    }

    config.__hostRetryCount += 1;
    androidCandidateIndex = (androidCandidateIndex + 1) % ANDROID_API_CANDIDATES.length;
    const nextBaseUrl = ANDROID_API_CANDIDATES[androidCandidateIndex];

    API.defaults.baseURL = nextBaseUrl;
    config.baseURL = nextBaseUrl;

    return API.request(config);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post("/api/auth/register", data),
  login: (data) => API.post("/api/auth/login", data),
  me: () => API.get("/api/auth/me"),
  updateProfile: (data) => API.put("/api/auth/me", data),
  changePassword: (data) => API.post("/api/auth/change-password", data),
  deleteAccount: () => API.delete("/api/auth/me"),
  getContacts: () => API.get("/api/auth/trusted-contacts"),
  addContact: (data) => API.post("/api/auth/trusted-contacts", data),
  updateContact: (id, data) => API.put(`/api/auth/trusted-contacts/${id}`, data),
  deleteContact: (id) => API.delete(`/api/auth/trusted-contacts/${id}`),
  searchUser: (email) => API.get("/api/auth/search", { params: { email } }),  // ← NEW: Search for user by email
};

// SOS
export const sosAPI = {
  trigger: (data) => API.post("/api/sos/trigger", data),
  resolve: (id) => API.post(`/api/sos/resolve/${id}`),
  resolveActive: () => API.post("/api/sos/resolve-active"),
  myAlerts: () => API.get("/api/sos/my-alerts"),
  active: () => API.get("/api/sos/active"),
  checkParents: () => API.get("/api/sos/check-parents"),  // ← NEW: Check if user has linked parents
};

// Incidents
export const incidentAPI = {
  report: (data) => API.post("/api/incidents/report", data),
  my: (params) => API.get("/api/incidents/my", { params: params || {} }),
  types: () => API.get("/api/incidents/types"),
  uploadEvidence: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post("/api/incidents/upload-evidence", formData);
  },
  all: (params) => API.get("/api/incidents/", { params }),
  get: (id) => API.get(`/api/incidents/${id}`),
  update: (id, data) => API.patch(`/api/incidents/${id}`, data),
  deleteMyIncident: (id) => API.delete(`/api/incidents/my/${id}`),
  adminDelete: (id) => API.delete(`/api/incidents/${id}`),
};

// Helplines
export const helplineAPI = {
  get: (category) => API.get("/api/helplines/", { params: category ? { category } : {} }),
};

// Legal resources
export const legalAPI = {
  get: (params) => API.get("/api/resources/legal", { params: params || {} }),
  getOne: (id) => API.get(`/api/resources/legal/${id}`),
  categories: () => API.get("/api/resources/legal/categories"),
  myBookmarks: () => API.get("/api/resources/legal/bookmarks"),
  addBookmark: (id) => API.post(`/api/resources/legal/${id}/bookmark`),
  removeBookmark: (id) => API.delete(`/api/resources/legal/${id}/bookmark`),
};

// Counseling resources
export const counselingAPI = {
  get: (category) => API.get("/api/counseling/", { params: category ? { category } : {} }),
  getOne: (id) => API.get(`/api/counseling/${id}`),
};

// Child safety resources
export const childSafetyAPI = {
  get: (category) => API.get("/api/child-safety/", { params: category ? { category } : {} }),
  getOne: (id) => API.get(`/api/child-safety/${id}`),
};

// Safe places
export const safePlacesAPI = {
  get: (params) => API.get("/api/safe-places/", { params: params || {} }),
  nearby: (lat, lon, radius_km = 10) => API.get("/api/safe-places/nearby", { params: { lat, lon, radius_km } }),
  getOne: (id) => API.get(`/api/safe-places/${id}`),
};

// Notifications
export const notificationsAPI = {
  get: () => API.get("/api/notifications/"),
  unreadCount: () => API.get("/api/notifications/unread-count"),
  markRead: (id) => API.patch(`/api/notifications/${id}/read`),
  markAllRead: () => API.patch("/api/notifications/read-all"),
  delete: (id) => API.delete(`/api/notifications/${id}`),
};

// Counseling sessions (audio/video signaling)
export const sessionsAPI = {
  listCounselors: () => API.get("/api/sessions/counselors"),
  counselorDashboard: () => API.get("/api/sessions/counselor/dashboard"),
  counselorSessions: () => API.get("/api/sessions/counselor/sessions"),
  create: (payload) => {
    const params = typeof payload === "string"
      ? { call_type: payload }
      : (payload || {});
    return API.post("/api/sessions/", null, { params });
  },
  waiting: () => API.get("/api/sessions/waiting"),
  my: () => API.get("/api/sessions/my"),
  myAppointments: () => API.get("/api/sessions/appointments/my"),
  cancel: (room_id) => API.patch(`/api/sessions/${room_id}/cancel`),
  end: (room_id) => API.post(`/api/sessions/${room_id}/end`),
};

// Family / guardian
export const familyAPI = {
  requestLink: (parent_email) => API.post("/api/family/request-link", { parent_email }),
  pendingRequests: () => API.get("/api/family/pending-requests"),
  accept: (link_id) => API.post(`/api/family/accept/${link_id}`),
  reject: (link_id) => API.post(`/api/family/reject/${link_id}`),
  unlink: (link_id) => API.delete(`/api/family/unlink/${link_id}`),
  myParents: () => API.get("/api/family/my-parents"),
  myChildren: () => API.get("/api/family/my-children"),
  allMyLinks: () => API.get("/api/family/all-my-links"),
  sendAlert: (data) => API.post("/api/family/alert", data),
  getAlerts: (unread_only) => API.get("/api/family/alerts", { params: unread_only ? { unread_only: true } : {} }),
  unreadCount: () => API.get("/api/family/alerts/unread-count"),
  markRead: (id) => API.post(`/api/family/alerts/${id}/read`),
  markAllRead: () => API.post("/api/family/alerts/mark-all-read"),
  deleteAlert: (id) => API.delete(`/api/family/alerts/${id}`),
  wardIncidents: () => API.get("/api/family/ward-incidents"),
};

// Admin
export const adminAPI = {
  stats: () => API.get("/api/admin/stats"),
  users: (params) => API.get("/api/admin/users", { params: params || {} }),
  getUser: (id) => API.get(`/api/admin/users/${id}`),
  toggleUser: (id) => API.patch(`/api/admin/users/${id}/toggle-active`),
  updateRole: (id, role) => API.patch(`/api/admin/users/${id}/role`, null, { params: { role } }),
  deleteUser: (id) => API.delete(`/api/admin/users/${id}`),
  sosAlerts: (params) => API.get("/api/admin/sos-alerts", { params: params || {} }),
  resolveSOS: (id) => API.patch(`/api/admin/sos-alerts/${id}/resolve`),
  deleteSOS: (id) => API.delete(`/api/admin/sos-alerts/${id}`),
  getIncidents: (params) => API.get("/api/admin/incidents", { params: params || {} }),
  deleteIncident: (id) => API.delete(`/api/incidents/${id}`),
  activityLogs: (params) => API.get("/api/admin/activity-logs", { params: params || {} }),
  sendNotification: (data) => API.post("/api/admin/notifications/send", data),
  createCounselor: (data) => API.post("/api/admin/counselors", data),
  listCounselors: () => API.get("/api/admin/counselors"),
  deleteCounselor: (id) => API.delete(`/api/admin/counselors/${id}`),
  toggleCounselor: (id) => API.patch(`/api/admin/counselors/${id}/toggle-active`),
};

export default API;

