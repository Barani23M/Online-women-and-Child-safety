import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => API.post("/api/auth/register", data),
  login:    (data) => API.post("/api/auth/login", data),
  me:       ()     => API.get("/api/auth/me"),
  getContacts:    ()       => API.get("/api/auth/trusted-contacts"),
  addContact:     (data)   => API.post("/api/auth/trusted-contacts", data),
  deleteContact:  (id)     => API.delete(`/api/auth/trusted-contacts/${id}`),
};

export const sosAPI = {
  trigger:  (data)  => API.post("/api/sos/trigger", data),
  resolve:  (id)    => API.post(`/api/sos/resolve/${id}`),
  myAlerts: ()      => API.get("/api/sos/my-alerts"),
  active:   ()      => API.get("/api/sos/active"),
};

export const incidentAPI = {
  report:    (data) => API.post("/api/incidents/report", data),
  my:        ()     => API.get("/api/incidents/my"),
  all:       (params) => API.get("/api/incidents/", { params }),
  get:       (id)   => API.get(`/api/incidents/${id}`),
  update:    (id, data) => API.patch(`/api/incidents/${id}`, data),
};

export const helplineAPI = {
  get: (category) => API.get("/api/helplines/", { params: category ? { category } : {} }),
};

export const legalAPI = {
  get:    (category) => API.get("/api/resources/legal", { params: category ? { category } : {} }),
  getOne: (id)       => API.get(`/api/resources/legal/${id}`),
};

export const counselingAPI = {
  get: (category) => API.get("/api/counseling/", { params: category ? { category } : {} }),
};

export const safePlacesAPI = {
  get: (type) => API.get("/api/safe-places/", { params: type ? { place_type: type } : {} }),
};

export const adminAPI = {
  stats:        ()              => API.get("/api/admin/stats"),
  users:        ()              => API.get("/api/admin/users"),
  toggleUser:   (id)            => API.patch(`/api/admin/users/${id}/toggle-active`),
  updateRole:   (id, role)      => API.patch(`/api/admin/users/${id}/role`, null, { params: { role } }),
  sosAlerts:    ()              => API.get("/api/admin/sos-alerts"),
  resolveSOS:   (id)            => API.patch(`/api/admin/sos-alerts/${id}/resolve`),
};

export default API;
