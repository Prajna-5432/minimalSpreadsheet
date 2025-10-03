import React from 'react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemName, 
  itemType = 'item',
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <div className="delete-modal-header">
          <h3>{title}</h3>
          <button 
            className="delete-modal-close" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="delete-modal-body">
          <div className="delete-modal-icon">
            ⚠️
          </div>
          <p className="delete-modal-message">
            {message}
          </p>
          {itemName && (
            <div className="delete-modal-item">
              <strong>{itemType}:</strong> {itemName}
            </div>
          )}
        </div>
        
        <div className="delete-modal-footer">
          <button 
            className="delete-modal-cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="delete-modal-confirm"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
