import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import Dashboard     from "./pages/Dashboard";
import SOSPage       from "./pages/SOSPage";
import ReportIncident from "./pages/ReportIncident";
import MyIncidents   from "./pages/MyIncidents";
import Helplines     from "./pages/Helplines";
import LegalResources from "./pages/LegalResources";
import Counseling    from "./pages/Counseling";
import ChildSafety   from "./pages/ChildSafety";
import SafeRoutes    from "./pages/SafeRoutes";
import AdminDashboard from "./pages/AdminDashboard";
import Profile       from "./pages/Profile";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppContent() {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/helplines"       element={<Helplines />} />
          <Route path="/legal-resources" element={<LegalResources />} />
          <Route path="/counseling"      element={<Counseling />} />
          <Route path="/child-safety"    element={<ChildSafety />} />

          <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/sos"              element={<PrivateRoute><SOSPage /></PrivateRoute>} />
          <Route path="/report"           element={<PrivateRoute><ReportIncident /></PrivateRoute>} />
          <Route path="/my-incidents"     element={<PrivateRoute><MyIncidents /></PrivateRoute>} />
          <Route path="/safe-routes"      element={<PrivateRoute><SafeRoutes /></PrivateRoute>} />
          <Route path="/profile"          element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin"            element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
