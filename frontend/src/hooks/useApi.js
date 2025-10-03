import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { columnsApi, rowsApi, cellApi, summaryApi } from '../api/endpoints';

// Columns hooks
export const useColumns = () => {
  return useQuery({
    queryKey: ['columns'],
    queryFn: async () => {
      console.log('Fetching columns from API...');
      try {
        const response = await columnsApi.getColumns();
        console.log('Columns API response:', response.data);
        console.log('Number of columns received:', response.data?.length);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching columns:', error);
        // Don't return empty array on error, let React Query handle retries
        throw error;
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        console.log(`Retrying columns fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useCreateColumn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: columnsApi.createColumn,
    onSuccess: (data) => {
      console.log('Column created, invalidating cache...');
      // Invalidate and refetch columns
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['columns'] });
      queryClient.refetchQueries({ queryKey: ['summary'] });
    },
  });
};

export const useAddColumn = useCreateColumn;

// Rows hooks
export const useRows = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['rows', page, limit],
    queryFn: async () => {
      const response = await rowsApi.getRows(page, limit);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateRow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rowsApi.createRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rows'] });
    },
  });
};

export const useAddRow = useCreateRow;

// Cell hooks
export const useUpdateCell = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: cellApi.updateCell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rows'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

// Summary hooks
export const useSummary = () => {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      try {
        const response = await summaryApi.getSummary();
        return response.data.summaries; // Extract summaries array from API response
      } catch (error) {
        console.error('Error fetching summary:', error);
        throw error;
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        console.log(`Retrying summary fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
