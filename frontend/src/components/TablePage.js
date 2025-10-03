import React, { useState, useEffect } from 'react';
import { useColumns, useRows, useSummary } from '../hooks/useApi';
import { columnsApi, rowsApi } from '../api/endpoints';
import ColumnAddModal from './ColumnAddModal';
import AddRowButton from './AddRowButton';
import InlineCell from './InlineCell';
import SummaryRow from './SummaryRow';
import DeleteConfirmModal from './DeleteConfirmModal';
import './TablePage.css';

const TablePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'column' or 'row'
    item: null,
    isLoading: false
  });
  
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

  // Function to update scroll to top button
  const updateScrollToTopButton = (container) => {
    // Show scroll to top button if scrolled down
    setShowScrollToTop(container.scrollTop > 100);
  };

  // Function to scroll to top
  const scrollToTop = () => {
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  // Delete functions
  const handleDeleteColumn = (column) => {
    setDeleteModal({
      isOpen: true,
      type: 'column',
      item: column,
      isLoading: false
    });
  };

  const handleDeleteRow = (row) => {
    setDeleteModal({
      isOpen: true,
      type: 'row',
      item: row,
      isLoading: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      if (deleteModal.type === 'column') {
        await columnsApi.deleteColumn(deleteModal.item.id);
        await refetchColumns();
        await refetchSummary();
      } else if (deleteModal.type === 'row') {
        await rowsApi.deleteRow(deleteModal.item.id);
        // Refresh the current page
        window.location.reload();
      }
      
      setDeleteModal({
        isOpen: false,
        type: null,
        item: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
      alert('Failed to delete. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      type: null,
      item: null,
      isLoading: false
    });
  };

  // Add scrolling functionality
  useEffect(() => {
    // Wait for DOM to be ready and ensure table container exists
    const initializeScrolling = () => {
      const tableContainer = document.querySelector('.table-container');
      if (!tableContainer) {
        // Retry after a short delay if container not found
        setTimeout(initializeScrolling, 100);
        return;
      }

      // Ensure the table container can scroll to show all content
      const ensureFullScroll = () => {
        // Force a reflow to ensure proper scroll dimensions
        const table = tableContainer.querySelector('.spreadsheet-table');
        if (table) {
          // Calculate width based on number of columns (150px per column)
          const columnCount = columns?.length || 10;
          const calculatedWidth = Math.max(columnCount * 150, 2000); // Minimum 2000px for unlimited columns
          
          // Ensure table has proper dimensions for full scrolling
          table.style.minHeight = '600px'; // 10 rows * 60px = 600px
          table.style.minWidth = `${calculatedWidth}px`;
          table.style.width = `${calculatedWidth}px`;
          table.style.height = 'auto';
          
          // Force reflow to update dimensions
          void tableContainer.offsetHeight;
          void table.offsetHeight;
          
          // Ensure container can scroll to full extent
          const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
          const maxScrollTop = tableContainer.scrollHeight - tableContainer.clientHeight;
          
          console.log('Scroll dimensions for', columnCount, 'columns:', {
            scrollWidth: tableContainer.scrollWidth,
            scrollHeight: tableContainer.scrollHeight,
            clientWidth: tableContainer.clientWidth,
            clientHeight: tableContainer.clientHeight,
            maxScrollLeft,
            maxScrollTop,
            calculatedWidth
          });
        }
      };

      // Call ensureFullScroll when columns change
      ensureFullScroll();
      
      // Update scroll to top button
      updateScrollToTopButton(tableContainer);

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

      // Robust mouse wheel and touchpad scrolling
      const handleWheel = (e) => {
        e.preventDefault();
        
        // Enhanced scroll amounts for better navigation
        const horizontalScroll = e.deltaX * 2.5; // Increased for better horizontal scrolling
        const verticalScroll = e.deltaY * 2.5; // Increased for better vertical scrolling
        
        // Apply scrolling with bounds checking
        const newScrollLeft = Math.max(0, Math.min(
          tableContainer.scrollLeft + horizontalScroll,
          tableContainer.scrollWidth - tableContainer.clientWidth
        ));
        const newScrollTop = Math.max(0, Math.min(
          tableContainer.scrollTop + verticalScroll,
          tableContainer.scrollHeight - tableContainer.clientHeight
        ));
        
        tableContainer.scrollLeft = newScrollLeft;
        tableContainer.scrollTop = newScrollTop;
      };

      // Keyboard scrolling
      const handleKeyDown = (e) => {
        // Check if we're in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
          return; // Don't interfere with form inputs
        }

        // Only handle arrow keys and navigation keys
        const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
        if (!navigationKeys.includes(e.key)) {
          return;
        }

        e.preventDefault();
        
        // Enhanced scroll amounts for better navigation
        const cellScrollAmount = 150; // Distance for cell-by-cell navigation
        const pageScrollAmount = Math.max(tableContainer.clientWidth, tableContainer.clientHeight) * 0.8;
        
        let newScrollLeft = tableContainer.scrollLeft;
        let newScrollTop = tableContainer.scrollTop;
        
        switch (e.key) {
          case 'ArrowLeft':
            newScrollLeft = Math.max(0, newScrollLeft - cellScrollAmount);
            break;
          case 'ArrowRight':
            newScrollLeft = Math.min(
              tableContainer.scrollWidth - tableContainer.clientWidth,
              newScrollLeft + cellScrollAmount
            );
            break;
          case 'ArrowUp':
            newScrollTop = Math.max(0, newScrollTop - cellScrollAmount);
            break;
          case 'ArrowDown':
            newScrollTop = Math.min(
              tableContainer.scrollHeight - tableContainer.clientHeight,
              newScrollTop + cellScrollAmount
            );
            break;
          case 'Home':
            newScrollLeft = 0;
            newScrollTop = 0;
            break;
          case 'End':
            newScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
            newScrollTop = tableContainer.scrollHeight - tableContainer.clientHeight;
            break;
          case 'PageUp':
            newScrollLeft = Math.max(0, newScrollLeft - pageScrollAmount);
            newScrollTop = Math.max(0, newScrollTop - pageScrollAmount);
            break;
          case 'PageDown':
            newScrollLeft = Math.min(
              tableContainer.scrollWidth - tableContainer.clientWidth,
              newScrollLeft + pageScrollAmount
            );
            newScrollTop = Math.min(
              tableContainer.scrollHeight - tableContainer.clientHeight,
              newScrollTop + pageScrollAmount
            );
            break;
        }
        
        // Apply smooth scrolling
        tableContainer.scrollTo({
          left: newScrollLeft,
          top: newScrollTop,
          behavior: 'smooth'
        });
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
          
          // Enhanced touch scrolling with bounds checking
          const newScrollLeft = Math.max(0, Math.min(
            tableContainer.scrollLeft + deltaX * 1.8,
            tableContainer.scrollWidth - tableContainer.clientWidth
          ));
          const newScrollTop = Math.max(0, Math.min(
            tableContainer.scrollTop + deltaY * 1.8,
            tableContainer.scrollHeight - tableContainer.clientHeight
          ));
          
          tableContainer.scrollLeft = newScrollLeft;
          tableContainer.scrollTop = newScrollTop;
          
          touchStartX = touchCurrentX;
          touchStartY = touchCurrentY;
        }
      };

      // Scroll event handler to update scroll to top button
      const handleScroll = () => {
        updateScrollToTopButton(tableContainer);
      };

      // Resize observer to update scroll to top button when container size changes
      const resizeObserver = new ResizeObserver(() => {
        updateScrollToTopButton(tableContainer);
      });
      resizeObserver.observe(tableContainer);

      // Add event listeners
      tableContainer.addEventListener('wheel', handleWheel, { passive: false });
      tableContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      tableContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      tableContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      // Add keyboard event listener to document
      document.addEventListener('keydown', handleKeyDown);
      
      // Debug: Log when keyboard events are attached
      console.log('Keyboard scrolling events attached to document');
      
      // Test keyboard scrolling
      const testKeyboardScrolling = () => {
        console.log('Testing keyboard scrolling...');
        console.log('Table container found:', !!tableContainer);
        console.log('Table container scroll dimensions:');
        console.log('- scrollWidth:', tableContainer.scrollWidth);
        console.log('- scrollHeight:', tableContainer.scrollHeight);
        console.log('- clientWidth:', tableContainer.clientWidth);
        console.log('- clientHeight:', tableContainer.clientHeight);
      };
      
      // Test after a short delay
      setTimeout(testKeyboardScrolling, 1000);

      // Cleanup function for this initialization
      const cleanup = () => {
        tableContainer.removeEventListener('wheel', handleWheel);
        tableContainer.removeEventListener('touchstart', handleTouchStart);
        tableContainer.removeEventListener('touchmove', handleTouchMove);
        tableContainer.removeEventListener('scroll', handleScroll);
        document.removeEventListener('keydown', handleKeyDown);
        resizeObserver.disconnect();
      };

      // Return cleanup function
      return cleanup;
    };

    // Initialize scrolling
    const cleanup = initializeScrolling();

    // Cleanup on unmount or dependency change
    return () => {
      if (cleanup) cleanup();
    };
  }, [columns, columns?.length, showColumnModal]); // Re-run when columns change or modal state changes

  // Additional effect to ensure scrolling works after data loads
  useEffect(() => {
    if (!columnsLoading && !rowsLoading && columns && columns.length > 0) {
      // Force re-initialization of scrolling after data loads
      const timer = setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
          console.log('Re-initializing scrolling after data load...');
          updateScrollToTopButton(tableContainer);
          
          // Force a reflow to ensure proper dimensions
          const table = tableContainer.querySelector('.spreadsheet-table');
          if (table) {
            const columnCount = columns.length;
            const calculatedWidth = Math.max(columnCount * 150, 2000);
            table.style.minWidth = `${calculatedWidth}px`;
            table.style.width = `${calculatedWidth}px`;
            
            // Force reflow
            void tableContainer.offsetHeight;
            void table.offsetHeight;
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [columnsLoading, rowsLoading, columns]);

  // Handle window resize to ensure scrolling works properly
  useEffect(() => {
    const handleResize = () => {
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        // Update scroll to top button after resize
        setTimeout(() => {
          updateScrollToTopButton(tableContainer);
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
                  <div className="column-header-content">
                    <div className="column-info">
                      <div className="column-name">{column.column_name}</div>
                      <div className="column-type">{column.column_type}</div>
                    </div>
                    <button 
                      className="delete-column-btn"
                      onClick={() => handleDeleteColumn(column)}
                      title={`Delete column: ${column.column_name}`}
                      aria-label={`Delete column: ${column.column_name}`}
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SummaryRow columns={columns} summary={summary} />
            {rowsData?.rows?.map(row => (
              <tr key={row.id} className={`data-row ${row.row_number === 1 ? 'new-row' : ''}`}>
                <td className="row-number-cell">
                  <div className="row-number-content">
                    <span className="row-number">{row.row_number}</span>
                    <button 
                      className="delete-row-btn"
                      onClick={() => handleDeleteRow(row)}
                      title={`Delete row ${row.row_number}`}
                      aria-label={`Delete row ${row.row_number}`}
                    >
                      ×
                    </button>
                  </div>
                </td>
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
      
      {/* Scroll to top button */}
      <button 
        className={`scroll-to-top ${showScrollToTop ? '' : 'hidden'}`}
        onClick={scrollToTop}
        title="Scroll to top"
        aria-label="Scroll to top of table"
      >
        ↑
      </button>
      
      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={deleteModal.type === 'column' ? 'Delete Column' : 'Delete Row'}
        message={deleteModal.type === 'column' 
          ? 'Are you sure you want to delete this column? This will permanently remove the column and all its data.'
          : 'Are you sure you want to delete this row? This will permanently remove the row and all its data.'
        }
        itemName={deleteModal.item?.column_name || `Row ${deleteModal.item?.row_number}`}
        itemType={deleteModal.type === 'column' ? 'Column' : 'Row'}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default TablePage;
