import React from "react";
import "./Modal.css";

const Modal = ({ isOpen, onClose, title, message, type, onConfirm }) => {
  if (!isOpen) return null;

  // Simgeyi belirlemek için bir fonksiyon
  const getIcon = () => {
    switch (type) {
      case "success":
        return <i className="modal-icon success-icon fas fa-check-circle"></i>;
      case "error":
        return <i className="modal-icon error-icon fas fa-times-circle"></i>;
      case "warning":
        return <i className="modal-icon warning-icon fas fa-exclamation-circle"></i>;
      case "info":
      default:
        return <i className="modal-icon info-icon fas fa-info-circle"></i>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className={`modal-header ${type}`}>
          {getIcon()}
          <h3>{title}</h3>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          {onConfirm ? (
            <>
              <button className="modal-button" onClick={onConfirm}>
                Onayla
              </button>
              <button className="cancel-button" onClick={onClose}>
                İptal
              </button>
            </>
          ) : (
            <button className="modal-button" onClick={onClose}>
              Tamam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;