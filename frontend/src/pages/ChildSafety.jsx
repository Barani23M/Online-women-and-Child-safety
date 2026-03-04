import { FiUsers, FiShield, FiPhone, FiBook, FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router-dom";

const topics = [
  { icon: "🚫", title: "Good Touch / Bad Touch", desc: "Help children understand the difference between appropriate and inappropriate touching. Teach them it's okay to say NO to adults." },
  { icon: "🗣", title: "Speak Up, Stay Safe", desc: "Encourage children to tell a trusted adult if anyone makes them uncomfortable or touches them inappropriately." },
  { icon: "📱", title: "Online Safety for Children", desc: "Protect children from online predators, cyberbullying, and inappropriate content. Monitor screen time and digital interactions." },
  { icon: "🔒", title: "Personal Space & Body Autonomy", desc: "Teach children that their body belongs to them. No adult should touch them without permission." },
  { icon: "🏫", title: "School Safety", desc: "Know the signs of bullying, abuse by teachers, and peer pressure. Children have the right to a safe learning environment." },
  { icon: "😔", title: "Recognizing Abuse Signs", desc: "Sudden behavior changes, withdrawal, nightmares, reluctance to go to school, unexplained injuries — these may be warning signs." },
  { icon: "⚖", title: "POCSO Act (2012)", desc: "The Protection of Children from Sexual Offences Act protects all children under 18. Reporting is mandatory for anyone aware of child abuse." },
  { icon: "📞", title: "Child Helplines", desc: "CHILDLINE 1098 is available 24/7 for children in distress. Any child or adult can call on behalf of a child in need." },
];

const tips = [
  "Never leave children unattended with strangers",
  "Teach children their full name, parents' names, and a trusted phone number",
  "Use 'no secrets' rule — make sure children know they can share everything with parents",
  "Monitor social media and online games regularly",
  "Maintain open communication so children feel safe talking about discomfort",
  "Know your child's friends, teachers, and other adults in their life",
  "Teach children to call CHILDLINE 1098 if they need help",
];

export default function ChildSafety() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <FiUsers className="text-blue-500 text-5xl mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">Child Safety & Protection</h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">Resources, guidance, and awareness to protect children from abuse, exploitation, and harm.</p>
      </div>

      {/* CHILDLINE Banner */}
      <div className="bg-blue-600 text-white rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold mb-1">CHILDLINE — 1098</h2>
          <p className="text-blue-100">24/7 emergency outreach for children in distress. Free, confidential, available to all.</p>
        </div>
        <a href="tel:1098" className="bg-white text-blue-700 font-extrabold py-3 px-8 rounded-xl text-xl hover:bg-blue-50 transition flex-shrink-0">
          📞 Call 1098
        </a>
      </div>

      {/* Topics */}
      <h2 className="text-xl font-bold text-gray-800 mb-5">Child Safety Topics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {topics.map((t) => (
          <div key={t.title} className="card border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl mb-3">{t.icon}</div>
            <h3 className="font-bold text-gray-800 mb-2">{t.title}</h3>
            <p className="text-gray-500 text-sm">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Safety Tips */}
      <div className="card bg-green-50 border border-green-200 mb-8">
        <h2 className="font-bold text-green-800 text-lg mb-3">✅ Safety Tips for Parents & Guardians</h2>
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-green-900">
              <span className="mt-0.5">•</span> {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Legal Info */}
      <div className="card border border-purple-200 bg-purple-50 mb-8">
        <h2 className="font-bold text-purple-800 text-lg mb-3">⚖ Legal Protection for Children</h2>
        <div className="space-y-3 text-sm text-purple-900">
          <div><strong>POCSO Act 2012:</strong> Protects children under 18 from sexual abuse. Mandatory reporting by all. Special fast-track courts.</div>
          <div><strong>Right to Education Act 2009:</strong> Free & compulsory education for all children 6–14. Protects against discrimination.</div>
          <div><strong>Prohibition of Child Marriage Act 2006:</strong> Marriage of girl below 18 or boy below 21 is illegal.</div>
          <div><strong>Child Labour (Prohibition) Act:</strong> Employment of children below 14 is prohibited.</div>
        </div>
        <Link to="/legal-resources" className="inline-block mt-4 text-primary-600 text-sm hover:underline font-medium">→ View All Legal Resources</Link>
      </div>

      {/* Report */}
      <div className="card bg-red-50 border border-red-200 text-center">
        <FiAlertTriangle className="text-red-500 text-3xl mx-auto mb-2" />
        <h2 className="font-bold text-red-800 text-xl mb-2">Witnessed Child Abuse?</h2>
        <p className="text-red-700 text-sm mb-4">You are legally obligated to report under POCSO Act. Call 1098 or file a police complaint immediately.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="tel:1098" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition">📞 1098 CHILDLINE</a>
          <a href="tel:100" className="bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-red-700 transition">📞 100 Police</a>
          <Link to="/report" className="bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-700 transition">Report Online</Link>
        </div>
      </div>
    </div>
  );
}
