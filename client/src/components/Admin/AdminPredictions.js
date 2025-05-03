import React, { useEffect, useState } from "react";
import Header from "../Header";
import "./AdminPredictions.css";
import Modal from "../Modal";
import Unauthorized from "../../pages/Unauthorized";

const marketData = {
  bist: [
    { symbol: "THYAO", type: "BIST" },
    { symbol: "GARAN", type: "BIST" },
    { symbol: "ASELS", type: "BIST" },
    { symbol: "SISE", type: "BIST" },
    { symbol: "KRDMD", type: "BIST" },
    { symbol: "EREGL", type: "BIST" },
    { symbol: "AKBNK", type: "BIST" },
    { symbol: "YKBNK", type: "BIST" },
  ],
  crypto: [
    { symbol: "BTC", type: "Kripto" },
    { symbol: "ETH", type: "Kripto" },
    { symbol: "BNB", type: "Kripto" },
    { symbol: "SOL", type: "Kripto" },
    { symbol: "ADA", type: "Kripto" },
    { symbol: "AVAX", type: "Kripto" },
    { symbol: "DOT", type: "Kripto" },
    { symbol: "MATIC", type: "Kripto" },
  ],
  forex: [
    { symbol: "USD/TRY", type: "Forex" },
    { symbol: "EUR/TRY", type: "Forex" },
    { symbol: "GBP/TRY", type: "Forex" },
    { symbol: "EUR/USD", type: "Forex" },
    { symbol: "GBP/USD", type: "Forex" },
    { symbol: "USD/JPY", type: "Forex" },
    { symbol: "XAU/USD", type: "Forex" },
    { symbol: "XAG/USD", type: "Forex" },
  ],
};

function toDbSymbol(symbol, type) {
  if (type === "BIST") return symbol + ".IS";
  if (type === "Kripto") return symbol + "/USDT";
  return symbol;
}

function toFrontendSymbol(dbSymbol, type) {
  if (type === "BIST" && dbSymbol.endsWith(".IS")) return dbSymbol.replace(".IS", "");
  if (type === "Kripto" && dbSymbol.endsWith("/USDT")) return dbSymbol.replace("/USDT", "");
  return dbSymbol;
}

const allSymbolOptions = [
  ...marketData.bist.map((item) => ({ symbol: item.symbol, type: item.type })),
  ...marketData.crypto.map((item) => ({ symbol: item.symbol, type: item.type })),
  ...marketData.forex.map((item) => ({ symbol: item.symbol, type: item.type })),
];

const AdminPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [selected, setSelected] = useState(allSymbolOptions[0]);
  const [adminPrediction, setAdminPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [updatedSymbols, setUpdatedSymbols] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);


  // Sıralama state'i
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(() => {
      fetchPredictions();
    }, 300000); // 5 dakika
    return () => clearInterval(interval);
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    const response = await fetch("http://localhost:5000/admin/predictions", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (response.status === 403 || response.status === 401) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    const data = await response.json();
    setPredictions(data);
    setLoading(false);
  };

  // Sıralama ve arama fonksiyonu
  const getSortedPredictions = () => {
    let sorted = [...predictions];
    if (searchTerm) {
      sorted = sorted.filter((pred) =>
        toFrontendSymbol(pred.symbol, pred.type)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    if (!sortConfig.key) return sorted;

    sorted.sort((a, b) => {
      if (sortConfig.key === "symbol") {
        const aVal = toFrontendSymbol(a.symbol, a.type);
        const bVal = toFrontendSymbol(b.symbol, b.type);
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      }
      if (sortConfig.key === "ai_updated_at" || sortConfig.key === "admin_updated_at") {
        const aDate = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
        const bDate = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });
    return sorted;
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Aynı sütuna tekrar tıklandıysa yönü değiştir
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Yeni sütuna tıklandıysa varsayılan yönü belirle
      let defaultDirection = "asc";
      if (key === "ai_updated_at" || key === "admin_updated_at") defaultDirection = "desc";
      return { key, direction: defaultDirection };
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <span style={{ marginLeft: 4, fontSize: 13 }}>▲</span>
    ) : (
      <span style={{ marginLeft: 4, fontSize: 13 }}>▼</span>
    );
  };

  // Tahmin ekle/güncelle (formdan)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.symbol || adminPrediction === "") return;

    setLoading(true);
    const dbSymbol = toDbSymbol(selected.symbol, selected.type);
    const response = await fetch("http://localhost:5000/predictions/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        symbol: dbSymbol,
        type: selected.type,
        admin_prediction: adminPrediction,
      }),
    });
    if (response.ok) {
      setAdminPrediction("");
      fetchPredictions();
      setModalType("success");
      setModalMessage("Uzman tahmini başarıyla kaydedildi!");
      setModalOpen(true);
    } else {
      setModalType("error");
      setModalMessage("Tahmin kaydedilemedi. Lütfen tekrar deneyin.");
      setModalOpen(true);
    }
    setLoading(false);
  };

  // Tablo içi düzenleme
  const handleEditClick = (pred) => {
    setEditId(pred.id);
    setEditValue(pred.admin_prediction !== null ? Number(pred.admin_prediction).toFixed(2) : "");
  };

  const handleEditSave = async (pred) => {
    setLoading(true);
    const response = await fetch("http://localhost:5000/predictions/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        symbol: pred.symbol,
        type: pred.type,
        admin_prediction: editValue,
      }),
    });
    if (response.ok) {
      setEditId(null);
      setEditValue("");
      fetchPredictions();
      setModalType("success");
      setModalMessage("Uzman tahmini başarıyla güncellendi!");
      setModalOpen(true);
    } else {
      setModalType("error");
      setModalMessage("Tahmin güncellenemedi. Lütfen tekrar deneyin.");
      setModalOpen(true);
    }
    setLoading(false);
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditValue("");
  };

  const formatPrediction = (val) =>
    val !== null && val !== undefined ? Number(val).toFixed(2) : "-";

  // AI tahminlerini topluca güncelle
  const handleUpdateAIPredictions = async () => {
    setAiLoading(true);
    const updated = [];
    for (const opt of allSymbolOptions) {
      const dbSymbol = toDbSymbol(opt.symbol, opt.type);
      try {
        const response = await fetch("http://localhost:5000/predictions/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            symbol: dbSymbol,
            type: opt.type,
          }),
        });
        if (response.ok) {
          updated.push(opt.symbol + " (" + opt.type + ")");
        }
      } catch (err) {
        // Hata olursa atla
      }
    }
    setUpdatedSymbols(updated);
    setAiModalOpen(true);
    setAiLoading(false);
    fetchPredictions();
  };

  if (unauthorized) {
    return <Unauthorized />;
  }

  return (
    <>
      <Header />
    <div className="admin-predictions">
      <h2>Tahmin Yönetimi</h2>
      
      <div className="modern-form-card">
        <div className="admin-card-title">Tahmin Ekle/Güncelle</div>
        <form className="modern-admin-form" onSubmit={handleSubmit}>
          <div className="modern-form-group">
            <label htmlFor="symbol-select">Sembol</label>
            <select
              id="symbol-select"
              value={selected.symbol + "|" + selected.type}
              onChange={(e) => {
                const [symbol, type] = e.target.value.split("|");
                setSelected({ symbol, type });
              }}
              disabled={loading}
            >
              {allSymbolOptions.map((opt) => (
                <option key={opt.symbol + "|" + opt.type} value={opt.symbol + "|" + opt.type}>
                  {opt.symbol} ({opt.type})
                </option>
              ))}
            </select>
          </div>
          <div className="modern-form-group">
            <label htmlFor="admin-prediction-input">Uzman Tahmini</label>
            <div className="modern-input-btn-group">
              <input
                id="admin-prediction-input"
                type="number"
                step="0.01"
                value={adminPrediction}
                onChange={(e) => setAdminPrediction(e.target.value)}
                placeholder="Tahmin giriniz"
                disabled={loading}
              />
              <button
                type="submit"
                className="modern-big-save-btn"
                disabled={loading || !selected.symbol || adminPrediction === ""}
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div className="admin-table-title">Tahminler Tablosu</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ maxWidth: 180 }}>
              <input
                type="text"
                placeholder="Sembol ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
        
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  width: "100%",
                  maxWidth: 250,
                  boxSizing: "border-box"
                }}
              />
            </div>
            <button
              className="ai-update-btn"
              onClick={handleUpdateAIPredictions}
              disabled={aiLoading}
            >
              {aiLoading ? "AI Tahminleri Güncelleniyor..." : "AI Tahminlerini Güncelle"}
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("symbol")}
              >
                Sembol {renderSortArrow("symbol")}
              </th>
              <th>Piyasa Türü</th>
              <th>AI Tahmini</th>
              <th>Uzman Tahmini</th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("ai_updated_at")}
              >
                AI Tahmin Tarihi {renderSortArrow("ai_updated_at")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("admin_updated_at")}
              >
                Uzman Tahmin Tarihi {renderSortArrow("admin_updated_at")}
              </th>
            </tr>
          </thead>
          <tbody>
            {getSortedPredictions().map((pred) => (
              <tr key={pred.id}>
                <td data-label="Sembol">{toFrontendSymbol(pred.symbol, pred.type)}</td>
                <td data-label="Piyasa Türü">{pred.type}</td>
                <td data-label="AI Tahmini">{formatPrediction(pred.ai_prediction)}</td>
                <td data-label="Uzman Tahmini">
                  {editId === pred.id ? (
                    <span className="edit-cell-active">
                      <input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ width: 100, marginRight: 4 }}
                        autoFocus
                      />
                      <button
                        className="edit-save-btn"
                        onClick={() => handleEditSave(pred)}
                        disabled={loading || editValue === ""}
                        title="Kaydet"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        className="edit-cancel-btn"
                        onClick={handleEditCancel}
                        title="İptal"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {formatPrediction(pred.admin_prediction)}
                      <button
                        className="edit-btn"
                        onClick={() => handleEditClick(pred)}
                        title="Düzenle"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#007bff",
                          padding: 0,
                          marginLeft: 4,
                          fontSize: 16,
                        }}
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                    </span>
                  )}
                </td>
                <td data-label="AI Tahmin Tarihi">
                  {pred.ai_updated_at
                    ? new Date(pred.ai_updated_at).toLocaleString()
                    : "-"}
                </td>
                <td data-label="Uzman Tahmin Tarihi">
                  {pred.admin_updated_at
                    ? new Date(pred.admin_updated_at).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI toplu güncelleme modalı */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Tahminleri Güncellendi"
        message={
          updatedSymbols.length > 0
            ? (
                <div>
                  <b>Güncellenen Semboller:</b>
                  <ul style={{ marginTop: 8 }}>
                    {updatedSymbols.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )
            : "Hiçbir sembol için AI tahmini güncellenemedi."
        }
        type="success"
      />

      {/* Admin tahmini ekle/güncelle modalı */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "success" ? "Başarılı" : "Hata"}
        message={modalMessage}
        type={modalType}
      />
    </div>
    </>
  );
};

export default AdminPredictions;