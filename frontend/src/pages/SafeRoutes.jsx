import { useEffect, useState } from "react";
import { safePlacesAPI } from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import toast from "react-hot-toast";
import { FiMap } from "react-icons/fi";

// Fix leaflet default icon (use locally bundled assets, not CDN)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

const TYPE_COLORS = { police_station: "#ef4444", hospital: "#3b82f6", shelter: "#22c55e", ngo: "#f59e0b" };
const TYPE_EMOJI  = { police_station: "👮", hospital: "🏥", shelter: "🏠", ngo: "🤝" };

export default function SafeRoutes() {
  const [places, setPlaces] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    safePlacesAPI.get()
      .then((r) => setPlaces(r.data))
      .catch(() => toast.error("Failed to load safe places"))
      .finally(() => setLoading(false));
  }, []);

  // Get user's current location to show on map
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const filtered = filter === "all" ? places : places.filter((p) => p.place_type === filter);
  const center = userPos ? [userPos.lat, userPos.lng] : places.length > 0 ? [places[0].latitude, places[0].longitude] : [20.5937, 78.9629];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <FiMap className="text-yellow-600 text-4xl mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">Safe Places Near You</h1>
        <p className="text-gray-500 mt-1">Find verified police stations, hospitals, shelters, and NGOs on the map.</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {["all", "police_station", "hospital", "shelter", "ngo"].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${filter === t ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"}`}>
            {TYPE_EMOJI[t] || "📍"} {t === "all" ? "All Places" : t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-lg mb-6" style={{ height: 420 }}>
        <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={new L.Icon({
              iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#ec4899" stroke="white" stroke-width="3"/><circle cx="16" cy="16" r="5" fill="white"/></svg>`),
              iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
            })}>
              <Popup><strong>📍 You are here</strong></Popup>
            </Marker>
          )}
          {filtered.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}>
              <Popup>
                <strong>{TYPE_EMOJI[p.place_type]} {p.name}</strong><br />
                {p.address}<br />
                {p.phone && <a href={`tel:${p.phone}`} className="text-blue-600">{p.phone}</a>}
                {p.is_verified && <span className="block text-green-600 text-xs mt-1">✓ Verified</span>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="card border border-gray-100 flex gap-4 items-start">
            <div className="text-3xl">{TYPE_EMOJI[p.place_type] || "📍"}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">{p.name}</h3>
                {p.is_verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
              </div>
              <p className="text-gray-500 text-sm">{p.address}</p>
              {p.phone && <a href={`tel:${p.phone}`} className="text-green-600 text-sm font-medium mt-1 block hover:underline">📞 {p.phone}</a>}
            </div>
          </div>
        ))}
      </div>

      {places.length === 0 && (
        <div className="text-center text-gray-400 py-10">No safe places registered yet.</div>
      )}
    </div>
  );
}
