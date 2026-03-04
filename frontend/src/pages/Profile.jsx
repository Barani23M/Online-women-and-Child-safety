import { useEffect, useState } from "react";
import { authAPI, incidentAPI, sosAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiUser, FiPlus, FiTrash2, FiFileText, FiAlertTriangle, FiShield, FiCheckCircle } from "react-icons/fi";

const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

export default function Profile() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relation: "" });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");

  useEffect(() => {
    authAPI.getContacts().then((r) => setContacts(r.data)).catch(() => {});
    incidentAPI.my().then((r) => setIncidents(r.data)).catch(() => {});
    sosAPI.myAlerts().then((r) => setSosAlerts(r.data)).catch(() => {});
  }, []);

  const addContact = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    setLoading(true);
    try {
      const res = await authAPI.addContact(form);
      setContacts((c) => [...c, res.data]);
      setForm({ name: "", phone: "", email: "", relation: "" });
      setAdding(false);
      toast.success("Trusted contact added!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add contact");
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      await authAPI.deleteContact(id);
      setContacts((c) => c.filter((x) => x.id !== id));
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    }
  };

  const tabs = [
    { key: "contacts", label: "Trusted Contacts", count: contacts.length },
    { key: "incidents", label: "My Reports", count: incidents.length },
    { key: "sos", label: "SOS History", count: sosAlerts.length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-5">
          <div className="bg-primary-100 text-primary-600 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{user?.full_name}</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            {user?.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium ${user?.role === "admin" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {user?.role}
            </span>
          </div>
          <div className="hidden sm:flex gap-4 text-center">
            <div>
              <div className="text-2xl font-extrabold text-primary-600">{incidents.length}</div>
              <div className="text-gray-500 text-xs">Reports</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-blue-600">{contacts.length}</div>
              <div className="text-gray-500 text-xs">Contacts</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-red-600">{sosAlerts.length}</div>
              <div className="text-gray-500 text-xs">SOS Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === t.key ? "bg-white shadow text-primary-700" : "text-gray-600 hover:text-gray-800"}`}>
            {t.label} {t.count > 0 && <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Trusted Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Trusted Contacts</h2>
              <p className="text-gray-500 text-sm">Notified when you trigger SOS. Up to 5 contacts.</p>
            </div>
            {contacts.length < 5 && (
              <button onClick={() => setAdding(!adding)} className="btn-outline flex items-center gap-1.5 text-sm py-1.5 px-3">
                <FiPlus /> Add
              </button>
            )}
          </div>

          {adding && (
            <form onSubmit={addContact} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="input-field" placeholder="Phone *" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="input-field" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className="input-field" placeholder="Relation (e.g. Mother)" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn-primary text-sm">{loading ? "Adding…" : "Add Contact"}</button>
                <button type="button" onClick={() => setAdding(false)} className="btn-outline text-sm">Cancel</button>
              </div>
            </form>
          )}

          {contacts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FiUser className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No trusted contacts yet.</p>
              <p className="text-sm mt-1">Add people who should be notified in an emergency.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone} {c.relation ? `• ${c.relation}` : ""}</p>
                    {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                  </div>
                  <button onClick={() => deleteContact(c.id)} className="text-red-400 hover:text-red-600 transition p-2">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === "incidents" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FiFileText className="text-blue-500" /> My Incident Reports</h2>
            <Link to="/report" className="btn-primary text-sm py-1.5 px-3">+ New Report</Link>
          </div>
          {incidents.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FiFileText className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No incidents reported yet.</p>
              <Link to="/report" className="text-primary-600 hover:underline text-sm mt-1 block">Report an incident →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-3 border border-gray-200 rounded-xl hover:border-primary-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[inc.status] || "bg-gray-100 text-gray-600"}`}>
                          {inc.status.replace(/_/g, " ")}
                        </span>
                        {inc.is_anonymous && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Anon</span>}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm truncate">{inc.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{inc.incident_type.replace(/_/g, " ")} · {new Date(inc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mt-2 line-clamp-2">{inc.description}</p>
                  {inc.location && <p className="text-xs text-gray-400 mt-1">📍 {inc.location}</p>}
                  {inc.admin_notes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                      <strong>Admin note:</strong> {inc.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SOS Tab */}
      {activeTab === "sos" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FiAlertTriangle className="text-red-500" /> SOS Alert History</h2>
            <Link to="/sos" className="btn-danger text-sm py-1.5 px-4">🚨 New SOS</Link>
          </div>
          {sosAlerts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FiShield className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No SOS alerts triggered yet.</p>
              <p className="text-sm mt-1">Use the SOS button in an emergency.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sosAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 border rounded-xl ${alert.is_active ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {alert.is_active
                        ? <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse font-bold">ACTIVE</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><FiCheckCircle /> Resolved</span>
                      }
                    </div>
                    <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  {alert.address && <p className="text-xs text-gray-500 mt-1">📍 {alert.address}</p>}
                  {alert.latitude && <p className="text-xs text-gray-400 mt-0.5">GPS: {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}</p>}
                  {alert.resolved_at && <p className="text-xs text-green-600 mt-1">Resolved: {new Date(alert.resolved_at).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
