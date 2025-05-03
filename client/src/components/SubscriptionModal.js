import React, { useState, useEffect } from "react";
import "./Modal.css";

const SUBSCRIPTION_TYPES = [
  { key: "Borsa Istanbul", label: "Borsa Istanbul", color: "#007bff", basePrice: 199 },
  { key: "Kripto", label: "Kripto", color: "#28a745", basePrice: 399 },
  { key: "Forex", label: "Forex", color: "#ff9800", basePrice: 999 },
];

const SubscriptionModal = ({ isOpen, onClose, onSubmit, plan }) => {
  const [selectedType, setSelectedType] = useState(SUBSCRIPTION_TYPES[0]);
  const [subscriptionDuration, setSubscriptionDuration] = useState(30);
  const [discountCode, setDiscountCode] = useState("");
  const [finalPrice, setFinalPrice] = useState(selectedType.basePrice);

  useEffect(() => {
    if (plan) {
      // Eğer plan objesi geldiyse, SUBSCRIPTION_TYPES içinden eşleşeni bul
      const found = SUBSCRIPTION_TYPES.find((t) => t.key === plan.name || t.key === plan.key);
      setSelectedType(found || SUBSCRIPTION_TYPES[0]);
    } else {
      setSelectedType(SUBSCRIPTION_TYPES[0]);
    }
  }, [plan]);

  useEffect(() => {
    setFinalPrice(selectedType.basePrice * (subscriptionDuration / 30));
  }, [subscriptionDuration, selectedType]);

  if (!isOpen) return null;

  const handleTypeChange = (e) => {
    const type = SUBSCRIPTION_TYPES.find((t) => t.key === e.target.value);
    setSelectedType(type);
  };

  const handleDurationChange = (e) => {
    setSubscriptionDuration(parseInt(e.target.value));
  };

  const handleDiscountCodeChange = (e) => {
    setDiscountCode(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit({
      plan: selectedType,
      subscriptionDuration,
      discountCode,
      finalPrice,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header" style={{ backgroundColor: selectedType.color }}>
          <h3>{selectedType.label} Aboneliği</h3>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>Abonelik Türü:</p>
          <select value={selectedType.key} onChange={handleTypeChange}>
            {SUBSCRIPTION_TYPES.map((type) => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>

          <p>Abonelik Süresi:</p>
          <select value={subscriptionDuration} onChange={handleDurationChange}>
            <option value={30}>1 Ay</option>
            <option value={90}>3 Ay</option>
            <option value={180}>6 Ay</option>
            <option value={365}>1 Yıl</option>
          </select>

          <p>İndirim Kodu:</p>
          <input
            type="text"
            value={discountCode}
            onChange={handleDiscountCodeChange}
            placeholder="İndirim kodu girin"
          />

          <p>Toplam Fiyat: ₺{finalPrice.toFixed(2)}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button" onClick={handleSubmit}>
            Abonelik İsteği Gönder
          </button>
          <button className="modal-button cancel-button" onClick={onClose}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;