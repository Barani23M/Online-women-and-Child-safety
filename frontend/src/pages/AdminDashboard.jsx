import { useEffect, useState } from "react";
import { adminAPI, incidentAPI } from "../services/api";
import toast from "react-hot-toast";
import { FiUsers, FiFileText, FiAlertTriangle, FiCheckCircle, FiShield, FiMapPin } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_BADGE = { pending: "badge-pending", under_review: "badge-under_review", resolved: "badge-resolved", closed: "badge-closed" };
const COLORS = ["#ec4899","#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#6b7280"];

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [tab, setTab]           = useState("overview");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.users(), incidentAPI.all({}), adminAPI.sosAlerts()])
      .then(([s, u, inc, sos]) => {
        setStats(s.data);
        setUsers(u.data);
        setIncidents(inc.data);
        setSosAlerts(sos.data);
      })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id);
      setUsers((u) => u.map((user) => user.id === id ? { ...user, is_active: res.data.is_active } : user));
      toast.success(res.data.message);
    } catch { toast.error("Failed to update user"); }
  };

  const updateIncidentStatus = async (id, status) => {
    try {
      await incidentAPI.update(id, { status });
      setIncidents((inc) => inc.map((i) => i.id === id ? { ...i, status } : i));
      toast.success("Status updated");
    } catch { toast.error("Failed to update"); }
  };

  const resolveSOS = async (id) => {
    try {
      await adminAPI.resolveSOS(id);
      setSosAlerts((s) => s.map((a) => a.id === id ? { ...a, is_active: false } : a));
      toast.success("SOS marked as resolved");
    } catch { toast.error("Failed to resolve SOS"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>;

  const chartData = stats ? Object.entries(stats.incidents_by_type).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })) : [];
  const activeSOS = sosAlerts.filter((a) => a.is_active);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <FiShield className="text-primary-600 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">SafeGuard platform management</p>
        </div>
        {activeSOS.length > 0 && (
          <div className="ml-auto bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
            🚨 {activeSOS.length} Active SOS Alert{activeSOS.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 border-b border-gray-200">
        {["overview","incidents","sos","users"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium capitalize border-b-2 transition ${tab === t ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "sos" ? `SOS Alerts${activeSOS.length > 0 ? ` (${activeSOS.length})` : ""}` : t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {[
              { label: "Total Users", value: stats.total_users, icon: <FiUsers />, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Incidents", value: stats.total_incidents, icon: <FiFileText />, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Active SOS", value: stats.active_sos, icon: <FiAlertTriangle />, color: "text-red-600", bg: "bg-red-50" },
              { label: "Resolved", value: stats.resolved_incidents, icon: <FiCheckCircle />, color: "text-green-600", bg: "bg-green-50" },
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
                  { label: "Pending", value: stats.pending_incidents, color: "bg-yellow-500", total: stats.total_incidents },
                  { label: "Resolved", value: stats.resolved_incidents, color: "bg-green-500", total: stats.total_incidents },
                  { label: "Others", value: stats.total_incidents - stats.pending_incidents - stats.resolved_incidents, color: "bg-gray-400", total: stats.total_incidents },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: s.total > 0 ? `${(s.value / s.total) * 100}%` : "0%" }} />
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
                  <p className="text-sm text-gray-500 capitalize">{inc.incident_type.replace(/_/g," ")} — {new Date(inc.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{inc.description}</p>
                  {inc.location && <p className="text-xs text-gray-400 mt-1">📍 {inc.location}</p>}
                </div>
                <select
                  className="input-field w-40 text-sm flex-shrink-0"
                  value={inc.status}
                  onChange={(e) => updateIncidentStatus(inc.id, e.target.value)}
                >
                  {["pending","under_review","resolved","closed"].map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
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
                    <span className="text-xs text-gray-400">Alert #{alert.id}</span>
                    <span className="text-xs text-gray-400">· User #{alert.user_id}</span>
                  </div>
                  <p className="text-gray-800 font-medium">{alert.message}</p>
                  {(alert.latitude || alert.address) && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <FiMapPin className="flex-shrink-0" />
                      {alert.address || `${alert.latitude?.toFixed(5)}, ${alert.longitude?.toFixed(5)}`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Triggered: {new Date(alert.created_at).toLocaleString()}
                    {alert.resolved_at && ` · Resolved: ${new Date(alert.resolved_at).toLocaleString()}`}
                  </p>
                </div>
                {alert.is_active && (
                  <button onClick={() => resolveSOS(alert.id)}
                    className="flex-shrink-0 bg-green-100 hover:bg-green-200 text-green-700 font-medium text-sm px-4 py-2 rounded-lg transition">
                    ✓ Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
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
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "counselor" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => toggleUser(u.id)}
                      className={`text-xs px-3 py-1 rounded-lg transition font-medium ${u.is_active ? "bg-red-50 hover:bg-red-100 text-red-600" : "bg-green-50 hover:bg-green-100 text-green-600"}`}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
