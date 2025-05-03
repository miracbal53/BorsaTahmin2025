import React from "react";
import { Navigate } from "react-router-dom";
import Unauthorized from "../pages/Unauthorized";

const ProtectedRoute = ({ children, requiredRole, allowLoggedOut }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isTokenValid = token && token !== "undefined" && token !== "null";
  console.log("token:", token, "role:", role, "isTokenValid:", isTokenValid);
  // Giriş yapmamış ve public sayfa ise erişim ver
  if (!isTokenValid && allowLoggedOut) {
    return children;
  }
  // Giriş yapmamış ve public olmayan sayfa ise login'e yönlendir
  if (!isTokenValid) {
    return <Navigate to="/login" />;
  }
  // Token decode edilemiyorsa login'e yönlendir
  try {
    JSON.parse(atob(token.split(".")[1]));
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/login" />;
  }
  // Admin sayfası ve kullanıcı admin değilse
  if (requiredRole === "admin" && role !== "admin") {
    return <Unauthorized />;
  }
  // Kullanıcı sayfası ve kullanıcı admin ise (admin user sayfalarına erişemesin)
  if (requiredRole === "user" && role === "admin") {
    return <Unauthorized />;
  }
  // Eğer public sayfa ve kullanıcı admin ise, anasayfa ve diğer public sayfalara erişimi engelle
  if (allowLoggedOut && role === "admin") {
    return <Unauthorized />;
  }
  return children;
};

export default ProtectedRoute;