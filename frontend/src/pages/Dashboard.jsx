import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { incidentAPI, sosAPI } from "../services/api";
import { FiAlertTriangle, FiFileText, FiPhone, FiBook, FiHeart, FiMap, FiUser, FiShield, FiCheckCircle } from "react-icons/fi";

const actions = [
  { icon: <FiAlertTriangle className="text-red-500 text-2xl" />, title: "SOS Emergency", desc: "Trigger an instant emergency alert", link: "/sos", bg: "bg-red-50 border-red-200 hover:bg-red-100" },
  { icon: <FiFileText className="text-blue-500 text-2xl" />, title: "Report Incident", desc: "Report an incident safely", link: "/report", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { icon: <FiFileText className="text-green-500 text-2xl" />, title: "My Reports", desc: "Track your reported incidents", link: "/my-incidents", bg: "bg-green-50 border-green-200 hover:bg-green-100" },
  { icon: <FiPhone className="text-purple-500 text-2xl" />, title: "Helplines", desc: "Emergency & support numbers", link: "/helplines", bg: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { icon: <FiBook className="text-yellow-600 text-2xl" />, title: "Legal Rights", desc: "Know your legal protections", link: "/legal-resources", bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
  { icon: <FiHeart className="text-pink-500 text-2xl" />, title: "Counseling", desc: "Find support & shelter", link: "/counseling", bg: "bg-pink-50 border-pink-200 hover:bg-pink-100" },
  { icon: <FiMap className="text-teal-500 text-2xl" />, title: "Safe Routes", desc: "Map safe places near you", link: "/safe-routes", bg: "bg-teal-50 border-teal-200 hover:bg-teal-100" },
  { icon: <FiUser className="text-gray-500 text-2xl" />, title: "My Profile", desc: "Manage account & trusted contacts", link: "/profile", bg: "bg-gray-50 border-gray-200 hover:bg-gray-100" },
];

const STATUS_COLOR = {
  pending: "text-yellow-700 bg-yellow-50 border-yellow-200",
  under_review: "text-blue-700 bg-blue-50 border-blue-200",
  resolved: "text-green-700 bg-green-50 border-green-200",
  closed: "text-gray-600 bg-gray-50 border-gray-200",
};

export default function Dashboard() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [incidents, setIncidents] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([incidentAPI.my(), sosAPI.myAlerts()])
      .then(([inc, sos]) => { setIncidents(inc.data); setSosAlerts(sos.data); })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const recentIncidents = incidents.slice(0, 3);
  const activeAlert = sosAlerts.find((s) => s.is_active);
  const totalResolved = incidents.filter((i) => i.status === "resolved").length;
  const totalPending  = incidents.filter((i) => i.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Greeting */}
      <div className="card mb-6 bg-gradient-to-r from-primary-600 to-rose-600 text-white flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-full">
          <FiShield className="text-3xl" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{greeting}, {user?.full_name?.split(" ")[0]}!</h1>
          <p className="text-primary-100 text-sm mt-1">You are safe with SafeGuard. Here are your quick actions.</p>
        </div>
        <div className="hidden sm:flex gap-4 text-center">
          <div>
            <div className="text-2xl font-extrabold">{incidents.length}</div>
            <div className="text-primary-200 text-xs">Reports</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">{totalResolved}</div>
            <div className="text-primary-200 text-xs">Resolved</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">{sosAlerts.length}</div>
            <div className="text-primary-200 text-xs">SOS Alerts</div>
          </div>
        </div>
      </div>

      {/* Active SOS Warning */}
      {activeAlert && (
        <div className="mb-6 bg-red-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg animate-pulse">
          <div className="text-3xl">🚨</div>
          <div className="flex-1">
            <div className="font-bold text-lg">SOS Alert is ACTIVE</div>
            <div className="text-red-100 text-sm">Triggered on {new Date(activeAlert.created_at).toLocaleString()}</div>
          </div>
          <Link to="/sos" className="bg-white text-red-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-50 transition">Manage</Link>
        </div>
      )}

      {/* SOS Banner (when no active alert) */}
      {!activeAlert && (
        <Link to="/sos" className="block mb-6 bg-red-600 hover:bg-red-700 transition text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="bg-white/20 p-3 rounded-full text-3xl">🚨</div>
          <div>
            <div className="font-bold text-xl">Need Help Right Now?</div>
            <div className="text-red-100 text-sm">One tap to trigger SOS & notify your trusted contacts</div>
          </div>
          <div className="ml-auto text-3xl">›</div>
        </Link>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {actions.map((a) => (
          <Link key={a.title} to={a.link} className={`rounded-xl border p-4 transition flex flex-col gap-2 ${a.bg}`}>
            {a.icon}
            <div className="font-semibold text-gray-800 text-sm">{a.title}</div>
            <div className="text-gray-500 text-xs">{a.desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><FiFileText className="text-blue-500" /> Recent Reports</h3>
            <Link to="/my-incidents" className="text-xs text-primary-600 hover:underline">View all →</Link>
          </div>
          {loadingData ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" /></div>
          ) : recentIncidents.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-sm">
              <FiFileText className="text-3xl mx-auto mb-2 text-gray-300" />
              No incidents reported yet.<br />
              <Link to="/report" className="text-primary-600 hover:underline text-xs">Report one now →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className={`rounded-xl border p-3 ${STATUS_COLOR[inc.status] || "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{inc.title}</span>
                    <span className="text-xs capitalize ml-2 flex-shrink-0">{inc.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-70 capitalize">{inc.incident_type.replace(/_/g, " ")} · {new Date(inc.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {incidents.length > 3 && (
                <p className="text-xs text-gray-400 text-center">{incidents.length - 3} more report{incidents.length - 3 > 1 ? "s" : ""} — <Link to="/my-incidents" className="text-primary-600 hover:underline">view all</Link></p>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats + Emergency */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="card">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><FiShield className="text-primary-500" /> My Safety Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-yellow-50 rounded-xl p-3">
                <div className="text-2xl font-extrabold text-yellow-700">{totalPending}</div>
                <div className="text-xs text-yellow-600 mt-1">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-2xl font-extrabold text-blue-700">{incidents.filter(i => i.status === "under_review").length}</div>
                <div className="text-xs text-blue-600 mt-1">Under Review</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-2xl font-extrabold text-green-700">{totalResolved}</div>
                <div className="text-xs text-green-600 mt-1">Resolved</div>
              </div>
            </div>
          </div>

          {/* Emergency Numbers */}
          <div className="card">
            <h3 className="font-bold text-gray-700 mb-3">Emergency Numbers</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[["112", "Emergency"], ["1091", "Women"], ["1098", "Children"], ["181", "DV"], ["100", "Police"], ["108", "Ambulance"], ["1930", "Cyber"], ["15100", "Legal Aid"]].map(([num, label]) => (
                <a key={num} href={`tel:${num}`} className="flex items-center gap-2 bg-gray-50 hover:bg-primary-50 border border-gray-200 rounded-lg px-3 py-2 transition">
                  <span className="font-bold text-primary-700">{num}</span>
                  <span className="text-gray-600 text-xs">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
