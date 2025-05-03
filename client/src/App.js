import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Stocks from "./pages/Stocks";
import ProtectedRoute from "./routes/ProtectedRoute";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Profile from "./pages/Profile";
import AdminDashboard from "./components/Admin/AdminDashboard";
import UserManagement from "./components/Admin/AdminUsers";
import SubscriptionRequests from "./components/Admin/AdminSubscriptions";
import PredictionManagement from "./components/Admin/AdminPredictions";
import AdminMessages from "./components/Admin/AdminMessages";
import Unauthorized from "./pages/Unauthorized";

function ScrollToTop() {
  const location = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hizmetler"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hakkimizda"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borsalar"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Stocks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/iletisim"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute allowLoggedOut={true}>
              <Register />
            </ProtectedRoute>
          }
        />

        {/* Kullanıcıya özel route'lar */}
        <Route
          path="/profil"
          element={
            <ProtectedRoute requiredRole="user">
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin'e özel route'lar */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute requiredRole="admin">
              <SubscriptionRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/predictions"
          element={
            <ProtectedRoute requiredRole="admin">
              <PredictionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminMessages />
            </ProtectedRoute>
          }
        />

        {/* Yetkisiz erişim */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 404 */}
        <Route path="*" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;