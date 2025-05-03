import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import InfoSection from "../components/InfoSection";
import Footer from "../components/Footer";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [occupation, setOccupation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Şifreler uyuşmuyor");
      return;
    }

    const phoneRegex = /^05\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setErrorMessage(
        "Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır."
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phoneNumber,
          password,
          occupation,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("Kayıt başarılı!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrorMessage(data.error || "Kayıt başarısız!");
      }
    } catch (error) {
      console.error("Hata:", error);
      setErrorMessage("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  return (
    <div className="register-page">
      <Header />
      <section className="register-section">
        <div className="register-container">
          <div className="register-box">
            <h2 className="register-title">Kayıt Ol</h2>

            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label>Ad</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Adınızı girin"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Soyad</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Soyadınızı girin"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="E-posta adresinizi girin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Telefon Numarası</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="05xx ile başlayacak şekilde girin"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  pattern="[0-9]{11}"
                  maxLength="11"
                  required
                />
                <small className="form-text text-muted">
                  Örnek: 05xxxxxxxxx
                </small>
              </div>
              <div className="form-group">
                <label>Şifre</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Şifre Tekrar</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Meslek (Boş bırakılabilir)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mesleğinizi girin (isteğe bağlı)"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>
              <button type="submit" className="register-button">
                Kayıt Ol
              </button>
            </form>

            <p className="login-link">
              Zaten bir hesabınız var mı? <Link to="/login">Giriş Yapın</Link>
            </p>
          </div>
        </div>
      </section>
      <InfoSection />
      <Footer />
    </div>
  );
};

export default Register;