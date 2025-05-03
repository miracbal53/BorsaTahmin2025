import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import InfoSection from "../components/InfoSection";
import Footer from "../components/Footer";
import { jwtDecode } from "jwt-decode"; 
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        // Token bozuksa hiçbir şey yapma
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // JWT token'ı localStorage'a kaydet
        localStorage.setItem("token", data.access_token);

        // Token'ı decode ederek kullanıcı rolünü al
        const decodedToken = jwtDecode(data.access_token);
        localStorage.setItem("role", decodedToken.role);

        setSuccessMessage("Giriş başarılı!");
        

        // Kullanıcı rolüne göre yönlendirme yap
        if (decodedToken.role === "admin") {
          setTimeout(() => navigate("/admin"), 2000); // Admin sayfasına yönlendirme
          console.log("Admin sayfasına yönlendiriliyor...");
        } else {
          setTimeout(() => navigate("/"), 2000); // Ana sayfaya yönlendirme
          console.log("Ana sayfaya yönlendiriliyor...");
        }
        } else {
          setErrorMessage(data.error || "Giriş başarısız!");
        }
    } catch (error) {
      console.error("Hata:", error);
      setErrorMessage("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="login-page">
      <Header />
      <section className="login-section">
        <div className="login-container">
          <div className="login-box">
            <h2 className="login-title">Giriş Yap</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="E-mail adresinizi giriniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Şifre</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Şifrenizi giriniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-button">
                Giriş Yap
              </button>
            </form>

            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <p className="register-link">
              Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
            </p>
          </div>
        </div>
      </section>
      <InfoSection />
      <Footer />
    </div>
  );
};

export default Login;