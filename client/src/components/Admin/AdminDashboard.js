import React, { useEffect, useState } from "react";
import Header from "../Header";
import "./AdminDashboard.css";
import Unauthorized from "../../pages/Unauthorized";

const AdminDashboard = () => {
  const [unauthorized, setUnauthorized] = useState(false);
  const [messageStats, setMessageStats] = useState({ total_messages: 0, unread_messages: 0 });
  const formatSubscription = (subscription) => {
    if (!subscription) return "";

    const match = subscription.match(/^([a-zA-Z]+)(\d+)$/); // Örneğin: Forex1
    if (match) {
      return `${match[1]}-${match[2]}`; // Forex-1
    }
    return subscription;
  };
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingSubscriptions: 0,
    approvedSubscriptions: 0,
    mostPopularSubscription: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token bulunamadı. Lütfen giriş yapın.");
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Toplam kullanıcı sayısını al
        const usersResponse = await fetch("http://localhost:5000/admin/stats/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (usersResponse.status === 403  || usersResponse.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!usersResponse.ok) {
          throw new Error(`Kullanıcı istatistikleri alınamadı: ${usersResponse.status}`);
        }

        const usersData = await usersResponse.json();

        // Bekleyen abonelik taleplerini al
        const pendingSubscriptionsResponse = await fetch(
          "http://localhost:5000/admin/stats/subscriptions",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (pendingSubscriptionsResponse.status === 403 || pendingSubscriptionsResponse.status === 401) {
          setUnauthorized(true);
          return;
        }


        if (!pendingSubscriptionsResponse.ok) {
          throw new Error(
            `Abonelik talepleri alınamadı: ${pendingSubscriptionsResponse.status}`
          );
        }

        const pendingSubscriptionsData = await pendingSubscriptionsResponse.json();

        // Onaylanmış abonelik taleplerini al
        const approvedSubscriptionsResponse = await fetch(
          "http://localhost:5000/admin/stats/active_subscriptions",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (approvedSubscriptionsResponse.status === 403 || approvedSubscriptionsResponse.status === 401) {
          setUnauthorized(true);
          return;
        }

        if (!approvedSubscriptionsResponse.ok) {
          throw new Error(
            `Onaylanmış abonelik talepleri alınamadı: ${approvedSubscriptionsResponse.status}`
          );
        }

        const approvedSubscriptionsData = await approvedSubscriptionsResponse.json();

        // En popüler abonelik türünü al
        const mostPopularSubscriptionResponse = await fetch(
          "http://localhost:5000/admin/stats/favorite_subscriptions",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (mostPopularSubscriptionResponse.status === 403 || mostPopularSubscriptionResponse.status === 401) {
          setUnauthorized(true);
          return;
        }

        if (!mostPopularSubscriptionResponse.ok) {
          throw new Error(
            `En popüler abonelik türü alınamadı: ${mostPopularSubscriptionResponse.status}`
          );
        }

        const mostPopularSubscriptionData = await mostPopularSubscriptionResponse.json();
        
        const messagesStatsResponse = await fetch(
          "http://localhost:5000/api/messages/stats",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (messagesStatsResponse.status === 403 || messagesStatsResponse.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!messagesStatsResponse.ok) {
          throw new Error(
            `Mesaj istatistikleri alınamadı: ${messagesStatsResponse.status}`
          );
        }
        const messagesStatsData = await messagesStatsResponse.json();

        // ...mevcut setStats...
        setMessageStats(messagesStatsData);

        // İstatistikleri güncelle
        setStats({
          totalUsers: usersData.total_users,
          pendingSubscriptions: pendingSubscriptionsData.pending_subscriptions,
          approvedSubscriptions: approvedSubscriptionsData.approved_subscriptions,
          mostPopularSubscription: formatSubscription(mostPopularSubscriptionData.favorite_subscriptions),
        });


      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (unauthorized) {
    return <Unauthorized />;
  }

  return (
    <>
      <Header />
    <div className="admin-dashboard">
      <h1>GENEL İSTATİSTİKLER</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Toplam Kullanıcı</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Bekleyen Abonelik Talepleri</h3>
          <p>{stats.pendingSubscriptions}</p>
        </div>
        <div className="stat-card">
          <h3>En Popüler Abonelik Türü</h3>
          <p>{stats.mostPopularSubscription}</p>
        </div>
        <div className="stat-card">
          <h3>Abonelik Sayısı</h3>
          <p>{stats.approvedSubscriptions}</p>
        </div>
        <div className="stat-card">
            <h3>Toplam Mesaj</h3>
            <p>{messageStats.total_messages}</p>
          </div>
          <div className="stat-card">
            <h3>Okunmamış Mesaj</h3>
            <p>{messageStats.unread_messages}</p>
          </div>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;