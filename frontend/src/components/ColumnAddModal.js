import React, { useState } from 'react';
import { useAddColumn } from '../hooks/useApi';
import './ColumnAddModal.css';

const ColumnAddModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    data_type: 'text',
    options: []
  });
  
  const createColumnMutation = useAddColumn();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Submitting column form:', formData);
    
    if (!formData.name.trim()) {
      alert('Column name is required');
      return;
    }

    if ((formData.data_type === 'single_select' || formData.data_type === 'multi_select') && formData.options.length === 0) {
      alert('At least one option is required for select types');
      return;
    }

    console.log('Calling createColumnMutation.mutate...');
    createColumnMutation.mutate(formData, {
      onSuccess: (data) => {
        console.log('Column created successfully:', data);
        setFormData({ name: '', data_type: 'text', options: [] });
        if (onSuccess) onSuccess(data);
        onClose();
        // Don't auto-refresh, let React Query handle the update
      },
      onError: (error) => {
        console.error('Error creating column:', error);
        alert('Error creating column: ' + (error.message || 'Unknown error'));
      }
    });
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { label: '', value: '' }]
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Column</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="column-name">Column Name</label>
            <input
              id="column-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter column name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="data-type">Column Type</label>
            <select
              id="data-type"
              value={formData.data_type}
              onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value }))}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="datetime">Date/Time</option>
              <option value="single_select">Single Select</option>
              <option value="multi_select">Multi Select</option>
            </select>
          </div>

          {(formData.data_type === 'single_select' || formData.data_type === 'multi_select') && (
            <div className="form-group">
              <label>Options</label>
              {formData.options.map((option, index) => (
                <div key={index} className="option-input">
                  <input
                    type="text"
                    placeholder="Label"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="remove-option"
                    onClick={() => handleRemoveOption(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-option"
                onClick={handleAddOption}
              >
                Add Option
              </button>
            </div>
          )}

          {createColumnMutation.error && (
            <div className="error-message">
              {createColumnMutation.error.message}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createColumnMutation.isPending}
            >
              {createColumnMutation.isPending ? 'Adding...' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColumnAddModal;
