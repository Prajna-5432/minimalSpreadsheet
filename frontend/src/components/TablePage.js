import React, { useState, useEffect } from 'react';
import { useColumns, useRows, useSummary } from '../hooks/useApi';
import ColumnAddModal from './ColumnAddModal';
import AddRowButton from './AddRowButton';
import InlineCell from './InlineCell';
import SummaryRow from './SummaryRow';
import './TablePage.css';

const TablePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [tableContainerRef, setTableContainerRef] = useState(null);
  
  // Debug logging
  console.log('TablePage render - showColumnModal:', showColumnModal);
  
  // Fetch data
  const { data: columns, isLoading: columnsLoading, error: columnsError, refetch: refetchColumns } = useColumns();
  const { data: rowsData, isLoading: rowsLoading, error: rowsError } = useRows(currentPage, pageSize);
  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useSummary();

  // Debug logging
  console.log('=== COLUMN DEBUG INFO ===');
  console.log('Columns data:', columns);
  console.log('Columns loading:', columnsLoading);
  console.log('Columns error:', columnsError);
  console.log('Number of columns:', columns?.length);
  console.log('Columns array:', columns);
  if (columns && columns.length > 0) {
    console.log('First column:', columns[0]);
    console.log('Column names:', columns.map(c => c.column_name || c.name));
    console.log('All column IDs:', columns.map(c => c.id));
    console.log('All column types:', columns.map(c => c.column_type || c.data_type));
  }
  console.log('========================');

  // Force refresh when modal closes (in case a column was added)
  useEffect(() => {
    if (!showColumnModal) {
      console.log('Modal closed, checking if we need to refresh data...');
      // Small delay to ensure any pending mutations complete
      setTimeout(() => {
        console.log('Force refreshing columns and summary...');
        refetchColumns();
        refetchSummary();
      }, 100);
    }
  }, [showColumnModal, refetchColumns, refetchSummary]);

  // Force refresh on component mount
  useEffect(() => {
    console.log('Component mounted, fetching fresh data...');
    refetchColumns();
    refetchSummary();
    
    // Also try direct API call as fallback
    setTimeout(async () => {
      try {
        console.log('Making direct API call as fallback...');
        const response = await fetch('http://localhost:3001/api/columns');
        const data = await response.json();
        console.log('Direct API fallback result:', data.length, 'columns');
        if (data.length > (columns?.length || 0)) {
          console.log('Direct API found more columns, forcing refresh...');
          refetchColumns();
        }
      } catch (error) {
        console.error('Direct API fallback error:', error);
      }
    }, 2000);
  }, [refetchColumns, refetchSummary, columns?.length]);

  // Add scrolling functionality
  useEffect(() => {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    // Ensure the table container can scroll to show all content
    const ensureFullScroll = () => {
      // Force a reflow to ensure proper scroll dimensions
      tableContainer.style.height = tableContainer.offsetHeight + 'px';
      setTimeout(() => {
        tableContainer.style.height = '';
      }, 100);
    };

    // Call ensureFullScroll when columns change
    ensureFullScroll();

    // Debug function to check scroll dimensions
    const debugScrollDimensions = () => {
      console.log('Table Container Dimensions:');
      console.log('- Client Height:', tableContainer.clientHeight);
      console.log('- Scroll Height:', tableContainer.scrollHeight);
      console.log('- Max Scroll Top:', tableContainer.scrollHeight - tableContainer.clientHeight);
      console.log('- Can reach bottom:', tableContainer.scrollHeight > tableContainer.clientHeight);
    };

    // Debug scroll dimensions after a short delay
    setTimeout(debugScrollDimensions, 500);

    // Mouse wheel and touchpad scrolling
    const handleWheel = (e) => {
      // Only prevent default if we're actually scrolling the table
      const isScrollingHorizontally = e.deltaX !== 0;
      const isScrollingVertically = e.deltaY !== 0;
      
      if (isScrollingHorizontally) {
        e.preventDefault();
        const scrollAmount = e.deltaX * 4; // Moderate horizontal scrolling
        tableContainer.scrollLeft += scrollAmount;
      } else if (isScrollingVertically) {
        // Allow natural vertical scrolling, but enhance it slightly
        const scrollAmount = e.deltaY * 1.5; // Slight enhancement for vertical
        tableContainer.scrollTop += scrollAmount;
        // Don't prevent default to allow natural scrollbar behavior
      }
    };

    // Keyboard scrolling
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return; // Don't interfere with form inputs
      }

      const scrollAmount = 150; // Scroll distance for each key press
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          tableContainer.scrollLeft -= scrollAmount;
          break;
        case 'ArrowRight':
          e.preventDefault();
          tableContainer.scrollLeft += scrollAmount;
          break;
        case 'ArrowUp':
          e.preventDefault();
          tableContainer.scrollTop -= scrollAmount;
          break;
        case 'ArrowDown':
          e.preventDefault();
          tableContainer.scrollTop += scrollAmount;
          break;
        case 'Home':
          e.preventDefault();
          tableContainer.scrollLeft = 0;
          tableContainer.scrollTop = 0;
          break;
        case 'End':
          e.preventDefault();
          tableContainer.scrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
          tableContainer.scrollTop = tableContainer.scrollHeight - tableContainer.clientHeight;
          break;
        case 'PageUp':
          e.preventDefault();
          tableContainer.scrollLeft -= tableContainer.clientWidth * 0.8;
          tableContainer.scrollTop -= tableContainer.clientHeight * 0.8;
          break;
        case 'PageDown':
          e.preventDefault();
          tableContainer.scrollLeft += tableContainer.clientWidth * 0.8;
          tableContainer.scrollTop += tableContainer.clientHeight * 0.8;
          break;
      }
    };

    // Touch events for touchpad gestures
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        
        const deltaX = touchStartX - touchCurrentX;
        const deltaY = touchStartY - touchCurrentY;
        
        // If horizontal movement is greater than vertical, scroll horizontally
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          tableContainer.scrollLeft += deltaX * 6; // Very fast horizontal scrolling
        } else {
          // Scroll vertically when vertical movement is detected
          tableContainer.scrollTop += deltaY * 6; // Very fast vertical scrolling
        }
        
        touchStartX = touchCurrentX;
        touchStartY = touchCurrentY;
      }
    };

    // Add event listeners
    tableContainer.addEventListener('wheel', handleWheel, { passive: false });
    tableContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    tableContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      tableContainer.removeEventListener('wheel', handleWheel);
      tableContainer.removeEventListener('touchstart', handleTouchStart);
      tableContainer.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [columns]); // Re-run when columns change

  // Loading state
  if (columnsLoading || rowsLoading || summaryLoading) {
    return (
      <div className="loading">
        <h2>Loading spreadsheet data...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  // Error state
  if (columnsError || rowsError || summaryError) {
    return (
      <div className="error">
        <h2>Error loading data</h2>
        <p>{columnsError?.message || rowsError?.message || summaryError?.message}</p>
      </div>
    );
  }


  // Show message if no columns exist
  if (!columns || columns.length === 0) {
    return (
      <div className="table-page">
        <div className="table-header">
          <h1>Spreadsheet</h1>
          <div className="table-controls">
            <button 
              onClick={() => setShowColumnModal(true)} 
              className="add-column-btn"
            >
              + Add Column
            </button>
          </div>
        </div>
        <div className="no-data">
          <h3>No columns found</h3>
          <p>Click "Add Column" to create your first column and start building your spreadsheet.</p>
        </div>
        <ColumnAddModal 
          isOpen={showColumnModal} 
          onClose={() => setShowColumnModal(false)} 
        />
      </div>
    );
  }

  return (
    <div className="table-page">
      <div className="table-header">
        <h1>Spreadsheet</h1>
        <div className="table-controls">
          <div style={{ marginRight: '20px', fontSize: '14px', color: '#666' }}>
            Columns: {columns?.length || 0}
          </div>
          {columnsError && (
            <div style={{ 
              marginRight: '20px', 
              fontSize: '12px', 
              color: '#dc3545',
              backgroundColor: '#f8d7da',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              ⚠️ Connection Error
            </div>
          )}
          <button 
            onClick={() => {
              const tableContainer = document.querySelector('.table-container');
              if (tableContainer) {
                tableContainer.scrollTo({ left: 0, behavior: 'smooth' });
              }
            }}
            title="Scroll to start (or use Home key)"
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '12px'
            }}
          >
            ← Start
          </button>
          <button 
            onClick={() => {
              const tableContainer = document.querySelector('.table-container');
              if (tableContainer) {
                const maxScroll = tableContainer.scrollWidth - tableContainer.clientWidth;
                tableContainer.scrollTo({ left: maxScroll, behavior: 'smooth' });
              }
            }}
            title="Scroll to end (or use End key)"
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '12px'
            }}
          >
            End →
          </button>
          <button 
            onClick={() => {
              const tableContainer = document.querySelector('.table-container');
              if (tableContainer) {
                const maxScrollTop = tableContainer.scrollHeight - tableContainer.clientHeight;
                tableContainer.scrollTo({ top: maxScrollTop, behavior: 'smooth' });
                console.log('Scrolling to bottom - Max scroll top:', maxScrollTop);
              }
            }}
            title="Scroll to bottom (10th row)"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '12px'
            }}
          >
            ↓ Bottom
          </button>
          <button 
            onClick={() => {
              console.log('Add Column button clicked');
              setShowColumnModal(true);
            }} 
            className="add-column-btn"
          >
            + Add Column
          </button>
          <AddRowButton />
          <div className="pagination-info">
            Page {currentPage} of {rowsData?.pagination?.pages || 1}
          </div>
        </div>
      </div>

        <div className="table-container" data-columns={columns?.length || 0}>
          <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="row-header">Row</th>
              {columns?.map(column => (
                <th key={column.id} className="column-header">
                  <div className="column-name">{column.column_name}</div>
                  <div className="column-type">{column.column_type}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SummaryRow columns={columns} summary={summary} />
            {rowsData?.rows?.map(row => (
              <tr key={row.id} className={`data-row ${row.row_number === 1 ? 'new-row' : ''}`}>
                <td className="row-number">{row.row_number}</td>
                {columns?.map(column => {
                  const cell = row.cells.find(c => c.column_id === column.id);
                  return (
                    <td key={column.id} className="data-cell">
                      <InlineCell 
                        row={row} 
                        column={column} 
                        value={cell?.value} 
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>

      {rowsData?.pagination && rowsData.pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            {currentPage} of {rowsData.pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(rowsData.pagination.pages, prev + 1))}
            disabled={currentPage === rowsData.pagination.pages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      <ColumnAddModal 
        isOpen={showColumnModal} 
        onClose={() => setShowColumnModal(false)}
        onSuccess={() => {
          // Column was successfully added, the data will be refreshed automatically
          // by the React Query cache invalidation in the useAddColumn hook
        }}
      />
    </div>
  );
};

export default TablePage;
