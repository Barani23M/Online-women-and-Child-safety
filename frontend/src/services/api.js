import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
const API = axios.create({ baseURL: API_BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  get: (category) => API.get("/api/resources/legal", { params: category ? { category } : {} }),
  getOne: (id) => API.get(`/api/resources/legal/${id}`),
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
  create: (call_type) => API.post("/api/sessions/", null, { params: { call_type } }),
  waiting: () => API.get("/api/sessions/waiting"),
  my: () => API.get("/api/sessions/my"),
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
};

export default API;

