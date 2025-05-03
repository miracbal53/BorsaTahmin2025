import React from "react";
import { useNavigate } from "react-router-dom";
import "./ErrorPage.css";

const ErrorPage = ({ message }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // Kullanıcının rolünü al

  const handleRedirect = () => {
    if (role === "admin") {
      navigate("/admin"); // Admin kullanıcılar için admin paneline yönlendir
    } else {
      navigate("/"); // Normal kullanıcılar için anasayfaya yönlendir
    }
  };

  return (
    <div className="error-page">
      <h1>Yetkisiz Erişim</h1>
      <p>{message || "Bu sayfaya erişim yetkiniz bulunmamaktadır."}</p>
      <button onClick={handleRedirect}>Anasayfaya Dön</button>
    </div>
  );
};

export default ErrorPage;