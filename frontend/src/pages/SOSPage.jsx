import { useState, useRef, useEffect, useCallback } from "react";
import { sosAPI, familyAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  FiAlertTriangle, FiMapPin, FiCheckCircle, FiCamera,
  FiUsers, FiShield, FiPhone, FiX, FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

// Roles that cannot trigger SOS
const OBSERVER_ROLES = new Set(["admin", "parent", "counselor"]);

export default function SOSPage() {
  const { user } = useAuth();

  // ── Core SOS state ──────────────────────────────────────────────────────
  const [sosActive,       setSosActive]       = useState(false);
  const [alertId,         setAlertId]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [resolving,       setResolving]       = useState(false);
  const [locating,        setLocating]        = useState(false);
  const [location,        setLocation]        = useState(null);
  const [selfiePreview,   setSelfiePreview]   = useState(null);
  const [familyNotified,  setFamilyNotified]  = useState(0);
  const [cameraActive,    setCameraActive]    = useState(false);
  const [countdown,       setCountdown]       = useState(null);
  const [capturingSelfie, setCapturingSelfie] = useState(false);
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [resolveConfirm,  setResolveConfirm]  = useState(false);
  const [parentCheck,     setParentCheck]     = useState({ loading: true, hasParents: false, count: 0, warning: null }); // ← NEW: parent status

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const pickSelfieFromFile = useCallback(() => {
    return new Promise((resolve) => {
      const input = fileInputRef.current;
      if (!input) {
        resolve(null);
        return;
      }

      input.value = "";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }, []);

  // ── BUG FIX: On mount, check if user already has an active SOS ──────────
  useEffect(() => {
    if (!user || OBSERVER_ROLES.has(user.role)) { setInitialLoading(false); return; }
    sosAPI.myAlerts()
      .then((r) => {
        const active = r.data.find((a) => a.is_active);
        if (active) {
          setSosActive(true);
          setAlertId(active.id);
          // restore location if stored
          if (active.latitude && active.longitude) {
            setLocation({ lat: active.latitude, lng: active.longitude });
          }
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [user]);

  // ── Check if user has linked parents ──────────────────────────────────────
  useEffect(() => {
    if (!user || OBSERVER_ROLES.has(user.role)) {
      setParentCheck({ loading: false, hasParents: false, count: 0, warning: null });
      return;
    }

    sosAPI.checkParents()
      .then((res) => {
        const { has_parents, parent_count, warning } = res.data;
        setParentCheck({ loading: false, hasParents: has_parents, count: parent_count, warning });
      })
      .catch(() => {
        setParentCheck({ loading: false, hasParents: false, count: 0, warning: "Could not verify parents" });
      });
  }, [user]);

  // ── GPS Location ─────────────────────────────────────────────────────────
  const getLocation = () =>
    new Promise((resolve) => {
      setLocating(true);
      if (!navigator.geolocation) { setLocating(false); resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => { setLocating(false); resolve(null); },
        { timeout: 8000, maximumAge: 0 }
      );
    });

  // ── Selfie capture ────────────────────────────────────────────────────────
  const captureSelfie = async (allowPickerFallback = true) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return allowPickerFallback ? await pickSelfieFromFile() : null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      setCameraActive(true);
      await video.play();
      await new Promise((r) => { video.onloadeddata = r; setTimeout(r, 1000); });
      for (let i = 3; i >= 1; i--) { setCountdown(i); await new Promise((r) => setTimeout(r, 700)); }
      setCountdown(null);
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.7);
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      setCameraActive(false);
      return base64;
    } catch {
      setCameraActive(false);
      setCountdown(null);
      return allowPickerFallback ? await pickSelfieFromFile() : null;
    }
  };

  const handleSelfieCapture = async () => {
    if (capturingSelfie) return;
    setCapturingSelfie(true);
    try {
      const selfie = await captureSelfie(true);
      if (selfie) {
        setSelfiePreview(selfie);
        toast.success("Selfie attached successfully.");
      } else {
        toast.error("Could not capture photo. Please try again.");
      }
    } finally {
      setCapturingSelfie(false);
    }
  };

  // ── TRIGGER SOS ──────────────────────────────────────────────────────────
  const triggerSOS = async () => {
    setLoading(true);
    try {
      const loc    = await getLocation();
      if (loc) setLocation(loc);
      const selfie = selfiePreview || await captureSelfie(false);
      if (selfie) setSelfiePreview(selfie);

      const payload = {
        message:   `EMERGENCY! ${user.full_name} needs immediate help!`,
        latitude:  loc?.lat  ?? null,
        longitude: loc?.lng  ?? null,
        selfie_data: selfie  ?? null,
      };

      const res   = await sosAPI.trigger(payload);
      const sosId = res.data.id;
      setAlertId(sosId);
      setSosActive(true);

      // Also notify family
      try {
        const fRes = await familyAPI.sendAlert({
          latitude:    loc?.lat  ?? null,
          longitude:   loc?.lng  ?? null,
          selfie_data: selfie    ?? null,
          message:     `🚨 EMERGENCY! ${user.full_name} has triggered SOS and needs immediate help!`,
          sos_alert_id: sosId,
        });
        const count = fRes.data?.notified_parent_ids?.length ?? 0;
        setFamilyNotified(count);
        const msg = count > 0
          ? `🚨 SOS SENT! ${count} guardian(s) notified with location${selfie ? " & selfie" : ""}.`
          : "🚨 SOS ALERT SENT! Call 112 immediately.";
        toast.error(msg, { duration: 8000 });
      } catch {
        toast.error("🚨 SOS ALERT SENT! Call 112 immediately.", { duration: 6000 });
      }
    } catch (err) {
      // BUG FIX: if trigger itself fails (e.g. already active), still check existing
      const existingMsg = err?.response?.data?.detail;
      toast.error(existingMsg || "Failed to send SOS — call 112 immediately!");
    } finally {
      setLoading(false);
    }
  };

  // ── RESOLVE SOS ───────────────────────────────────────────────────────────
  // Always calls resolveActive() — works even if alertId was lost on page refresh
  const resolveSOS = async () => {
    setResolving(true);
    try {
      // Try resolveActive first (no ID needed — most robust)
      await sosAPI.resolveActive();
      setSosActive(false);
      setAlertId(null);
      setSelfiePreview(null);
      setFamilyNotified(0);
      setLocation(null);
      setResolveConfirm(false);
      toast.success("✅ SOS resolved. Stay safe!");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "No active SOS alert found") {
        // Already resolved (e.g. by admin or another session) — just clear UI
        setSosActive(false);
        setAlertId(null);
        setSelfiePreview(null);
        setFamilyNotified(0);
        setLocation(null);
        setResolveConfirm(false);
        toast.success("SOS was already resolved. You are safe.");
      } else {
        toast.error(detail || "Failed to resolve SOS — try again");
      }
    } finally {
      setResolving(false);
    }
  };

  // ── OBSERVER / NOT-ALLOWED ACCOUNTS ──────────────────────────────────────
  if (user && OBSERVER_ROLES.has(user.role)) {
    const isParent = user.role === "parent";
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-gray-400 text-4xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">SOS Not Available</h1>
          <p className="text-gray-500 mb-6 text-sm">
            {isParent
              ? "Guardian accounts monitor SOS alerts — they cannot trigger SOS themselves. This feature is reserved for child and women accounts."
              : "Admin/Counselor accounts cannot trigger SOS. This is reserved for child and women accounts."}
          </p>
          <Link
            to={isParent ? "/parent-dashboard" : "/admin"}
            className="btn-primary inline-block px-8"
          >
            {isParent ? "Go to Guardian Dashboard" : "Go to Admin Panel"}
          </Link>
        </div>
      </div>
    );
  }

  // ── INITIAL LOADING ───────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-center">
      {/* Hidden camera elements */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: "none" }}
      />
      <div className={`mb-4 rounded-2xl overflow-hidden border-4 border-red-400 shadow-xl relative bg-black ${cameraActive ? "block" : "hidden"}`}>
        <video ref={videoRef} className="w-full max-h-56 object-cover" playsInline muted />
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <span className="text-white text-7xl font-black drop-shadow-lg animate-bounce">{countdown}</span>
            <span className="text-white text-sm mt-3 font-semibold">📸 Capturing selfie…</span>
          </div>
        )}
      </div>

      {/* ── Resolve Confirm Modal ── */}
      {resolveConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
            <h2 className="font-extrabold text-gray-900 text-lg mb-1">Cancel SOS?</h2>
            <p className="text-gray-500 text-sm mb-5">
              Only cancel if you are <strong>safe</strong>. This will notify your guardians that the emergency is resolved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resolveSOS}
                disabled={resolving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={15} />
                {resolving ? "Resolving…" : "Yes, I'm Safe"}
              </button>
              <button
                onClick={() => setResolveConfirm(false)}
                className="px-4 py-3 border-2 border-gray-200 text-gray-500 font-semibold rounded-2xl hover:bg-gray-50 transition"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE SOS BANNER ── */}
      {sosActive && (
        <div className="mb-5 bg-red-600 text-white rounded-3xl p-4 flex items-center gap-3 shadow-xl animate-pulse">
          <div className="text-3xl flex-shrink-0">🚨</div>
          <div className="text-left flex-1">
            <div className="font-extrabold text-base">SOS IS ACTIVE</div>
            <div className="text-red-100 text-xs">Help is being summoned. Stay on the line.</div>
          </div>
          <div className="w-3 h-3 bg-white rounded-full animate-ping flex-shrink-0" />
        </div>
      )}

      {/* ── Main Card ── */}
      <div className="card">
        {/* Icon + title */}
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 transition-all ${
            sosActive ? "bg-green-100 scale-110" : "bg-red-100"
          }`}>
            {sosActive
              ? <FiCheckCircle className="text-green-600 text-5xl" />
              : <FiAlertTriangle className="text-red-600 text-5xl animate-pulse" />
            }
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            {sosActive ? "🚨 Alert is Active" : "Emergency SOS"}
          </h1>
          {user && (
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold ${
              user.role === "child" ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
            }`}>
              {user.role === "child" ? "👦 Child Account" : "👩 Women Account"}
            </div>
          )}
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            {sosActive
              ? "Your trusted contacts and linked guardians have been notified. Help is on the way. Stay calm."
              : "One tap to instantly alert your trusted contacts, share your GPS location, and send a selfie to linked guardians."}
          </p>
        </div>

        {/* ── NOT ACTIVE: trigger button ── */}
        {!sosActive ? (
          <>
            {/* Parent warning if no linked parents */}
            {!parentCheck.loading && !parentCheck.hasParents && (
              <div className="mb-4 rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 flex items-start gap-3">
                <FiAlertTriangle className="text-amber-600 text-xl flex-shrink-0 mt-0.5" />
                <div className="text-left text-xs text-amber-800">
                  <p className="font-bold mb-1">⚠️ No Linked Guardians</p>
                  <p className="text-amber-700">You don't have any linked parents/guardians yet. Ask a parent to link with your account so they receive your SOS alerts with location & selfie.</p>
                  <Link to="/parent-dashboard" className="inline-block mt-2 text-amber-700 font-bold underline hover:no-underline">
                    → Set up family linking
                  </Link>
                </div>
              </div>
            )}

            <button
              onClick={handleSelfieCapture}
              disabled={capturingSelfie || loading || locating}
              className="w-full mb-3 border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-2xl transition disabled:opacity-60"
            >
              {capturingSelfie
                ? "Capturing photo..."
                : selfiePreview
                ? "Retake Selfie"
                : "Attach Selfie (Recommended)"
              }
            </button>

            {selfiePreview && (
              <div className="rounded-2xl overflow-hidden border-2 border-red-200 mb-3">
                <img src={selfiePreview} alt="SOS selfie preview" className="w-full max-h-44 object-cover" />
              </div>
            )}

            <button
              onClick={triggerSOS}
              disabled={loading || locating}
              className="w-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-black text-xl py-7 rounded-2xl shadow-2xl active:scale-95 transition-all duration-150"
              style={{ boxShadow: "0 8px 32px rgba(220,38,38,0.45)" }}
            >
              {loading || locating
                ? <span className="flex items-center justify-center gap-3"><FiRefreshCw className="animate-spin" size={22}/> Sending Alert…</span>
                : "🚨 TRIGGER SOS NOW"
              }
            </button>
            <p className="text-xs text-gray-400 mt-2">Hold and press firmly — this is a real emergency alert</p>
            <div className="mt-5 flex justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1"><FiMapPin size={12} /> Live GPS</span>
              <span className="flex items-center gap-1"><FiCamera size={12} /> Auto Selfie</span>
              <span className="flex items-center gap-1"><FiUsers size={12} /> Notify Guardians</span>
            </div>
          </>
        ) : (
          /* ── ACTIVE: status + resolve ── */
          <div className="space-y-4">
            {/* Alert details */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-left">
              <p className="font-extrabold text-red-700 text-base mb-2">🚨 Alert Status: ACTIVE</p>
              {location && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 mb-1">
                  <FiMapPin size={13} />
                  GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  <a
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="underline font-bold ml-1 text-red-700"
                  >Open Map</a>
                </p>
              )}
              {familyNotified > 0 && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <FiUsers size={13} />
                  {familyNotified} guardian(s) notified{selfiePreview ? " with location & selfie" : " with location"}
                </p>
              )}
              {!location && (
                <p className="text-xs text-amber-600 mt-1">⚠ GPS not available — guardians notified without location</p>
              )}
            </div>

            {/* Selfie or fallback */}
            {selfiePreview ? (
              <div className="rounded-2xl overflow-hidden border-4 border-red-300 shadow-lg">
                <p className="text-xs text-gray-500 bg-gray-50 py-2 flex items-center justify-center gap-1">
                  <FiCamera size={11} /> Selfie captured & sent to guardians
                </p>
                <img src={selfiePreview} alt="SOS selfie" className="w-full max-h-52 object-cover" />
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-700 text-left">
                📷 Camera not available — guardians notified with GPS only.
              </div>
            )}

            {/* Resolve button */}
            <button
              onClick={() => setResolveConfirm(true)}
              disabled={resolving}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <FiCheckCircle size={18} />
              {resolving ? "Resolving…" : "✅ I'm Safe — Cancel SOS"}
            </button>
            <p className="text-xs text-gray-400">Only cancel when you are truly safe</p>
          </div>
        )}

        {/* Emergency Helplines */}
        <div className="mt-8 border-t pt-6">
          <p className="text-gray-600 font-bold mb-3 text-sm">Emergency Helplines</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[["112","Emergency"],["1091","Women"],["1098","Children"],["100","Police"],["108","Ambulance"],["1930","Cyber"]].map(([num, label]) => (
              <a key={num} href={`tel:${num}`}
                className="flex flex-col items-center bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl px-4 py-3 transition active:scale-95">
                <span className="font-extrabold text-red-700 text-lg leading-none">{num}</span>
                <span className="text-xs text-gray-500 mt-0.5">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card mt-4 text-left">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <FiShield size={15} className="text-primary-500" /> What Happens When You Trigger SOS?
        </h2>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "Your trusted contacts receive an emergency notification instantly",
            "Your live GPS location is captured and shared",
            "A selfie is auto-taken from your camera and sent to linked guardians",
            "Linked guardians receive live location + selfie on their dashboard",
            "An alert is logged in the system for responders",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <FiCheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
          <li className="flex items-start gap-2 text-red-600 font-semibold">
            <FiAlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            Always call 112 in immediate life-threatening situations
          </li>
        </ul>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm text-blue-700">
          <strong>Guardian Setup:</strong> Ask your parent/guardian to register as a "Guardian" account, then go to{" "}
          <Link to="/profile?tab=family" className="underline font-semibold">Profile → Family</Link> to link them.
        </div>
      </div>
    </div>
  );
}
