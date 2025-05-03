import React, { useEffect, useState } from "react";
import "./AdminMessages.css";
import Header from "../../components/Header";
import Modal from "../../components/Modal";
import Unauthorized from "../../pages/Unauthorized";

const TABS = [
  { key: "inbox", label: "Gelen Kutusu" },
  { key: "read", label: "Okunanlar" },
  { key: "deleted", label: "Silinenler" },
];

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: "", message: "", type: "info" });
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
    } catch {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/messages", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          setUnauthorized(true);
          setLoading(false);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (!unauthorized) {
          setMessages(data);
          setLoading(false);
        }
      });
  }, []);

  // Okundu olarak işaretle
  const markAsRead = async (id) => {
    await fetch(`http://localhost:5000/api/messages/${id}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, is_read: true } : msg
      )
    );
  };

  // Soft delete (silinenlere taşı)
  const deleteMessage = async (id) => {
    await fetch(`http://localhost:5000/api/messages/${id}/delete`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, is_deleted: true } : msg
      )
    );
    setSelectedMessage(null);
    setModalData({ title: "Başarılı", message: "Mesaj silindi.", type: "success" });
    setModalOpen(true);
  };

  // Geri yükle (silinenlerden çıkar)
  const restoreMessage = async (id) => {
    await fetch(`http://localhost:5000/api/messages/${id}/restore`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, is_deleted: false } : msg
      )
    );
    setSelectedMessage(null);
    setModalData({ title: "Başarılı", message: "Mesaj geri yüklendi.", type: "success" });
    setModalOpen(true);
  };

  // Tab'a göre filtrele
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === "inbox") return !msg.is_read && !msg.is_deleted;
    if (activeTab === "read") return msg.is_read && !msg.is_deleted;
    if (activeTab === "deleted") return msg.is_deleted;
    return false;
  });

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    if (activeTab === "inbox" && !msg.is_read) {
      markAsRead(msg.id);
    }
  };
  if (unauthorized) return <Unauthorized />;
  if (loading) return <div className="admin-messages-loading">Yükleniyor...</div>;
  
  return (
    <>
      <Header />
      <div className="admin-messages-container">
        <div className="admin-messages-list">
          <div className="admin-messages-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedMessage(null);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ul>
            {filteredMessages.length === 0 && (
              <li className="admin-message-empty">Bu bölümde mesaj yok.</li>
            )}
            {filteredMessages.map((msg) => (
              <li
                key={msg.id}
                className={`admin-message-item${msg.is_read ? " read" : ""}${selectedMessage && selectedMessage.id === msg.id ? " selected" : ""}`}
                onClick={() => handleSelectMessage(msg)}
              >
                <span className="msg-sender">{msg.name}</span>
                <span className="msg-subject">{msg.subject}</span>
                <span className="msg-date">{new Date(msg.created_at).toLocaleString()}</span>
                {!msg.is_read && !msg.is_deleted && <span className="msg-unread-dot" />}
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-messages-detail">
          {selectedMessage ? (
            <div className="admin-message-detail-card">
              <div className="msg-detail-header">
                <div>
                  <b>Konu:</b> {selectedMessage.subject}
                </div>
                {activeTab !== "deleted" ? (
                  <button className="msg-delete-btn" onClick={() => deleteMessage(selectedMessage.id)}>
                    Sil
                  </button>
                ) : (
                  <button className="msg-restore-btn" onClick={() => restoreMessage(selectedMessage.id)}>
                    Geri Yükle
                  </button>
                )}
              </div>
              <div>
                <b>Gönderen:</b> {selectedMessage.name} ({selectedMessage.email})
              </div>
              <div>
                <b>Tarih:</b> {new Date(selectedMessage.created_at).toLocaleString()}
              </div>
              <div className="msg-detail-content">
                {selectedMessage.message}
              </div>
            </div>
          ) : (
            <div className="admin-message-detail-empty">Bir mesaj seçin</div>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />
    </>
  );
};

export default AdminMessages;