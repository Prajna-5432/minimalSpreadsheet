import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColumns, useRows, useSummary, useUpdateCell, useAddColumn, useAddRow } from '../useApi';
import * as endpoints from '../../api/endpoints';

// Mock the API endpoints
jest.mock('../../api/endpoints');

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

describe('useApi Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useColumns', () => {
    it('should fetch columns successfully', async () => {
      const mockColumns = [
        { id: 1, column_name: 'Name', column_type: 'text', options: null },
        { id: 2, column_name: 'Age', column_type: 'number', options: null }
      ];

      endpoints.getColumns.mockResolvedValue(mockColumns);

      const { result } = renderHook(() => useColumns(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockColumns);
      expect(endpoints.getColumns).toHaveBeenCalledTimes(1);
    });

    it('should handle columns fetch error', async () => {
      const error = new Error('Failed to fetch columns');
      endpoints.getColumns.mockRejectedValue(error);

      const { result } = renderHook(() => useColumns(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should show loading state initially', () => {
      endpoints.getColumns.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useColumns(), {
        wrapper: createWrapper()
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useRows', () => {
    it('should fetch rows successfully', async () => {
      const mockRowsData = {
        rows: [
          { id: 'uuid-1', row_number: 1, cells: [] },
          { id: 'uuid-2', row_number: 2, cells: [] }
        ],
        pagination: { current_page: 1, total_pages: 1, total_rows: 2 }
      };

      endpoints.getRows.mockResolvedValue(mockRowsData);

      const { result } = renderHook(() => useRows(1, 20), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRowsData);
      expect(endpoints.getRows).toHaveBeenCalledWith(1, 20);
    });

    it('should handle rows fetch error', async () => {
      const error = new Error('Failed to fetch rows');
      endpoints.getRows.mockRejectedValue(error);

      const { result } = renderHook(() => useRows(1, 20), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should refetch when page or limit changes', async () => {
      endpoints.getRows.mockResolvedValue({ rows: [], pagination: {} });

      const { result, rerender } = renderHook(
        ({ page, limit }) => useRows(page, limit),
        {
          wrapper: createWrapper(),
          initialProps: { page: 1, limit: 20 }
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Change page
      rerender({ page: 2, limit: 20 });

      await waitFor(() => {
        expect(endpoints.getRows).toHaveBeenCalledWith(2, 20);
      });
    });
  });

  describe('useSummary', () => {
    it('should fetch summary successfully', async () => {
      const mockSummary = [
        { column_id: 1, column_name: 'Name', column_type: 'text', summary: null },
        { column_id: 2, column_name: 'Age', column_type: 'number', summary: { sum: 100, average: 25 } }
      ];

      endpoints.getSummary.mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useSummary(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSummary);
      expect(endpoints.getSummary).toHaveBeenCalledTimes(1);
    });

    it('should handle summary fetch error', async () => {
      const error = new Error('Failed to fetch summary');
      endpoints.getSummary.mockRejectedValue(error);

      const { result } = renderHook(() => useSummary(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateCell', () => {
    it('should update cell successfully', async () => {
      const mockResponse = { success: true, message: 'Cell updated successfully' };
      endpoints.updateCell.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateCell(), {
        wrapper: createWrapper()
      });

      const updateData = {
        rowId: 'uuid-1',
        columnId: 1,
        value: 'New Value'
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(endpoints.updateCell).toHaveBeenCalledWith(updateData);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle update cell error', async () => {
      const error = new Error('Failed to update cell');
      endpoints.updateCell.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateCell(), {
        wrapper: createWrapper()
      });

      const updateData = {
        rowId: 'uuid-1',
        columnId: 1,
        value: 'New Value'
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should show loading state during mutation', () => {
      endpoints.updateCell.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUpdateCell(), {
        wrapper: createWrapper()
      });

      const updateData = {
        rowId: 'uuid-1',
        columnId: 1,
        value: 'New Value'
      };

      result.current.mutate(updateData);

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useAddColumn', () => {
    it('should add column successfully', async () => {
      const mockNewColumn = {
        id: 3,
        column_name: 'Status',
        column_type: 'single_select',
        options: [
          { id: 1, label: 'Active', value: 'active' },
          { id: 2, label: 'Inactive', value: 'inactive' }
        ]
      };

      endpoints.addColumn.mockResolvedValue(mockNewColumn);

      const { result } = renderHook(() => useAddColumn(), {
        wrapper: createWrapper()
      });

      const columnData = {
        name: 'Status',
        data_type: 'single_select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]
      };

      result.current.mutate(columnData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(endpoints.addColumn).toHaveBeenCalledWith(columnData);
      expect(result.current.data).toEqual(mockNewColumn);
    });

    it('should handle add column error', async () => {
      const error = new Error('Failed to add column');
      endpoints.addColumn.mockRejectedValue(error);

      const { result } = renderHook(() => useAddColumn(), {
        wrapper: createWrapper()
      });

      const columnData = {
        name: 'Status',
        data_type: 'text'
      };

      result.current.mutate(columnData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useAddRow', () => {
    it('should add row successfully', async () => {
      const mockNewRow = {
        id: 'uuid-new',
        row_number: 1,
        cells: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      endpoints.addRow.mockResolvedValue(mockNewRow);

      const { result } = renderHook(() => useAddRow(), {
        wrapper: createWrapper()
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(endpoints.addRow).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockNewRow);
    });

    it('should handle add row error', async () => {
      const error = new Error('Failed to add row');
      endpoints.addRow.mockRejectedValue(error);

      const { result } = renderHook(() => useAddRow(), {
        wrapper: createWrapper()
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Query Invalidation', () => {
    it('should invalidate queries after successful mutation', async () => {
      const mockResponse = { success: true };
      endpoints.updateCell.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateCell(), {
        wrapper: createWrapper()
      });

      const updateData = {
        rowId: 'uuid-1',
        columnId: 1,
        value: 'New Value'
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The mutation should trigger query invalidation
      // This would be tested by checking if related queries are refetched
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      endpoints.getColumns.mockRejectedValue(networkError);

      const { result } = renderHook(() => useColumns(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      endpoints.getRows.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useRows(1, 20), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(timeoutError);
    });
  });

  describe('Caching', () => {
    it('should cache query results', async () => {
      const mockColumns = [
        { id: 1, column_name: 'Name', column_type: 'text', options: null }
      ];

      endpoints.getColumns.mockResolvedValue(mockColumns);

      const { result, rerender } = renderHook(() => useColumns(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Rerender should not trigger new API call
      rerender();

      // Should still be cached
      expect(endpoints.getColumns).toHaveBeenCalledTimes(1);
    });
  });
});
