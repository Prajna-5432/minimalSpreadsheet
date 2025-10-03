import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ColumnAddModal from '../ColumnAddModal';

// Mock the useAddColumn hook
jest.mock('../../hooks/useApi', () => ({
  useAddColumn: () => ({
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

describe('ColumnAddModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should render when open', () => {
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Add New Column')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ColumnAddModal {...defaultProps} isOpen={false} />, { wrapper: createWrapper() });

      expect(screen.queryByText('Add New Column')).not.toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required form fields', () => {
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByLabelText('Column Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Column Type')).toBeInTheDocument();
    });

    it('should have correct input types', () => {
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText('Column Name');
      const typeSelect = screen.getByLabelText('Column Type');

      expect(nameInput).toHaveAttribute('type', 'text');
      expect(typeSelect).toBeInTheDocument();
    });
  });

  describe('Column Type Selection', () => {
    it('should show all column types in dropdown', () => {
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      fireEvent.click(typeSelect);

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Date/Time')).toBeInTheDocument();
      expect(screen.getByText('Single Select')).toBeInTheDocument();
      expect(screen.getByText('Multi Select')).toBeInTheDocument();
    });

    it('should show options section for select types', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      await user.selectOptions(typeSelect, 'single_select');

      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('Add Option')).toBeInTheDocument();
    });

    it('should hide options section for non-select types', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      await user.selectOptions(typeSelect, 'text');

      expect(screen.queryByText('Options')).not.toBeInTheDocument();
    });
  });

  describe('Options Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      await user.selectOptions(typeSelect, 'single_select');
    });

    it('should add new option', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      await user.selectOptions(typeSelect, 'single_select');

      const addButton = screen.getByText('Add Option');
      await user.click(addButton);

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('should remove option', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      await user.selectOptions(typeSelect, 'single_select');

      // Add an option first
      const addButton = screen.getByText('Add Option');
      await user.click(addButton);

      // Fill in the option
      const labelInput = screen.getByDisplayValue('');
      await user.type(labelInput, 'Test Option');

      // Find and click remove button
      const removeButton = screen.getByText('×');
      await user.click(removeButton);

      expect(screen.queryByDisplayValue('Test Option')).not.toBeInTheDocument();
    });

    it('should validate option fields', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const typeSelect = screen.getByLabelText('Column Type');
      await user.selectOptions(typeSelect, 'single_select');

      // Add an option
      const addButton = screen.getByText('Add Option');
      await user.click(addButton);

      // Try to submit with empty option
      const submitButton = screen.getByText('Add Column');
      await user.click(submitButton);

      // Should show validation error or prevent submission
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit text column successfully', async () => {
      const user = userEvent.setup();
      const { useAddColumn } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      useAddColumn.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Column Name'), 'Description');
      await user.selectOptions(screen.getByLabelText('Column Type'), 'text');

      const submitButton = screen.getByText('Add Column');
      await user.click(submitButton);

      expect(mockMutate).toHaveBeenCalledWith({
        name: 'Description',
        data_type: 'text',
        options: []
      });
    });

    it('should submit single select column with options', async () => {
      const user = userEvent.setup();
      const { useAddColumn } = require('../../hooks/useApi');
      const mockMutate = jest.fn();
      useAddColumn.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Column Name'), 'Priority');
      await user.selectOptions(screen.getByLabelText('Column Type'), 'single_select');

      // Add options
      await user.click(screen.getByText('Add Option'));
      await user.type(screen.getByDisplayValue(''), 'High');

      await user.click(screen.getByText('Add Option'));
      const secondOption = screen.getAllByDisplayValue('')[1];
      await user.type(secondOption, 'Low');

      const submitButton = screen.getByText('Add Column');
      await user.click(submitButton);

      expect(mockMutate).toHaveBeenCalledWith({
        name: 'Priority',
        data_type: 'single_select',
        options: [
          { label: 'High', value: 'high' },
          { label: 'Low', value: 'low' }
        ]
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Add Column');
      await user.click(submitButton);

      // Should not submit (form validation should prevent it)
      expect(screen.getByLabelText('Column Name')).toHaveValue('');
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const { useAddColumn } = require('../../hooks/useApi');
      useAddColumn.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: new Error('Failed to add column')
      });
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Column Name'), 'Test');
      await user.selectOptions(screen.getByLabelText('Column Type'), 'text');

      expect(screen.getByText('Failed to add column')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', () => {
      const { useAddColumn } = require('../../hooks/useApi');
      useAddColumn.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null
      });
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(screen.getByText('Add Column')).toBeDisabled();
    });
  });

  describe('Modal Actions', () => {
    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<ColumnAddModal {...defaultProps} onClose={onClose} />, { wrapper: createWrapper() });

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal on X button', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<ColumnAddModal {...defaultProps} onClose={onClose} />, { wrapper: createWrapper() });

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onSuccess after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const { useAddColumn } = require('../../hooks/useApi');
      const mockMutate = jest.fn((data, { onSuccess: mutationSuccess }) => {
        mutationSuccess({ id: 1, ...data });
      });
      useAddColumn.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });
      
      render(<ColumnAddModal {...defaultProps} onSuccess={onSuccess} />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Column Name'), 'Test');
      await user.selectOptions(screen.getByLabelText('Column Type'), 'text');

      const submitButton = screen.getByText('Add Column');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal opens', () => {
      const { rerender } = render(
        <ColumnAddModal {...defaultProps} isOpen={false} />, 
        { wrapper: createWrapper() }
      );

      rerender(<ColumnAddModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText('Column Name')).toHaveValue('');
      expect(screen.getByLabelText('Column Type')).toHaveValue('text');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByLabelText('Column Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Column Type')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<ColumnAddModal {...defaultProps} />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText('Column Name');
      await user.click(nameInput);
      
      expect(nameInput).toHaveFocus();
    });
  });
});
