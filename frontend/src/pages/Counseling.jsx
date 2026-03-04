import { useEffect, useState } from "react";
import { counselingAPI } from "../services/api";
import toast from "react-hot-toast";
import { FiHeart, FiPhone, FiGlobe, FiMapPin } from "react-icons/fi";

const CAT_COLORS = { mental_health: "bg-pink-100 text-pink-700", trauma: "bg-rose-100 text-rose-700", legal_aid: "bg-yellow-100 text-yellow-700", shelter: "bg-teal-100 text-teal-700" };
const CAT_LABELS = { mental_health: "Mental Health", trauma: "Trauma Support", legal_aid: "Legal Aid", shelter: "Shelter" };

export default function Counseling() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    counselingAPI.get()
      .then((r) => setResources(r.data))
      .catch(() => toast.error("Failed to load resources"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? resources : resources.filter((r) => r.category === filter);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <FiHeart className="text-pink-500 text-4xl mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">Counseling & Support</h1>
        <p className="text-gray-500 mt-1">Free counseling, mental health support, legal aid, shelter, and more.</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {["all", "mental_health", "trauma", "legal_aid", "shelter"].map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${filter === c ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"}`}>
            {c === "all" ? "All" : CAT_LABELS[c] || c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filtered.map((r) => (
          <div key={r.id} className="card border border-gray-100 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${CAT_COLORS[r.category] || "bg-gray-100 text-gray-600"}`}>
                {CAT_LABELS[r.category] || r.category}
              </span>
              {r.is_online && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Online</span>}
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-2">{r.title}</h3>
            <p className="text-gray-500 text-sm mb-3">{r.description}</p>
            <div className="space-y-1.5 mt-auto">
              {r.contact && <a href={`tel:${r.contact.replace(/\D/g, "")}`} className="flex items-center gap-2 text-sm text-green-700 hover:underline"><FiPhone className="flex-shrink-0" /> {r.contact}</a>}
              {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline"><FiGlobe className="flex-shrink-0" /> Website</a>}
              {r.location && <p className="flex items-center gap-2 text-xs text-gray-400"><FiMapPin className="flex-shrink-0" /> {r.location}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
