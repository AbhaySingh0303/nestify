import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Complaints from './pages/Complaints';
import MyPayments from './pages/MyPayments';
import MyComplaints from './pages/MyComplaints';
import SetupPG from './pages/SetupPG';
import OwnerDashboard from './pages/OwnerDashboard';

// PrivateRoute: Protects routes based on login state and role
export const PrivateRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  const isOwner = user.role === 'owner' || user.role === 'admin';

  if (roleRequired === 'owner' && !isOwner) return <Navigate to="/" />;
  if (roleRequired === 'tenant' && isOwner) return <Navigate to="/owner-dashboard" />;

  return children;
};

// SmartRedirect: Handles post-login routing based on role
const SmartRedirect = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;

  const isOwner = user.role === 'owner' || user.role === 'admin';

  if (isOwner) {
    return <Navigate to="/owner-dashboard" />;
  }

  // tenant
  if (user.pg) return <Navigate to="/" />;
  return <Navigate to="/setup" />;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <Login /> : <SmartRedirect />} />
        <Route path="/register" element={!user ? <Register /> : <SmartRedirect />} />

        {/* Setup: Only shown to tenants without a PG */}
        <Route path="/setup" element={
          user ? <SetupPG /> : <Navigate to="/login" />
        } />

        {/* Owner Hub — shows all PGs, create new PG */}
        <Route path="/owner-dashboard" element={
          <PrivateRoute roleRequired="owner">
            <OwnerDashboard />
          </PrivateRoute>
        } />

        {/* Legacy alias */}
        <Route path="/my-pgs" element={<Navigate to="/owner-dashboard" replace />} />

        {/* Per-PG dashboard (opened by owner clicking "Open PG") */}
        <Route path="/dashboard/:pgId" element={
          <PrivateRoute roleRequired="owner">
            <DashboardLayout><Dashboard /></DashboardLayout>
          </PrivateRoute>
        } />

        {/* Owner sub-routes (inside a specific PG) — pgId-scoped */}
        <Route path="/dashboard/:pgId/rooms" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Rooms /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/dashboard/:pgId/tenants" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Tenants /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/dashboard/:pgId/payments" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Payments /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/dashboard/:pgId/complaints" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Complaints /></DashboardLayout></PrivateRoute>
        } />

        {/* Legacy flat owner routes (kept for backward compat) */}
        <Route path="/rooms" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Rooms /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/tenants" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Tenants /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/payments" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Payments /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/complaints" element={
          <PrivateRoute roleRequired="owner"><DashboardLayout><Complaints /></DashboardLayout></PrivateRoute>
        } />

        {/* Tenant dashboard */}
        <Route path="/" element={
          <PrivateRoute roleRequired="tenant">
            <DashboardLayout><Dashboard /></DashboardLayout>
          </PrivateRoute>
        } />

        {/* Tenant-only routes */}
        <Route path="/my-payments" element={
          <PrivateRoute roleRequired="tenant"><DashboardLayout><MyPayments /></DashboardLayout></PrivateRoute>
        } />
        <Route path="/my-complaints" element={
          <PrivateRoute roleRequired="tenant"><DashboardLayout><MyComplaints /></DashboardLayout></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
