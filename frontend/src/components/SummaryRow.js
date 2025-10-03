import React from 'react';
import './SummaryRow.css';

const SummaryRow = ({ columns, summary }) => {
  if (!columns || columns.length === 0) {
    return (
      <tr className="summary-row">
        <td className="summary-header">Summary</td>
      </tr>
    );
  }

  const renderSummaryValue = (column) => {
    if (!summary || !Array.isArray(summary)) {
      return <span className="summary-empty">No summary</span>;
    }

    const columnSummary = summary.find(s => s.column_id === column.id);
    
    if (!columnSummary || !columnSummary.summary) {
      return <span className="summary-empty">No summary</span>;
    }

    const { column_type, summary: summaryData } = columnSummary;

    switch (column_type) {
      case 'text':
        return <span className="summary-empty">No summary</span>;
      
      case 'number':
        if (!summaryData.sum && !summaryData.average && !summaryData.count) {
          return <span className="summary-empty">No data</span>;
        }
        return (
          <div className="summary-content">
            <div className="summary-stat">Sum: {summaryData.sum}</div>
            <div className="summary-stat">Average: {summaryData.average}</div>
            <div className="summary-stat">Count: {summaryData.count}</div>
          </div>
        );
      
      case 'datetime':
        if (!summaryData) {
          return <span className="summary-empty">No data</span>;
        }
        return (
          <div className="summary-content">
            <div className="summary-stat">
              {new Date(summaryData).toLocaleString()}
            </div>
            <div className="summary-text">(closest to now)</div>
          </div>
        );
      
      case 'single_select':
        if (!summaryData.most_frequent) {
          return <span className="summary-empty">No data</span>;
        }
        return (
          <div className="summary-content">
            <div className="summary-stat">Most frequent: {summaryData.most_frequent}</div>
            <div className="summary-text">({summaryData.count} times)</div>
          </div>
        );
      
      case 'multi_select':
        if (!summaryData.most_frequent || !Array.isArray(summaryData.most_frequent) || summaryData.most_frequent.length === 0) {
          return <span className="summary-empty">No data</span>;
        }
        return (
          <div className="summary-content">
            <div className="summary-stat">Most frequent: {summaryData.most_frequent.join(', ')}</div>
            <div className="summary-text">({summaryData.count} times)</div>
          </div>
        );
      
      default:
        return <span className="summary-empty">No summary</span>;
    }
  };

  return (
    <tr className="summary-row">
      <td className="summary-header">Summary</td>
      {columns.map(column => (
        <td key={column.id} className="summary-cell">
          {renderSummaryValue(column)}
        </td>
      ))}
    </tr>
  );
};

export default SummaryRow;