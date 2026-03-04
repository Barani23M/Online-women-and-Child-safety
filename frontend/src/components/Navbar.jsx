import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiShield, FiAlertTriangle, FiMenu, FiX, FiPhone } from "react-icons/fi";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };

  const navLinks = [
    { to: "/helplines",       label: "Helplines" },
    { to: "/legal-resources", label: "Legal Rights" },
    { to: "/counseling",      label: "Counseling" },
    { to: "/child-safety",    label: "Child Safety" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-primary-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
          <FiShield className="text-primary-600 text-2xl" />
          SafeGuard
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-primary-600 transition">{l.label}</Link>
          ))}
          {user && <Link to="/safe-routes" className="hover:text-primary-600 transition">Safe Routes</Link>}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login"    className="btn-outline text-sm py-1.5 px-4">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Register</Link>
            </>
          ) : (
            <>
              <Link to="/sos" className="btn-danger flex items-center gap-1.5 text-sm py-2 px-4 animate-pulse">
                <FiAlertTriangle /> SOS
              </Link>
              <Link to="/dashboard" className="hover:text-primary-600 text-sm transition">Dashboard</Link>
              {isAdmin && <Link to="/admin" className="hover:text-primary-600 text-sm transition">Admin</Link>}
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-danger-600 transition">Logout</button>
            </>
          )}
          {/* Emergency number always visible */}
          <a href="tel:112" className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-red-100 transition">
            <FiPhone /> 112
          </a>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-3 text-sm">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-gray-700 hover:text-primary-600" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          {user && (
            <>
              <Link to="/sos"       onClick={() => setOpen(false)} className="btn-danger text-center">🚨 SOS Emergency</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-outline text-center">Dashboard</Link>
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>}
              <button onClick={() => { handleLogout(); setOpen(false); }} className="text-left text-gray-500">Logout</button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login"    onClick={() => setOpen(false)} className="btn-outline text-center">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-center">Register</Link>
            </>
          )}
          <a href="tel:112" className="text-red-700 font-bold">📞 Emergency: 112</a>
        </div>
      )}
    </nav>
  );
}
