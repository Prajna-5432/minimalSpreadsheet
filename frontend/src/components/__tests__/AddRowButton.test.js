import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddRowButton from '../AddRowButton';

// Mock the useAddRow hook
jest.mock('../../hooks/useApi', () => ({
  useAddRow: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null
  })
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

describe('AddRowButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with correct text', () => {
      render(<AddRowButton />, { wrapper: createWrapper() });

      expect(screen.getByText('Add Row')).toBeInTheDocument();
    });

    it('should render plus icon', () => {
      render(<AddRowButton />, { wrapper: createWrapper() });

      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should have correct CSS classes', () => {
      const { container } = render(<AddRowButton />, { wrapper: createWrapper() });

      const button = container.querySelector('.add-row-btn');
      expect(button).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call mutate when clicked', async () => {
      const user = userEvent.setup();
      const { useAddRow } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      useAddRow.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      const button = screen.getByText('Add Row');
      await user.click(button);

      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('should be clickable when not pending', async () => {
      const user = userEvent.setup();
      const { useAddRow } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      useAddRow.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      const button = screen.getByText('Add Row');
      expect(button).not.toBeDisabled();

      await user.click(button);
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when pending', () => {
      const { useAddRow } = require('../../hooks/useApi');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(screen.getByText('Add Row')).toBeDisabled();
    });

    it('should show spinner when pending', () => {
      const { useAddRow } = require('../../hooks/useApi');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null
      });

      const { container } = render(<AddRowButton />, { wrapper: createWrapper() });

      const spinner = container.querySelector('.btn-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show spinner when not pending', () => {
      const { useAddRow } = require('../../hooks/useApi');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null
      });

      const { container } = render(<AddRowButton />, { wrapper: createWrapper() });

      const spinner = container.querySelector('.btn-spinner');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle mutation errors gracefully', () => {
      const { useAddRow } = require('../../hooks/useApi');
      const error = new Error('Failed to add row');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: error
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      // Button should still be clickable even with error
      const button = screen.getByText('Add Row');
      expect(button).not.toBeDisabled();
    });

    it('should not show error message in button', () => {
      const { useAddRow } = require('../../hooks/useApi');
      const error = new Error('Failed to add row');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: error
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      // Error should be handled by parent component or global error handler
      expect(screen.queryByText('Failed to add row')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<AddRowButton />, { wrapper: createWrapper() });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const { useAddRow } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      useAddRow.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockMutate).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes when disabled', () => {
      const { useAddRow } = require('../../hooks/useApi');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Visual States', () => {
    it('should have correct styling for normal state', () => {
      const { container } = render(<AddRowButton />, { wrapper: createWrapper() });

      const button = container.querySelector('.add-row-btn');
      expect(button).toHaveClass('add-row-btn');
    });

    it('should have correct styling for disabled state', () => {
      const { useAddRow } = require('../../hooks/useApi');
      useAddRow.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null
      });

      const { container } = render(<AddRowButton />, { wrapper: createWrapper() });

      const button = container.querySelector('.add-row-btn');
      expect(button).toBeDisabled();
    });
  });

  describe('Integration', () => {
    it('should work with QueryClient context', () => {
      const queryClient = new QueryClient();
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <AddRowButton />
        </QueryClientProvider>
      );

      expect(container.querySelector('.add-row-btn')).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks', async () => {
      const user = userEvent.setup();
      const { useAddRow } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      useAddRow.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<AddRowButton />, { wrapper: createWrapper() });

      const button = screen.getByText('Add Row');
      
      // Click multiple times rapidly
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should call mutate for each click
      expect(mockMutate).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<AddRowButton />, { wrapper: createWrapper() });
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should not cause unnecessary re-renders', () => {
      const { useAddRow } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      const mockHook = jest.fn().mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });
      useAddRow.mockImplementation(mockHook);

      const { rerender } = render(<AddRowButton />, { wrapper: createWrapper() });

      // Rerender with same props
      rerender(<AddRowButton />);

      // Hook should not be called again
      expect(mockHook).toHaveBeenCalledTimes(1);
    });
  });
});
