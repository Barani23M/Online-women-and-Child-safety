import { useEffect, useState } from "react";
import { adminAPI, incidentAPI } from "../services/api";
import toast from "react-hot-toast";
import { FiUsers, FiFileText, FiAlertTriangle, FiCheckCircle, FiShield, FiMapPin, FiTrash2, FiBell, FiActivity, FiHeadphones, FiPlus, FiX, FiEye, FiEyeOff, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_BADGE = { pending: "badge-pending", under_review: "badge-under_review", resolved: "badge-resolved", closed: "badge-closed" };
const COLORS = ["#ec4899","#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#6b7280"];
const ROLES = ["user", "child", "women", "parent", "counselor", "admin"];

export default function AdminDashboard() {
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [counselors, setCounselors]     = useState([]);
  const [tab, setTab]             = useState("overview");
  const [loading, setLoading]     = useState(true);

  // Incident notes modal
  const [notesModal, setNotesModal]   = useState(null);
  const [notesInput, setNotesInput]   = useState("");

  // Send notification modal
  const [notifModal, setNotifModal]   = useState(false);
  const [notifForm, setNotifForm]     = useState({ title: "", message: "", user_id: "" });
  const [notifLoading, setNotifLoading] = useState(false);

  // Add counselor form
  const [showAddCounselor, setShowAddCounselor] = useState(false);
  const [counselorForm, setCounselorForm]       = useState({ full_name: "", email: "", phone: "", password: "" });
  const [counselorPwShow, setCounselorPwShow]   = useState(false);
  const [counselorLoading, setCounselorLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.users(), incidentAPI.all({}), adminAPI.sosAlerts(), adminAPI.listCounselors()])
      .then(([s, u, inc, sos, c]) => {
        setStats(s.data);
        setUsers(u.data);
        setIncidents(inc.data);
        setSosAlerts(sos.data);
        setCounselors(c.data);
      })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
  }, []);

  const loadActivityLogs = () => {
    if (activityLogs.length > 0) return;
    adminAPI.activityLogs().then((r) => setActivityLogs(r.data)).catch(() => toast.error("Failed to load logs"));
  };

  // -- Users ------------------------------------------------------------
  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id);
      setUsers((u) => u.map((user) => user.id === id ? { ...user, is_active: res.data.is_active } : user));
      toast.success(res.data.message);
    } catch { toast.error("Failed to update user"); }
  };

  const updateRole = async (id, role) => {
    try {
      await adminAPI.updateRole(id, role);
      setUsers((u) => u.map((user) => user.id === id ? { ...user, role } : user));
      toast.success(`Role updated to ${role}`);
    } catch { toast.error("Failed to update role"); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This is permanent.`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers((u) => u.filter((user) => user.id !== id));
      toast.success("User deleted");
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to delete user"); }
  };

  // -- Incidents ---------------------------------------------------------
  const openNotesModal = (inc) => {
    setNotesModal({ id: inc.id, status: inc.status });
    setNotesInput(inc.admin_notes || "");
  };

  const saveIncidentUpdate = async () => {
    try {
      await incidentAPI.update(notesModal.id, { status: notesModal.status, admin_notes: notesInput });
      setIncidents((inc) => inc.map((i) => i.id === notesModal.id ? { ...i, status: notesModal.status, admin_notes: notesInput } : i));
      toast.success("Incident updated");
      setNotesModal(null);
    } catch { toast.error("Failed to update"); }
  };

  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident permanently?")) return;
    try {
      await adminAPI.deleteIncident(id);
      setIncidents((inc) => inc.filter((i) => i.id !== id));
      toast.success("Incident deleted");
    } catch { toast.error("Failed to delete"); }
  };

  // -- SOS ---------------------------------------------------------------
  const resolveSOS = async (id) => {
    try {
      await adminAPI.resolveSOS(id);
      setSosAlerts((s) => s.map((a) => a.id === id ? { ...a, is_active: false } : a));
      toast.success("SOS marked as resolved");
    } catch { toast.error("Failed to resolve SOS"); }
  };

  const deleteSOS = async (id) => {
    if (!window.confirm("Delete this SOS alert?")) return;
    try {
      await adminAPI.deleteSOS(id);
      setSosAlerts((s) => s.filter((a) => a.id !== id));
      toast.success("SOS deleted");
    } catch { toast.error("Failed to delete"); }
  };

  // -- Notifications -----------------------------------------------------
  const sendNotification = async (e) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return toast.error("Title and message required");
    setNotifLoading(true);
    try {
      await adminAPI.sendNotification({
        title:   notifForm.title,
        message: notifForm.message,
        user_id: notifForm.user_id ? Number(notifForm.user_id) : null,
      });
      toast.success(notifForm.user_id ? "Notification sent to user" : "Broadcast sent to all users");
      setNotifModal(false);
      setNotifForm({ title: "", message: "", user_id: "" });
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to send"); }
    finally { setNotifLoading(false); }
  };

  if (loading)
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>;

  // ── Counselor handlers ──────────────────────────────────────────────────
  const addCounselor = async (e) => {
    e.preventDefault();
    if (!counselorForm.full_name || !counselorForm.email || !counselorForm.password)
      return toast.error("Name, email and password are required");
    if (counselorForm.password.length < 6) return toast.error("Password must be at least 6 characters");
    setCounselorLoading(true);
    try {
      const res = await adminAPI.createCounselor(counselorForm);
      setCounselors(prev => [res.data, ...prev]);
      setCounselorForm({ full_name: "", email: "", phone: "", password: "" });
      setShowAddCounselor(false);
      toast.success(`Counselor "${res.data.full_name}" created!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create counselor");
    } finally { setCounselorLoading(false); }
  };

  const deleteCounselor = async (id, name) => {
    if (!window.confirm(`Remove counselor "${name}"? This is permanent.`)) return;
    try {
      await adminAPI.deleteCounselor(id);
      setCounselors(prev => prev.filter(c => c.id !== id));
      toast.success("Counselor removed");
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to remove"); }
  };

  const toggleCounselor = async (id) => {
    try {
      const res = await adminAPI.toggleCounselor(id);
      setCounselors(prev => prev.map(c => c.id === id ? { ...c, is_active: res.data.is_active } : c));
      toast.success(res.data.message);
    } catch { toast.error("Failed to toggle"); }
  };

  const chartData = stats ? Object.entries(stats.incidents_by_type || {}).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })) : [];
  const activeSOS = sosAlerts.filter((a) => a.is_active);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FiShield className="text-primary-600 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">SafeGuard platform management</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => setNotifModal(true)}
            className="btn-outline text-sm flex items-center gap-1.5">
            <FiBell size={14} /> Send Notification
          </button>
          {activeSOS.length > 0 && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
              ?? {activeSOS.length} Active SOS
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 border-b border-gray-200 overflow-x-auto">
        {[
          { key: "overview",   label: "Overview" },
          { key: "incidents",  label: "Incidents" },
          { key: "sos",        label: `SOS${activeSOS.length > 0 ? ` (${activeSOS.length})` : ""}` },
          { key: "users",      label: "Users" },
          { key: "counselors", label: `Counselors (${counselors.length})` },
          { key: "logs",       label: "Activity Logs" },
        ].map((t) => (
          <button key={t.key}
            onClick={() => { setTab(t.key); if (t.key === "logs") loadActivityLogs(); }}
            className={`pb-2 px-1 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab === t.key ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {[
              { label: "Total Users",     value: stats.total_users,     icon: <FiUsers />,        color: "text-blue-600",   bg: "bg-blue-50" },
              { label: "Total Incidents", value: stats.total_incidents, icon: <FiFileText />,     color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Active SOS",      value: stats.active_sos,      icon: <FiAlertTriangle />,color: "text-red-600",    bg: "bg-red-50" },
              { label: "Resolved",        value: stats.resolved_incidents, icon: <FiCheckCircle />, color: "text-green-600", bg: "bg-green-50" },
            ].map((s) => (
              <div key={s.label} className={`card text-center border-0 ${s.bg}`}>
                <div className={`text-3xl ${s.color} mb-1 flex justify-center`}>{s.icon}</div>
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-gray-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-bold text-gray-700 mb-4">Incidents by Type</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="font-bold text-gray-700 mb-4">Incident Status Breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: "Pending",  value: stats.pending_incidents,  color: "bg-yellow-500" },
                  { label: "Resolved", value: stats.resolved_incidents, color: "bg-green-500" },
                  { label: "Others",   value: stats.total_incidents - stats.pending_incidents - stats.resolved_incidents, color: "bg-gray-400" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: stats.total_incidents > 0 ? `${(s.value / stats.total_incidents) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incidents */}
      {tab === "incidents" && (
        <div className="space-y-4">
          {incidents.length === 0 && <p className="text-gray-400 text-center py-10">No incidents yet.</p>}
          {incidents.map((inc) => (
            <div key={inc.id} className="card border-l-4 border-l-primary-400">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className={STATUS_BADGE[inc.status] || "badge-closed"}>{inc.status.replace(/_/g, " ")}</span>
                  <h3 className="font-bold text-gray-800 mt-1">{inc.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{inc.incident_type.replace(/_/g," ")} � {new Date(inc.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{inc.description}</p>
                  {inc.location && <p className="text-xs text-gray-400 mt-1">?? {inc.location}</p>}
                  {inc.admin_notes && (
                    <div className="mt-2 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                      <strong>Note:</strong> {inc.admin_notes}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => openNotesModal(inc)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium transition whitespace-nowrap">
                    ? Update
                  </button>
                  <button onClick={() => deleteIncident(inc.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition">
                    ?? Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SOS Alerts */}
      {tab === "sos" && (
        <div className="space-y-4">
          {sosAlerts.length === 0 && <p className="text-gray-400 text-center py-10">No SOS alerts yet.</p>}
          {sosAlerts.map((alert) => (
            <div key={alert.id} className={`card border-l-4 ${alert.is_active ? "border-l-red-500 bg-red-50" : "border-l-green-400"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {alert.is_active
                      ? <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">ACTIVE</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><FiCheckCircle size={10} /> Resolved</span>
                    }
                    <span className="text-xs text-gray-400">Alert #{alert.id} � User #{alert.user_id}</span>
                  </div>
                  <p className="text-gray-800 font-medium">{alert.message}</p>
                  {(alert.latitude || alert.address) && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <FiMapPin className="flex-shrink-0" />
                      {alert.address || `${alert.latitude?.toFixed(5)}, ${alert.longitude?.toFixed(5)}`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                    {alert.resolved_at && ` � Resolved: ${new Date(alert.resolved_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {alert.is_active && (
                    <button onClick={() => resolveSOS(alert.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-medium">
                      ? Resolve
                    </button>
                  )}
                  <button onClick={() => deleteSOS(alert.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium">
                    ?? Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Counselors */}
      {tab === "counselors" && (
        <div className="space-y-5">
          {/* Add counselor toggle */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><FiHeadphones className="text-purple-600"/> Counselors</h2>
            <button onClick={() => setShowAddCounselor(v => !v)}
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              {showAddCounselor ? <FiX size={14}/> : <FiPlus size={14}/>}
              {showAddCounselor ? "Cancel" : "Add Counselor"}
            </button>
          </div>

          {/* Add counselor form */}
          {showAddCounselor && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-5">
              <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2"><FiHeadphones size={15}/> Create New Counselor Account</h3>
              <form onSubmit={addCounselor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <input className="input-field" placeholder="Dr. Priya Sharma" required
                    value={counselorForm.full_name}
                    onChange={e => setCounselorForm({...counselorForm, full_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input className="input-field" type="email" placeholder="counselor@safeguard.in" required
                    value={counselorForm.email}
                    onChange={e => setCounselorForm({...counselorForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input className="input-field" placeholder="+91 98765 43210"
                    value={counselorForm.phone}
                    onChange={e => setCounselorForm({...counselorForm, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                  <div className="relative">
                    <input className="input-field pr-10" type={counselorPwShow ? "text" : "password"} placeholder="Min. 6 characters" required
                      value={counselorForm.password}
                      onChange={e => setCounselorForm({...counselorForm, password: e.target.value})} />
                    <button type="button" onClick={() => setCounselorPwShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {counselorPwShow ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" disabled={counselorLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
                    <FiPlus size={14}/> {counselorLoading ? "Creating…" : "Create Counselor"}
                  </button>
                  <button type="button" onClick={() => setShowAddCounselor(false)}
                    className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
              <p className="text-xs text-purple-600 mt-3 font-medium">⚠ Counselor accounts can only be created here. They cannot self-register.</p>
            </div>
          )}

          {/* Counselor list */}
          {counselors.length === 0 ? (
            <div className="card text-center py-14">
              <FiHeadphones size={36} className="text-gray-300 mx-auto mb-3"/>
              <p className="text-gray-500 font-semibold">No counselors added yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Add Counselor" to create the first personal counselor account</p>
            </div>
          ) : (
            <div className="space-y-3">
              {counselors.map(c => (
                <div key={c.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm ${
                  c.is_active ? "border-gray-100" : "border-red-100 bg-red-50/30"
                }`}>
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 ${
                    c.active_now ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-purple-400 to-indigo-600"
                  }`}>
                    {(c.full_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm">{c.full_name}</p>
                      {c.active_now && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> LIVE</span>}
                      {!c.is_active && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{c.email}</p>
                    {c.phone && <p className="text-gray-400 text-xs">{c.phone}</p>}
                    <p className="text-purple-600 text-xs font-semibold mt-0.5">{c.total_sessions} sessions · Joined {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => toggleCounselor(c.id)}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition ${c.is_active ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                      {c.is_active ? <FiToggleRight size={13}/> : <FiToggleLeft size={13}/>}
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => deleteCounselor(c.id, c.full_name)}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition">
                      <FiTrash2 size={12}/> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{u.full_name}</td>
                  <td className="py-3 text-gray-600 text-xs">{u.email}</td>
                  <td className="py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleUser(u.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition font-medium ${u.is_active ? "bg-red-50 hover:bg-red-100 text-red-600" : "bg-green-50 hover:bg-green-100 text-green-600"}`}>
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => deleteUser(u.id, u.full_name)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 transition">
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Logs */}
      {tab === "logs" && (
        <div className="space-y-3">
          {activityLogs.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              <FiActivity className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No activity logs yet.</p>
            </div>
          )}
          {activityLogs.map((log) => (
            <div key={log.id} className="card border border-gray-100 py-3 px-4 flex items-start gap-3">
              <div className="text-lg mt-0.5">
                {log.action.includes("delete") ? "??" : log.action.includes("create") ? "?" : log.action.includes("update") ? "?" : "??"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{log.action.replace(/_/g, " ")}</p>
                {log.details && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.details}</p>}
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                Admin #{log.admin_id}<br />
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident Update Modal */}
      {notesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Update Incident</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field"
                value={notesModal.status}
                onChange={(e) => setNotesModal({ ...notesModal, status: e.target.value })}>
                {["pending","under_review","resolved","closed"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (optional)</label>
              <textarea className="input-field min-h-[80px] resize-none" placeholder="Add notes for the reporter..."
                value={notesInput} onChange={(e) => setNotesInput(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={saveIncidentUpdate} className="btn-primary flex-1">Save Changes</button>
              <button onClick={() => setNotesModal(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {notifModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-1">Send Notification</h3>
            <p className="text-gray-500 text-sm mb-4">Leave User ID blank to broadcast to all users.</p>
            <form onSubmit={sendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="input-field" required placeholder="Notification title"
                  value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea className="input-field min-h-[80px] resize-none" required placeholder="Notification body"
                  value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID (optional � blank = broadcast)</label>
                <input className="input-field" type="number" placeholder="e.g. 3"
                  value={notifForm.user_id} onChange={(e) => setNotifForm({ ...notifForm, user_id: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={notifLoading} className="btn-primary flex-1">
                  {notifLoading ? "Sending�" : "Send"}
                </button>
                <button type="button" onClick={() => setNotifModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
