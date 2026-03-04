import { useState } from "react";
import { sosAPI } from "../services/api";
import toast from "react-hot-toast";
import { FiAlertTriangle, FiMapPin, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function SOSPage() {
  const { user } = useAuth();
  const [sosActive, setSosActive] = useState(false);
  const [alertId, setAlertId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);

  const getLocation = () => new Promise((resolve) => {
    setLocating(true);
    if (!navigator.geolocation) { setLocating(false); resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { setLocating(false); resolve(null); }
    );
  });

  const triggerSOS = async () => {
    setLoading(true);
    const loc = await getLocation();
    if (loc) setLocation(loc);
    try {
      const payload = {
        message: `EMERGENCY! ${user.full_name} needs immediate help!`,
        latitude: loc?.lat || null,
        longitude: loc?.lng || null,
      };
      const res = await sosAPI.trigger(payload);
      setAlertId(res.data.id);
      setSosActive(true);
      toast.error("🚨 SOS ALERT SENT! Emergency contacts notified.", { duration: 6000 });
    } catch {
      toast.error("Failed to send SOS. Call 112 immediately!");
    } finally {
      setLoading(false);
    }
  };

  const resolveSOS = async () => {
    try {
      await sosAPI.resolve(alertId);
      setSosActive(false);
      setAlertId(null);
      toast.success("SOS resolved. Stay safe!");
    } catch {
      toast.error("Failed to resolve SOS");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="card">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${sosActive ? "bg-green-100" : "bg-red-100"}`}>
            {sosActive
              ? <FiCheckCircle className="text-green-600 text-5xl" />
              : <FiAlertTriangle className="text-red-600 text-5xl" />
            }
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">
            {sosActive ? "SOS Alert Active" : "Emergency SOS"}
          </h1>
          <p className="text-gray-500 mt-2">
            {sosActive
              ? "Your emergency contacts and authorities have been notified. Help is on the way."
              : "Press the button below to instantly alert your trusted contacts and share your location."}
          </p>
        </div>

        {!sosActive ? (
          <button
            onClick={triggerSOS}
            disabled={loading || locating}
            className="btn-danger w-full py-6 text-2xl font-extrabold rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            {loading || locating ? "⏳ Locating & Sending…" : "🚨 TRIGGER SOS NOW"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              <p className="font-bold text-lg">Alert is ACTIVE</p>
              {location && (
                <p className="text-sm mt-1 flex items-center justify-center gap-1">
                  <FiMapPin /> Location shared: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
              <p className="text-sm mt-1">Your trusted contacts have been notified.</p>
            </div>
            <button onClick={resolveSOS} className="btn-primary w-full py-3 text-lg">
              ✅ I am Safe — Cancel SOS
            </button>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <p className="text-gray-600 font-semibold mb-3">Emergency Helplines</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[["112","Emergency"],["1091","Women"],["1098","Children"],["100","Police"],["108","Ambulance"]].map(([num, label]) => (
              <a key={num} href={`tel:${num}`} className="flex flex-col items-center bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl px-4 py-3 transition">
                <span className="font-extrabold text-red-700 text-lg">{num}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="card mt-6 text-left">
        <h2 className="font-bold text-gray-700 mb-3">What Happens When You Trigger SOS?</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✅ Your trusted contacts receive an emergency notification</li>
          <li>✅ Your GPS location is captured and shared</li>
          <li>✅ An alert is logged in the system for responders</li>
          <li>✅ You can resolve the alert once you are safe</li>
          <li className="text-red-600 font-medium">⚠ Always call 112 in immediate life-threatening situations</li>
        </ul>
      </div>
    </div>
  );
}
