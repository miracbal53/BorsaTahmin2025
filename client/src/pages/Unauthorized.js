import React from "react";

const Unauthorized = () => {
  const role = localStorage.getItem("role");

  const handleRedirect = (e) => {
    e.preventDefault();
    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      margin: "40px auto",
      maxWidth: 500,
      padding: 32
    }}>
      <div style={{ fontSize: 64, color: "#dc3545", marginBottom: 16 }}>
        <i className="fas fa-ban"></i>
      </div>
      <h2 style={{ color: "#dc3545", marginBottom: 12 }}>Yetkisiz Erişim</h2>
      <p style={{ fontSize: 18, color: "#333", marginBottom: 24 }}>
        Bu sayfaya erişim izniniz yok.<br />
        Lütfen yetkili bir hesapla giriş yapınız.
      </p>
      <a
        href={role === "admin" ? "/admin" : "/"}
        onClick={handleRedirect}
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "10px 22px",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: "bold"
        }}
      >
        Anasayfaya Dön
      </a>
    </div>
  );
};

export default Unauthorized;