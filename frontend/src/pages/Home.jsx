import { Link } from "react-router-dom";
import { FiAlertTriangle, FiFileText, FiPhone, FiBook, FiHeart, FiShield, FiUsers, FiMap } from "react-icons/fi";

const stats = [
  { label: "Women Helped", value: "50,000+", color: "text-primary-600" },
  { label: "Incidents Reported", value: "12,000+", color: "text-blue-600" },
  { label: "Legal Resources", value: "100+", color: "text-green-600" },
  { label: "Partner NGOs", value: "200+", color: "text-orange-600" },
];

const features = [
  { icon: <FiAlertTriangle className="text-red-500 text-3xl" />, title: "One-Tap SOS", desc: "Instantly alert your trusted contacts and share your live location in one tap.", link: "/sos" },
  { icon: <FiFileText className="text-blue-500 text-3xl" />, title: "Report Incident", desc: "Safely report harassment, violence or abuse — anonymously if needed.", link: "/report" },
  { icon: <FiPhone className="text-green-500 text-3xl" />, title: "Helpline Directory", desc: "Verified national and state helplines for women and children — available 24/7.", link: "/helplines" },
  { icon: <FiBook className="text-purple-500 text-3xl" />, title: "Know Your Rights", desc: "Legal resources covering POCSO, POSH, Domestic Violence Act, Dowry laws and more.", link: "/legal-resources" },
  { icon: <FiHeart className="text-pink-500 text-3xl" />, title: "Counseling Support", desc: "Free counseling, shelter, legal aid, and mental health resources near you.", link: "/counseling" },
  { icon: <FiUsers className="text-cyan-500 text-3xl" />, title: "Child Safety", desc: "Child-specific resources, POCSO awareness, abuse prevention, and reporting guides.", link: "/child-safety" },
  { icon: <FiMap className="text-yellow-600 text-3xl" />, title: "Safe Routes & Places", desc: "Find safe places, shelters, hospitals and police stations near you on a map.", link: "/safe-routes" },
  { icon: <FiShield className="text-indigo-500 text-3xl" />, title: "Cyber Safety", desc: "Resources to combat online harassment, cyberstalking, and digital abuse.", link: "/legal-resources" },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-rose-900 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <span className="bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-full backdrop-blur">🛡 Your Safety Is Our Priority</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            SafeGuard: Protect Women & Children
          </h1>
          <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
            Report incidents, trigger SOS alerts, access legal resources, connect with counselors, and find safe shelter — all in one platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition shadow-lg text-lg">
              Get Started Free
            </Link>
            <Link to="/sos" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg text-lg flex items-center gap-2">
              <FiAlertTriangle /> SOS Emergency
            </Link>
          </div>
          <div className="mt-6 text-primary-200 text-sm">
            <a href="tel:112" className="underline hover:text-white">📞 Call 112 for immediate emergency</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Everything You Need to Stay Safe</h2>
        <p className="text-center text-gray-500 mb-10">Comprehensive tools and resources for women and children.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Link to={f.link} key={f.title} className="card hover:shadow-xl transition-shadow group border border-gray-100">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-primary-600 transition">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="bg-red-50 border-t border-red-100 py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-3">In Immediate Danger?</h2>
        <p className="text-red-600 mb-6">Don't wait. Call emergency services or trigger an SOS alert right now.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:112"  className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition text-lg">📞 Call 112</a>
          <a href="tel:1091" className="bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition text-lg">📞 Women Helpline: 1091</a>
          <a href="tel:1098" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition text-lg">📞 Child Helpline: 1098</a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 text-white text-center py-16 px-4">
        <h2 className="text-3xl font-bold mb-3">Join SafeGuard Today</h2>
        <p className="text-primary-100 mb-6 max-w-lg mx-auto">Create a free account to access all features — SOS alerts, incident tracking, trusted contacts, and more.</p>
        <Link to="/register" className="bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition text-lg shadow-lg">
          Register for Free
        </Link>
      </section>
    </div>
  );
}
