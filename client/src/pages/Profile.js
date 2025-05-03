import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import InfoSection from "../components/InfoSection";
import Footer from "../components/Footer";
import "./Profile.css";
import Modal from  "../components/Modal.js"
import { useNavigate } from "react-router-dom"; 
import Unauthorized from "../pages/Unauthorized"; 
import SubscriptionModal from "../components/SubscriptionModal";


const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    occupation: "",
  });

  const [unauthorized, setUnauthorized] = useState(false);
  
  const handleSubscriptionRedirect = () => {
    navigate("/", { state: { scrollTo: "subscription-plans" } }); 
  };

  const [profilePicture, setProfilePicture] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "",
    onConfirm: null, 
  });

  const openModal = (title, message, type, onConfirm) => {
    setModalData({ title, message, type, onConfirm });
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setModalData({ title: "", message: "", type: "", onConfirm: null });
  };

  
  const fetchProfileData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUnauthorized(true);
        return;
      }

      // Token decode ederek rol kontrolü
      let role = null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        role = payload.role;
      } catch {
        setUnauthorized(true);
        return;
      }
      if (role === "admin") {
        setUnauthorized(true);
        return;
      }

      // Kullanıcı bilgilerini çek
      const profileResponse = await fetch("http://localhost:5000/users/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          occupation: data.occupation || "",
        });
        setProfilePicture(data.profilePicture || "");
      } else {
        const errorData = await profileResponse.json();
        console.error("Profil API Hatası:", errorData);
        openModal(
          "Hata",
          errorData.error || "Kullanıcı bilgileri alınamadı.",
          "error"
        );
      }

      // Mevcut abonelikleri çek
      const subscriptionsResponse = await fetch("http://localhost:5000/subscriptions/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData);
      }

      // Bekleyen abonelik isteklerini çek
      const pendingRequestsResponse = await fetch("http://localhost:5000/subscriptions/requests/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (pendingRequestsResponse.ok) {
        const pendingRequestsData = await pendingRequestsResponse.json();
        setPendingRequests(pendingRequestsData.filter((req) => req.status === "beklemede"));
      }
    } catch (error) {
      setUnauthorized(true);
    }
  },[]);

 
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (unauthorized) {
    return <Unauthorized />;
  }

  // Abonelik oluştur butonu için handler
  const handleSubscriptionModalOpen = () => {
    setIsSubscriptionModalOpen(true);
  };

  const handleSubscriptionModalClose = () => {
    setIsSubscriptionModalOpen(false);
  };

  const handleSubscriptionSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/subscriptions/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: data.plan.key,
          market_type: data.plan.key,
          duration: data.subscriptionDuration,
        }),
      });
  
      if (response.ok) {
        setIsSubscriptionModalOpen(false);
        openModal("Başarılı", "Abonelik isteğiniz gönderildi!", "success");
        
        fetchProfileData(); // Yeni abonelik isteğini eklemek için profil verilerini yeniden çek
        
      } else {
        const errorData = await response.json();
        openModal("Hata", errorData.error || "Abonelik isteği gönderilemedi.", "error");
      }
    } catch (error) {
      openModal("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.", "error");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      // Dosya seçildiğinde otomatik olarak yükle
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:5000/users/upload-profile-picture", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setProfilePicture(data.profile_picture_url || ""); // Backend'den dönen URL'yi güncelle
          openModal(
            "Bilgilendirme",
            "Profil bilgileriniz başarıyla güncellendi!",
            "success"
          );
        } else {
          const errorData = await response.json();
          openModal(
            "Hata",
            "Bir hata oluştu",
            "warning"
          )
        }
      } catch (error) {
        openModal("Hata", "Bir hata oluştu. Lütfen sonra tekrar deneyin", "error");
      }
    } else {
      openModal(
        "Uyarı",
        "Lütfen bir dosya seçin.",
        "warning"
      )
    }
  };

  const handleRemove = async () => {
    try {
      const response = await fetch("http://localhost:5000/users/remove-profile-picture", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        openModal(
          "Başarılı",
          "Profil resmi başarıyla kaldırıldı!",
          "success"
        );
        setProfilePicture(""); // Profil resmini kaldır
        
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Bir hata oluştu.");
      }
    } catch (error) {
      console.error("Hata:", error.message || "Bir hata oluştu");
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          occupation: userData.occupation,
        }),
      });

      if (response.ok) {
        openModal(
          "Başarılı",
          "Profil bilgileri başarıyla güncellendi!",
          "success"
        );
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Bir hata oluştu.");
      }
    } catch (error) {
      console.error("Hata:", error.message || "Bir hata oluştu");
    }

    
  };

  
  // Abonelik isteği iptal
  const cancelPendingRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/subscriptions/requests/cancel/${requestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      if (response.ok) {
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId)); // Önce state'i güncelle
        openModal(
          "Başarılı",
          "Abonelik iptal isteği başarıyla alındı!",
          "success"
        );
      } else {
        const errorData = await response.json();
        openModal(
          "Hata",
          errorData.error || "Bir hata oluştu.",
          "error"
        );
      }
    } catch (error) {
      console.error("Hata:", error.message || "Bir hata oluştu");
    }
  };

  // Mevcut abonelik iptali

  const cancelSubscription = async (subscriptionId) => {
    try {
      const response = await fetch(`http://localhost:5000/subscriptions/cancel/${subscriptionId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      if (response.ok) {
        openModal(
          "Başarılı",
          "Abonelik iptali başarıyla alındı!",
          "success"
        );
        setSubscriptions((prev) =>
          prev.map((sub) =>
            sub.id === subscriptionId ? { ...sub, status: "iptal ediliyor" } : sub
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Bir hata oluştu.");
      }
    } catch (error) {
      console.error("Hata:", error.message || "Bir hata oluştu");
    }
  };

  return (
    <>
      <Header />
    <div className="profile-page">
      <main className="profile-main">
      <div className="profile-layout">
        {/* Sol taraf: Profil bilgileri */}
        <section className="profile-section">
          <div className="profile-container">
            <h2 className="profile-title">Profil Bilgileri</h2>
            <div className="profile-avatar">
              <div className="avatar-wrapper">
                <img
                  src={profilePicture || "/uploads/profile_pictures/profile-icon.png"}
                  alt="Profil Fotoğrafı"
                  className="avatar-img"
                />
                <div className="avatar-overlay">
                  <button className="avatar-button" onClick={() => document.getElementById("fileInput").click()}>
                    Değiştir
                  </button>
                  <button className="avatar-button" onClick={handleRemove}>
                    Kaldır
                  </button>
                </div>
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="profile-details">
              {isEditing ? (
                <>
                  <div className="detail-item">
                    <label className="detail-label">Ad:</label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) =>
                        setUserData({ ...userData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Soyad:</label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) =>
                        setUserData({ ...userData, lastName: e.target.value })
                      }
                    />
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Email:</label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                    />
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Telefon:</label>
                    <input
                      type="text"
                      value={userData.phoneNumber}
                      onChange={(e) =>
                        setUserData({ ...userData, phoneNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Meslek:</label>
                    <input
                      type="text"
                      value={userData.occupation}
                      onChange={(e) =>
                        setUserData({ ...userData, occupation: e.target.value })
                      }
                    />
                  </div>
                  <div className="detail-actions">
                    <button className="save-button" onClick={handleSave}>
                      Kaydet
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => setIsEditing(false)}
                    >
                      İptal
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Ad:</span>
                    <span className="detail-value">{userData.firstName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Soyad:</span>
                    <span className="detail-value">{userData.lastName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{userData.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Telefon:</span>
                    <span className="detail-value">{userData.phoneNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Meslek:</span>
                    <span className="detail-value">{userData.occupation}</span>
                  </div>
                  <button className="edit-button" onClick={handleEditToggle}>
                    Düzenle
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
        

        {/* Sağ taraf: Abonelik bilgileri */}
        
        <section className="subscriptions-section">
          <h2 className="subscriptions-title">Abonelik Durumları</h2>

          {/* Abonelik Oluştur Butonu */}
          <div className="create-subscription-container">
            <button
              className="create-subscription-button"
              onClick={handleSubscriptionModalOpen}
            >
              Abonelik Oluştur
            </button>
          </div>

          {/* Mevcut Abonelikler */}
          <div className="subscriptions-container">
            <h3>Mevcut Abonelikler</h3>
            {subscriptions.length === 0 ? (
              <p>Mevcut abonelik bulunmamaktadır.</p>
            ) : (
              <div className="subscriptions-grid">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="subscription-card">
                    <div className="subscription-icon">
                      <i className="fas fa-check-circle active-icon"></i>
                    </div>
                    <h3>{sub.type}</h3>
                    <p>Bitiş Tarihi: {new Date(sub.end_date).toLocaleDateString()}</p>
                    <p className="status-label">Durum: Aktif</p>
                    {/* İptal Et butonu kaldırıldı */}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bekleyen Abonelik İstekleri */}
          <div className="subscriptions-container">
            <h3>Bekleyen Abonelik İstekleri</h3>
            {pendingRequests.length === 0 ? (
              <p>Bekleyen abonelik isteği bulunmamaktadır.</p>
            ) : (
              <div className="subscriptions-grid">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="subscription-card">
                    <div className="subscription-icon">
                      <i className="fas fa-hourglass-half pending-icon"></i>
                    </div>
                    <h3>{req.type}</h3>
                    <p>Süre: {req.duration} gün</p>
                    <p className="status-label">Durum: Bekliyor</p>
                    <button
                      className="cancel-button"
                      onClick={() =>
                        openModal(
                          "Abonelik İsteği İptali",
                          `${req.type} abonelik isteğinizi iptal etmek istediğinizden emin misiniz?`,
                          "warning",
                          () => cancelPendingRequest(req.id)
                        )
                      }
                    >
                      İptal Et
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={handleSubscriptionModalClose}
          onSubmit={handleSubscriptionSubmit}
        />
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
          onConfirm={modalData.onConfirm}
        />
      </div>
      
    </main>
    
  </div>
  <InfoSection/>
  <Footer />
    </>
  );
};

export default Profile;