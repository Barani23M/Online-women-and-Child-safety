import { useState } from "react";
import { incidentAPI } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiFileText } from "react-icons/fi";

const TYPES = ["harassment","domestic_violence","child_abuse","cybercrime","stalking","assault","trafficking","other"];

export default function ReportIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    incident_type: "harassment", title: "", description: "", location: "", is_anonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return toast.error("Title and description are required");
    setLoading(true);
    try {
      await incidentAPI.report(form);
      toast.success("Incident reported successfully. Stay safe!");
      navigate("/my-incidents");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <FiFileText className="text-blue-500 text-3xl" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Report an Incident</h1>
            <p className="text-gray-500 text-sm">Your report is confidential and can be submitted anonymously.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
            <select className="input-field" value={form.incident_type} onChange={(e) => set("incident_type", e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input-field" placeholder="Brief title of the incident" required
              value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea className="input-field h-32 resize-none" placeholder="Describe what happened in detail. Your information helps us take action."
              required value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
            <input className="input-field" placeholder="City, Area, or Address" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-primary-600"
              checked={form.is_anonymous} onChange={(e) => set("is_anonymous", e.target.checked)} />
            <div>
              <span className="font-medium text-gray-700">Submit Anonymously</span>
              <p className="text-xs text-gray-500">Your identity will not be disclosed to anyone if checked.</p>
            </div>
          </label>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠ If you are in immediate danger, please call <strong>112</strong> or trigger an <strong>SOS alert</strong> instead of filling this form.
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "Submitting report…" : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
