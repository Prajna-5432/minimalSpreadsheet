import React from 'react';
import { useAddRow } from '../hooks/useApi';
import './AddRowButton.css';

const AddRowButton = () => {
  const createRowMutation = useAddRow();

  const handleAddRow = () => {
    createRowMutation.mutate();
  };

  return (
    <div className="add-row-container">
      <button 
        onClick={handleAddRow} 
        className="add-row-btn"
        disabled={createRowMutation.isPending}
      >
        {createRowMutation.isPending ? (
          <>
            <span className="btn-spinner"></span>
            Adding...
          </>
        ) : (
          <>
            <span className="btn-icon">+</span>
            Add Row
          </>
        )}
      </button>
      {createRowMutation.error && (
        <div className="add-row-error">
          {createRowMutation.error.message || 'Failed to add row. Please try again.'}
        </div>
      )}
    </div>
  );
};

export default AddRowButton;
