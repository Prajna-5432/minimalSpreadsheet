import React, { useState, useEffect } from 'react';
import { useUpdateCell } from '../hooks/useApi';
import './InlineCell.css';

const InlineCell = ({ row, column, value }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');
  
  const updateCellMutation = useUpdateCell();


  // Initialize display value
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatDisplayValue(value, column.column_type));
      setEditValue(value);
    } else {
      setDisplayValue('');
      setEditValue('');
    }
  }, [value, column.column_type]);

  const formatDisplayValue = (val, type) => {
    if (val === null || val === undefined) return '';
    
    switch (type) {
      case 'datetime':
        return new Date(val).toLocaleString();
      case 'multi_select':
        if (Array.isArray(val) && val.length > 0) {
          // Convert option IDs to skill names
          const skillNames = val.map(id => {
            const option = column.options?.find(opt => opt.id === id);
            return option ? option.label : id;
          });
          return skillNames.join(', ');
        }
        return 'Click to select skills';
      case 'single_select':
        // Find the option label for the selected value
        if (!column.options || column.options.length === 0) {
          return 'No options available';
        }
        const option = column.options.find(opt => 
          opt.id == val || 
          opt.id === parseInt(val) || 
          parseInt(opt.id) === parseInt(val)
        );
        return option ? option.label : String(val);
      default:
        return String(val);
    }
  };

  const handleCellClick = () => {
    if (column.column_type === 'multi_select') {
      // For multi-select, toggle editing mode
      setIsEditing(!isEditing);
      return;
    }
    setIsEditing(true);
    setEditValue(String(value || ''));
  };

  const handleMultiSelectBlur = () => {
    // Auto-save multi-select when clicking elsewhere
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleSave = () => {
    // Clear any previous errors
    setError('');
    
    // Validate input before saving
    const validationError = validateInput(editValue, column.column_type);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (editValue !== value) {
      updateCellMutation.mutate({
        row_id: row.id,
        column_id: column.id,
        data_type: column.column_type,
        value: parseValue(editValue, column.column_type)
      }, {
        onSuccess: () => {
          setDisplayValue(formatDisplayValue(editValue, column.column_type));
          setIsEditing(false);
          setError('');
        },
        onError: (error) => {
          setError(getErrorMessage(error));
          setIsEditing(false);
        }
      });
    } else {
      setIsEditing(false);
    }
  };

  const handleSelectChange = (newValue) => {
    setError('');
    setEditValue(newValue);
    updateCellMutation.mutate({
      row_id: row.id,
      column_id: column.id,
      data_type: column.column_type,
      value: parseValue(newValue, column.column_type)
    }, {
      onSuccess: () => {
        setDisplayValue(formatDisplayValue(newValue, column.column_type));
        setIsEditing(false);
        setError('');
      },
      onError: (error) => {
        setError(getErrorMessage(error));
        setIsEditing(false);
      }
    });
  };

  const handleCancel = () => {
    setEditValue(String(value || ''));
    setIsEditing(false);
    setError('');
  };

  const validateInput = (val, type) => {
    if (val === '' || val === null || val === undefined) {
      return null; // Empty values are allowed
    }
    
    switch (type) {
      case 'number':
        if (isNaN(parseFloat(val))) {
          return 'Please enter a valid number';
        }
        break;
      case 'datetime':
        if (isNaN(Date.parse(val))) {
          return 'Invalid date';
        }
        // Additional validation for reasonable date range
        const date = new Date(val);
        const currentYear = new Date().getFullYear();
        if (date.getFullYear() < 1900 || date.getFullYear() > currentYear + 10) {
          return 'Invalid date';
        }
        break;
      case 'text':
        if (typeof val !== 'string') {
          return 'Please enter text';
        }
        break;
    }
    return null;
  };

  const getErrorMessage = (error) => {
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Failed to save. Please try again.';
  };

  const parseValue = (val, type) => {
    switch (type) {
      case 'number':
        return parseFloat(val) || 0;
      case 'datetime':
        return new Date(val).toISOString();
      case 'single_select':
        return parseInt(val) || 0;
      default:
        return val;
    }
  };

  const handleMultiSelectChange = (optionId, checked) => {
    const currentValues = Array.isArray(value) ? [...value] : [];
    let newValues;
    
    if (checked) {
      newValues = [...currentValues, optionId];
    } else {
      newValues = currentValues.filter(id => id !== optionId);
    }
    
    updateCellMutation.mutate({
      row_id: row.id,
      column_id: column.id,
      data_type: 'multi_select',
      value: newValues
    });
  };

  const renderInput = () => {
    switch (column.column_type) {
      case 'text':
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              // Real-time validation for text
              const validationError = validateInput(e.target.value, 'text');
              if (validationError) {
                setError(validationError);
              } else {
                setError('');
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`cell-input ${error ? 'error' : ''}`}
            aria-label={`Edit ${column.column_name}`}
            autoFocus
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              // Real-time validation for number
              const validationError = validateInput(e.target.value, 'number');
              if (validationError) {
                setError(validationError);
              } else {
                setError('');
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`cell-input number-input ${error ? 'error' : ''}`}
            aria-label={`Edit ${column.column_name}`}
            autoFocus
          />
        );
      
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={editValue ? new Date(editValue).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              setEditValue(e.target.value);
              // Real-time validation for datetime
              const validationError = validateInput(e.target.value, 'datetime');
              if (validationError) {
                setError(validationError);
              } else {
                setError('');
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`cell-input datetime-input ${error ? 'error' : ''}`}
            aria-label={`Edit ${column.column_name}`}
            autoFocus
          />
        );
      
      case 'single_select':
        return (
          <select
            value={editValue}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="cell-select"
            aria-label={`Edit ${column.column_name}`}
            autoFocus
          >
            <option value="">Select...</option>
            {column.options && column.options.length > 0 ? (
              column.options.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))
            ) : (
              <option value="" disabled>No options available</option>
            )}
          </select>
        );
      
      case 'multi_select':
        return (
          <div className="multi-select-container" onBlur={handleMultiSelectBlur}>
            <div className="multi-select-header">
              <span className="multi-select-title">Select Skills:</span>
              <button 
                type="button" 
                className="multi-select-close"
                onClick={() => setIsEditing(false)}
              >
                ✓ Done
              </button>
            </div>
            {column.options && column.options.length > 0 ? (
              column.options.map(option => {
                const isSelected = Array.isArray(value) && value.includes(option.id);
                return (
                  <label key={option.id} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleMultiSelectChange(option.id, e.target.checked)}
                    />
                    {option.label}
                  </label>
                );
              })
            ) : (
              <div className="no-options">No options available</div>
            )}
          </div>
        );
      
      default:
        return <span>{displayValue}</span>;
    }
  };

  if (isEditing && column.column_type !== 'multi_select') {
    return (
      <div className="cell-editing">
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="inline-cell-container">
      <div 
        className={`cell-content ${column.column_type === 'multi_select' ? 'multi-select-cell' : ''} ${error ? 'error' : ''}`}
        onClick={handleCellClick}
      >
        {column.column_type === 'multi_select' ? (
          isEditing ? (
            <div className="multi-select-display">
              {renderInput()}
            </div>
          ) : (
            <span className={displayValue ? 'cell-value' : 'empty-cell'}>
              {displayValue || 'Click to select skills'}
            </span>
          )
        ) : (
          <span className={displayValue ? 'cell-value' : 'empty-cell'}>
            {displayValue || 'Click to edit'}
          </span>
        )}
      </div>
      {error && (
        <div className="cell-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default InlineCell;