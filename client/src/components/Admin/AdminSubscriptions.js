import React, { useEffect, useState } from "react";
import "./AdminSubscriptions.css";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Modal from "../../components/Modal";
import Unauthorized from "../../pages/Unauthorized";

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsRequests, setSubscriptionsRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");
  const [unauthorized, setUnauthorized] = useState(false);
 
  
  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/subscriptions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 403 || response.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Abonelik verileri alınamadı.");
      }

      const data = await response.json();
      setSubscriptions(data || []); 
    } catch (err) {
      setError(`Abonelik verileri alınamadı: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchPendingSubscriptions();
    
  }, []);

  const fetchPendingSubscriptions = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/subscriptions/requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 403 || response.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Bekleyen abonelik talepleri alınamadı.");
      }

      const data = await response.json();
      setSubscriptionsRequests(data || []); // Boş listeyi ele al
    } catch (err) {
      setError(`Bekleyen abonelik talepleri alınamadı: ${err.message}`);
    }
  };

  const updateSubscriptionStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/subscriptions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }), // 'onaylandı' veya 'reddedildi'
      });

      if (response.status === 403 || response.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Abonelik durumu güncellenemedi.");
      }

      // Bekleyenlerden çıkar
      setSubscriptionsRequests((prev) => prev.filter((sub) => sub.id !== id));

      if (status === "onaylandı") {
        // Doğru ve güncel abonelik bilgileri için tekrar fetch et
        await fetchSubscriptions();
        setModalType("success");
        setModalMessage("Abonelik başarıyla onaylandı ve mevcut aboneliklere eklendi!");
      } else {
        setModalType("success");
        setModalMessage("Abonelik isteği reddedildi ve listeden kaldırıldı.");
      }
      setModalOpen(true);
    } catch (error) {
      setModalType("error");
      setModalMessage(`Bir hata oluştu: ${error.message}`);
      setModalOpen(true);
    }
  };

  if (unauthorized) {
    return <Unauthorized />;
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  

  return (
    <>
      <Header />
    <div className="admin-subscriptions">
      <h2>Abonelik Yönetimi</h2>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "success" ? "Başarılı" : "Hata"}
        message={modalMessage}
        type={modalType}
      />

      {/* Bekleyen Abonelik Talepleri */}
      <div className="pending-requests">
        <h3>Bekleyen Abonelik Talepleri</h3>
        {subscriptionsRequests.length === 0 ? (
          <p>Bekleyen abonelik talebi bulunmamaktadır.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Tür</th>
                <th>Pazar Türü</th>
                <th>Süre</th>
                <th>İstek Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionsRequests.map((sub) => {
                const createdAt = new Date(sub.created_at);
                return (
                  <tr key={sub.id}>
                    <td>{`${sub.first_name} ${sub.last_name}`}</td>
                    <td>{sub.type}</td>
                    <td>{sub.market_type}</td>
                    <td>{sub.duration} gün</td>
                    <td>{createdAt.toLocaleDateString()}</td>
                    <td>
                      <button
                        className="approve-button"
                        onClick={() => updateSubscriptionStatus(sub.id, "onaylandı")}
                      >
                        Onayla
                      </button>
                      <button
                        className="reject-button"
                        onClick={() => updateSubscriptionStatus(sub.id, "reddedildi")}
                      >
                        Reddet
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mevcut Abonelikler */}
      <div className="current-subscriptions">
        <h3>Mevcut Abonelikler</h3>
        {subscriptions.length === 0 ? (
          <p>Mevcut abonelik bulunmamaktadır.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Email</th>
                <th>Borsa</th>
                <th>Başlangıç Tarihi</th>
                <th>Bitiş Tarihi</th>
                <th>Kalan Gün</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>{`${sub.first_name} ${sub.last_name}`}</td>
                  <td>{sub.email}</td>
                  <td>{sub.market_type}</td>
                  <td>{new Date(sub.start_date).toLocaleDateString()}</td>
                  <td>{new Date(sub.end_date).toLocaleDateString()}</td>
                  <td>{sub.remaining_days !== null ? sub.remaining_days : "Belirtilmemiş"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  );
};

export default AdminSubscriptions;