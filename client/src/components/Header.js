import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Modal from "../components/Modal";
import { jwtDecode } from "jwt-decode";
import "./Header.css";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef();

  useEffect(() => {
    setIsNavbarOpen(false);
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/notifications/", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setNotifications(data));
    }
    let role = null;
    if (token && token !== "undefined" && token !== "null") {
      setIsLoggedIn(true);
      try {
        const decoded = jwtDecode(token);
        role = decoded.role;
      } catch {
        setIsLoggedIn(false);
        setIsAdmin(false);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        return;
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
      return;
    }
    setIsAdmin(role === "admin");
  }, [location.pathname]);

  // Bildirim kutusu dışına tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate("/");
  };

  const handleLoginLogout = () => {
    if (isLoggedIn) setIsModalOpen(true);
    else navigate("/login");
  };

  const closeModal = () => setIsModalOpen(false);

  const handleNotificationClick = () => {
    setShowNotifications((v) => !v);
  };

  // Bildirim mesajına tıklanınca sadece o bildirimi okundu yap
  const handleNotificationItemClick = async (notifId) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/notifications/read/${notifId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  return (
    <header className="header_section">
      <div className={`header-container${isAdmin ? " admin-header" : ""}`}>
      <Link
        className="header-logo"
        to={isAdmin ? "/admin" : "/"}
      >
        Finexo
      </Link>
        <nav className={`header-nav${isNavbarOpen ? " open" : ""}`}>
          <ul>
            {isAdmin ? (
              <>
                <li>
                  <Link className={location.pathname === "/admin" ? "active" : ""} to="/admin">Admin Paneli</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/admin/users" ? "active" : ""} to="/admin/users">Kullanıcı Yönetimi</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/admin/subscriptions" ? "active" : ""} to="/admin/subscriptions">Abonelikler</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/admin/predictions" ? "active" : ""} to="/admin/predictions">Tahmin Yönetimi</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/admin/messages" ? "active" : ""} to="/admin/messages">Mesajlar</Link>
                </li>
              </>
            ) : isLoggedIn ? (
              <>
                <li>
                  <Link className={location.pathname === "/" || location.pathname === "/home" ? "active" : ""} to="/home">Anasayfa</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/borsalar" ? "active" : ""} to="/borsalar">Borsalar</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/profil" ? "active" : ""} to="/profil">Profil</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/iletisim" ? "active" : ""} to="/iletisim">İletişim</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className={location.pathname === "/" || location.pathname === "/home" ? "active" : ""} to="/home">Anasayfa</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/hizmetler" ? "active" : ""} to="/hizmetler">Hizmetlerimiz</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/hakkimizda" ? "active" : ""} to="/hakkimizda">Hakkımızda</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/borsalar" ? "active" : ""} to="/borsalar">Borsalar</Link>
                </li>
                <li>
                  <Link className={location.pathname === "/iletisim" ? "active" : ""} to="/iletisim">İletişim</Link>
                </li>
              </>
            )}
          </ul>
          {/* Bildirim simgesi sadece admin olmayan girişli kullanıcıda gösterilsin */}
          {isLoggedIn && !isAdmin && (
            <div className="header-notification" ref={notifRef}>
              <button className="notification-btn" onClick={handleNotificationClick}>
                <i className="fas fa-bell"></i>
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">Bildirim yok</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        className="notification-item"
                        key={notif.id}
                        onClick={() => handleNotificationItemClick(notif.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <span>{notif.message}</span>
                        <span className="notification-date">{notif.created_at}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <button onClick={handleLoginLogout} className="header-btn">
            {isLoggedIn ? "Çıkış Yap" : "Giriş Yap"}
          </button>
        </nav>
        <button className="header-burger" onClick={() => setIsNavbarOpen((v) => !v)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Çıkış Yap"
        message="Çıkış yapmak istediğinizden emin misiniz?"
        type="warning"
        onConfirm={() => {
          handleLogout();
          closeModal();
        }}
      />
    </header>
  );
};

export default Header;