import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

const API = axios.create({ baseURL: API_BASE_URL });

// Attach JWT token to every request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => API.post("/api/auth/login", data),
  register: (data) => API.post("/api/auth/register", data),
  me: () => API.get("/api/auth/me"),
};

// ─── Incidents ───────────────────────────────────────────────────────────────
export const incidentAPI = {
  report: (data) => API.post("/api/incidents/", data),
  my: () => API.get("/api/incidents/my"),
  all: () => API.get("/api/incidents/"),
  updateStatus: (id, status, note = "") =>
    API.patch(`/api/incidents/${id}/status`, { status, admin_note: note }),
};

// ─── SOS ─────────────────────────────────────────────────────────────────────
export const sosAPI = {
  trigger: (data) => API.post("/api/sos/", data),
  myAlerts: () => API.get("/api/sos/my-alerts"),
};

// ─── Resources ───────────────────────────────────────────────────────────────
export const helplineAPI = {
  list: () => API.get("/api/helplines/"),
};

export const resourceAPI = {
  list: (type) => API.get(`/api/resources/?resource_type=${type}`),
};

export const safePlaceAPI = {
  list: () => API.get("/api/safe-places/"),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  users: () => API.get("/api/admin/users"),
  toggleUser: (id) => API.patch(`/api/admin/users/${id}/toggle-active`),
  sosAlerts: () => API.get("/api/admin/sos-alerts"),
  resolveSOS: (id) => API.patch(`/api/admin/sos-alerts/${id}/resolve`),
};

export default API;
