import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TablePage from '../TablePage';

// Mock the API endpoints
jest.mock('../../api/endpoints', () => ({
  getColumns: jest.fn(),
  getRows: jest.fn(),
  getSummary: jest.fn()
}));

// Mock the useApi hooks
jest.mock('../../hooks/useApi', () => ({
  useColumns: jest.fn(),
  useRows: jest.fn(),
  useSummary: jest.fn()
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('TablePage Component', () => {
  const mockColumns = [
    {
      id: 1,
      column_name: 'Name',
      column_type: 'text',
      options: null
    },
    {
      id: 2,
      column_name: 'Age',
      column_type: 'number',
      options: null
    },
    {
      id: 3,
      column_name: 'Priority',
      column_type: 'single_select',
      options: [
        { id: 1, label: 'High', value: 'high' },
        { id: 2, label: 'Medium', value: 'medium' }
      ]
    }
  ];

  const mockRows = [
    {
      id: 'uuid-1',
      row_number: 1,
      cells: [
        { column_id: 1, data_type: 'text', value: 'John Doe' },
        { column_id: 2, data_type: 'number', value: 25 },
        { column_id: 3, data_type: 'single_select', value: 1 }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'uuid-2',
      row_number: 2,
      cells: [
        { column_id: 1, data_type: 'text', value: 'Jane Smith' },
        { column_id: 2, data_type: 'number', value: 30 },
        { column_id: 3, data_type: 'single_select', value: 2 }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ];

  const mockSummary = [
    {
      column_id: 1,
      column_name: 'Name',
      column_type: 'text',
      summary: null
    },
    {
      column_id: 2,
      column_name: 'Age',
      column_type: 'number',
      summary: { sum: 55, average: 27.5, count: 2 }
    },
    {
      column_id: 3,
      column_name: 'Priority',
      column_type: 'single_select',
      summary: { most_frequent: 'High', count: 1 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading state for columns', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      
      useRows.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading state for rows', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error state for columns', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load columns')
      });
      
      useRows.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Error loading columns')).toBeInTheDocument();
    });

    it('should show error state for rows', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load rows')
      });
      
      useSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Error loading rows')).toBeInTheDocument();
    });
  });

  describe('Successful Rendering', () => {
    beforeEach(() => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: mockRows, pagination: { current_page: 1, total_pages: 1, total_rows: 2 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });
    });

    it('should render table headers', () => {
      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('should render table data', () => {
      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('should render summary row', () => {
      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Sum: 55')).toBeInTheDocument();
      expect(screen.getByText('Average: 27.5')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Add Row')).toBeInTheDocument();
      expect(screen.getByText('Add Column')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show no columns message when no columns exist', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: [], pagination: { current_page: 1, total_pages: 0, total_rows: 0 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('No columns found')).toBeInTheDocument();
    });

    it('should show no rows message when no rows exist', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: [], pagination: { current_page: 1, total_pages: 0, total_rows: 0 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('No rows found')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { 
          rows: mockRows, 
          pagination: { 
            current_page: 1, 
            total_pages: 3, 
            total_rows: 50,
            has_next: true,
            has_prev: false
          } 
        },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Total: 50 rows')).toBeInTheDocument();
    });

    it('should show next/previous buttons when applicable', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { 
          rows: mockRows, 
          pagination: { 
            current_page: 2, 
            total_pages: 3, 
            total_rows: 50,
            has_next: true,
            has_prev: true
          } 
        },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: mockRows, pagination: { current_page: 1, total_pages: 1, total_rows: 2 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });
    });

    it('should handle cell editing', async () => {
      const user = userEvent.setup();
      
      render(<TablePage />, { wrapper: createWrapper() });

      // Click on a cell to edit
      await user.click(screen.getByText('John Doe'));
      
      // Should enter edit mode
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should handle add row button click', async () => {
      const user = userEvent.setup();
      
      render(<TablePage />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Add Row'));
      
      // Should trigger add row functionality
      // (The actual implementation would be tested in the AddRowButton component)
    });

    it('should handle add column button click', async () => {
      const user = userEvent.setup();
      
      render(<TablePage />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Add Column'));
      
      // Should open column add modal
      // (The actual implementation would be tested in the ColumnAddModal component)
    });
  });

  describe('Data Display', () => {
    it('should display single select values correctly', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: mockRows, pagination: { current_page: 1, total_pages: 1, total_rows: 2 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      // Should display option labels, not IDs
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should display summary statistics correctly', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: mockRows, pagination: { current_page: 1, total_pages: 1, total_rows: 2 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      expect(screen.getByText('Sum: 55')).toBeInTheDocument();
      expect(screen.getByText('Average: 27.5')).toBeInTheDocument();
      expect(screen.getByText('Most frequent: High')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render table container with proper classes', () => {
      const { useColumns, useRows, useSummary } = require('../../hooks/useApi');
      
      useColumns.mockReturnValue({
        data: mockColumns,
        isLoading: false,
        error: null
      });
      
      useRows.mockReturnValue({
        data: { rows: mockRows, pagination: { current_page: 1, total_pages: 1, total_rows: 2 } },
        isLoading: false,
        error: null
      });
      
      useSummary.mockReturnValue({
        data: mockSummary,
        isLoading: false,
        error: null
      });

      render(<TablePage />, { wrapper: createWrapper() });

      const tableContainer = screen.getByRole('table').closest('.table-container');
      expect(tableContainer).toBeInTheDocument();
    });
  });
});
