import { useEffect, useState } from "react";
import { incidentAPI } from "../services/api";
import toast from "react-hot-toast";
import { FiFileText } from "react-icons/fi";

const STATUS_BADGE = { pending: "badge-pending", under_review: "badge-under_review", resolved: "badge-resolved", closed: "badge-closed" };

export default function MyIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    incidentAPI.my()
      .then((r) => setIncidents(r.data))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <FiFileText className="text-blue-500 text-3xl" />
        <h1 className="text-2xl font-bold text-gray-800">My Incident Reports</h1>
      </div>

      {incidents.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">
          <FiFileText className="text-5xl mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No reports yet.</p>
          <p className="text-sm mt-1">If something happened, don't hesitate — <a href="/report" className="text-primary-600 underline">report it now</a>.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div key={inc.id} className="card border-l-4 border-l-primary-400">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={STATUS_BADGE[inc.status] || "badge-closed"}>{inc.status.replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-400">{new Date(inc.created_at).toLocaleDateString()}</span>
                    {inc.is_anonymous && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Anonymous</span>}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{inc.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 capitalize">{inc.incident_type.replace(/_/g, " ")}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">{inc.description.length > 200 ? inc.description.slice(0, 200) + "…" : inc.description}</p>
              {inc.location && <p className="text-xs text-gray-400 mt-2">📍 {inc.location}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
