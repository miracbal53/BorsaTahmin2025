import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SubscriptionModal from "./SubscriptionModal";
import Modal from "./Modal";
import "./SubscriptionPlans.css";

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "",
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const navigate = useNavigate();
  const subscriptionPageRef = useRef(null);

  // Abonelik planları
  const plans = [
    {
      id: 1,
      name: "Borsa Istanbul",
      basePrice: 199,
      period: "aylık",
      features: [
        "BIST piyasası analizleri",
        "Gerçek zamanlı BIST verileri",
        "20 adet hisse takibi",
        "Gelişmiş teknik göstergeler",
        "Özel alım-satım sinyalleri",
      ],
      color: "#3498db",
    },
    {
      id: 2,
      name: "Kripto",
      basePrice: 399,
      period: "aylık",
      features: [
        "Kripto piyasası analizleri",
        "Gerçek zamanlı kripto verileri",
        "20 adet kripto takibi",
        "Standart teknik göstergeler",
        "E-posta bildirimleri",
        "7/24 öncelikli destek",
      ],
      color: "#2ecc71",
      popular: true,
    },
    {
      id: 3,
      name: "Forex",
      basePrice: 999,
      period: "aylık",
      features: [
        "Forex piyasası analizleri",
        "Sınırsız döviz çifti takibi",
        "Yapay zeka destekli analizler",
        "Özel portföy yönetimi",
        "Kişiselleştirilmiş danışmanlık",
        "API erişimi",
        "7/24 VIP destek",
      ],
      color: "#9b59b6",
    },
  ];

  useEffect(() => {
    const fetchUserSubscriptions = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/subscriptions/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data);
        }

        const pendingResponse = await fetch("http://localhost:5000/subscriptions/requests", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingRequests(pendingData);
        }
      } catch (error) {
        console.error("Abonelikler alınırken hata oluştu:", error.message);
      }
    };

    fetchUserSubscriptions();
  }, [navigate]);

  const handlePlanSelect = (plan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setModalData({
        isOpen: true,
        title: "Giriş Yapılmadı",
        message: "Lütfen giriş yapın.",
        type: "error",
      });
      navigate("/login");
      return;
    }
    setSelectedPlan(plan); 
    setShowModal(true);
  };

  const handleSubscriptionSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setModalData({
          isOpen: true,
          title: "Giriş Yapılmadı",
          message: "Lütfen giriş yapın.",
          type: "error",
        });
        return;
      }

      const requestBody = {
        type: data.plan.key,
        market_type: data.plan.key,
        duration: data.subscriptionDuration,
        // discountCode: data.discountCode,
      };

      const response = await fetch("http://localhost:5000/subscriptions/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setModalData({
          isOpen: true,
          title: "Başarılı",
          message: "Abonelik talebi başarıyla oluşturuldu! Admin onayı bekleniyor.",
          type: "success",
        });
        setPendingRequests((prev) => [
          ...prev,
          {
            type: data.plan.key,
            market_type: data.plan.key,
            duration: data.subscriptionDuration,
          },
        ]);
      } else {
        const errorData = await response.json();
        setModalData({
          isOpen: true,
          title: "Hata",
          message: errorData.error || "Bir hata oluştu.",
          type: "error",
        });
      }
    } catch (error) {
      setModalData({
        isOpen: true,
        title: "Hata",
        message: "Bir hata oluştu, lütfen tekrar deneyin.",
        type: "error",
      });
    } finally {
      setShowModal(false);
    }
  };

  const isPending = (plan) =>
    pendingRequests.some(
      (req) => req.type === plan.name && req.market_type === plan.name
    );

  const isSubscribed = (plan) =>
    subscriptions.some((sub) => sub.type === plan.name);

  return (
    <div ref={subscriptionPageRef} className="subscription-section">
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubscriptionSubmit}
        plan={selectedPlan}
      />

      {/* Bilgilendirme Modalı */}
      <Modal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, title: "", message: "", type: "" })}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />

      <div className="container">
        <div className="subscription-header">
          <h2>Abonelik Planları</h2>
          <p>Size en uygun planı seçin ve finansal dünyayı yakından takip edin</p>
        </div>

        <div className="subscription-plans">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={"plan-card " + (plan.popular ? "popular" : "")}
              style={{ "--plan-color": plan.color }}
            >
              {plan.popular && <div className="popular-badge">En Popüler</div>}
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">₺</span>
                  <span className="amount">{plan.basePrice}</span>
                  <span className="period">/{plan.period}</span>
                </div>
              </div>

              <div className="plan-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <i className="fas fa-check"></i>
                    {feature}
                  </div>
                ))}
              </div>

              {isSubscribed(plan) ? (
                <button className="plan-button selected" disabled>
                  Mevcut Abonelik
                </button>
              ) : isPending(plan) ? (
                <button className="plan-button" disabled>
                  Bekliyor
                </button>
              ) : (
                <button className="plan-button" onClick={() => handlePlanSelect(plan)}>
                  Planı Seç
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;