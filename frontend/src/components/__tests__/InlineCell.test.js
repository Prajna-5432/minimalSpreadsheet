import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InlineCell from '../InlineCell';

// Mock the API
jest.mock('../../api/endpoints', () => ({
  updateCell: jest.fn()
}));

// Mock the useUpdateCell hook
jest.mock('../../hooks/useApi', () => ({
  useUpdateCell: () => ({
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

describe('InlineCell Component', () => {
  const mockRow = { id: 'uuid-1', row_number: 1 };
  const mockColumn = { id: 1, column_name: 'Name', column_type: 'text' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Column', () => {
    it('should render text value correctly', () => {
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value="John Doe" 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show empty state for null value', () => {
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value={null} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Click to edit')).toBeInTheDocument();
    });

    it('should enter edit mode on click', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value="John Doe" 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('John Doe'));
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should save on Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value="John Doe" 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('John Doe'));
      const input = screen.getByDisplayValue('John Doe');
      await user.clear(input);
      await user.type(input, 'Jane Doe');
      await user.keyboard('{Enter}');

      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Jane Doe')).not.toBeInTheDocument();
      });
    });

    it('should cancel on Escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value="John Doe" 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('John Doe'));
      const input = screen.getByDisplayValue('John Doe');
      await user.clear(input);
      await user.type(input, 'Jane Doe');
      await user.keyboard('{Escape}');

      // Should revert to original value
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Number Column', () => {
    const numberColumn = { ...mockColumn, column_type: 'number' };

    it('should render number value correctly', () => {
      render(
        <InlineCell 
          row={mockRow} 
          column={numberColumn} 
          value={42} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should show number input in edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={numberColumn} 
          value={42} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('42'));
      
      const input = screen.getByDisplayValue('42');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('DateTime Column', () => {
    const dateTimeColumn = { ...mockColumn, column_type: 'datetime' };

    it('should render datetime value correctly', () => {
      const dateValue = '2024-01-15T10:30:00Z';
      render(
        <InlineCell 
          row={mockRow} 
          column={dateTimeColumn} 
          value={dateValue} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('should show datetime input in edit mode', async () => {
      const user = userEvent.setup();
      const dateValue = '2024-01-15T10:30:00Z';
      
      render(
        <InlineCell 
          row={mockRow} 
          column={dateTimeColumn} 
          value={dateValue} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText(/1\/15\/2024/));
      
      const input = screen.getByDisplayValue('2024-01-15T10:30');
      expect(input).toHaveAttribute('type', 'datetime-local');
    });
  });

  describe('Single Select Column', () => {
    const singleSelectColumn = {
      ...mockColumn,
      column_type: 'single_select',
      options: [
        { id: 1, label: 'High', value: 'high' },
        { id: 2, label: 'Medium', value: 'medium' },
        { id: 3, label: 'Low', value: 'low' }
      ]
    };

    it('should render selected option label', () => {
      render(
        <InlineCell 
          row={mockRow} 
          column={singleSelectColumn} 
          value={1} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should show dropdown in edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={singleSelectColumn} 
          value={1} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('High'));
      
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('should handle option selection', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={singleSelectColumn} 
          value={1} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('High'));
      
      const select = screen.getByDisplayValue('1');
      await user.selectOptions(select, '2');

      // Should save and update display
      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeInTheDocument();
      });
    });
  });

  describe('Multi Select Column', () => {
    const multiSelectColumn = {
      ...mockColumn,
      column_type: 'multi_select',
      options: [
        { id: 1, label: 'JavaScript', value: 'javascript' },
        { id: 2, label: 'Python', value: 'python' },
        { id: 3, label: 'React', value: 'react' }
      ]
    };

    it('should render selected options as comma-separated list', () => {
      render(
        <InlineCell 
          row={mockRow} 
          column={multiSelectColumn} 
          value={[1, 3]} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('JavaScript, React')).toBeInTheDocument();
    });

    it('should show empty state for no selections', () => {
      render(
        <InlineCell 
          row={mockRow} 
          column={multiSelectColumn} 
          value={[]} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Click to select skills')).toBeInTheDocument();
    });

    it('should toggle edit mode on click', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={multiSelectColumn} 
          value={[1]} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('JavaScript'));
      
      expect(screen.getByText('Select Skills:')).toBeInTheDocument();
      expect(screen.getByText('✓ Done')).toBeInTheDocument();
    });

    it('should show checkboxes for options', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={multiSelectColumn} 
          value={[1]} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('JavaScript'));
      
      const javascriptCheckbox = screen.getByLabelText('JavaScript');
      const pythonCheckbox = screen.getByLabelText('Python');
      const reactCheckbox = screen.getByLabelText('React');

      expect(javascriptCheckbox).toBeChecked();
      expect(pythonCheckbox).not.toBeChecked();
      expect(reactCheckbox).not.toBeChecked();
    });

    it('should handle checkbox changes', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={multiSelectColumn} 
          value={[1]} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('JavaScript'));
      
      const pythonCheckbox = screen.getByLabelText('Python');
      await user.click(pythonCheckbox);

      // Should save and update display
      await waitFor(() => {
        expect(screen.getByText('JavaScript, Python')).toBeInTheDocument();
      });
    });

    it('should close on Done button click', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={multiSelectColumn} 
          value={[1]} 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('JavaScript'));
      await user.click(screen.getByText('✓ Done'));

      // Should close edit mode
      expect(screen.queryByText('Select Skills:')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing options gracefully', () => {
      const columnWithoutOptions = {
        ...mockColumn,
        column_type: 'single_select',
        options: null
      };

      render(
        <InlineCell 
          row={mockRow} 
          column={columnWithoutOptions} 
          value={1} 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No options available')).toBeInTheDocument();
    });

    it('should handle invalid column type', () => {
      const invalidColumn = {
        ...mockColumn,
        column_type: 'invalid_type'
      };

      render(
        <InlineCell 
          row={mockRow} 
          column={invalidColumn} 
          value="test" 
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value="John Doe" 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('John Doe'));
      
      const input = screen.getByDisplayValue('John Doe');
      expect(input).toHaveAttribute('aria-label', 'Edit Name');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineCell 
          row={mockRow} 
          column={mockColumn} 
          value="John Doe" 
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('John Doe'));
      
      const input = screen.getByDisplayValue('John Doe');
      expect(input).toHaveFocus();
    });
  });
});
