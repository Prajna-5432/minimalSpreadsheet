import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryRow from '../SummaryRow';

describe('SummaryRow Component', () => {
  const mockColumns = [
    { id: 1, column_name: 'Name', column_type: 'text' },
    { id: 2, column_name: 'Age', column_type: 'number' },
    { id: 3, column_name: 'Priority', column_type: 'single_select' },
    { id: 4, column_name: 'Skills', column_type: 'multi_select' }
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
      summary: {
        sum: 150,
        average: 30,
        count: 5
      }
    },
    {
      column_id: 3,
      column_name: 'Priority',
      column_type: 'single_select',
      summary: {
        most_frequent: 'High',
        count: 3
      }
    },
    {
      column_id: 4,
      column_name: 'Skills',
      column_type: 'multi_select',
      summary: {
        most_frequent: ['JavaScript', 'React'],
        count: 4
      }
    }
  ];

  describe('Rendering', () => {
    it('should render summary header', () => {
      render(<SummaryRow columns={mockColumns} summary={mockSummary} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should render summary for each column', () => {
      render(<SummaryRow columns={mockColumns} summary={mockSummary} />);

      // Text column should show no summary
      expect(screen.getByText('No summary')).toBeInTheDocument();

      // Number column should show statistics
      expect(screen.getByText('Sum: 150')).toBeInTheDocument();
      expect(screen.getByText('Average: 30')).toBeInTheDocument();
      expect(screen.getByText('Count: 5')).toBeInTheDocument();

      // Single select should show most frequent
      expect(screen.getByText('Most frequent: High')).toBeInTheDocument();

      // Multi select should show most frequent options
      expect(screen.getByText('Most frequent: JavaScript, React')).toBeInTheDocument();
    });
  });

  describe('Text Column Summary', () => {
    it('should show no summary for text columns', () => {
      const textSummary = [
        {
          column_id: 1,
          column_name: 'Name',
          column_type: 'text',
          summary: null
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(0, 1)} summary={textSummary} />);

      expect(screen.getByText('No summary')).toBeInTheDocument();
    });
  });

  describe('Number Column Summary', () => {
    it('should display number statistics correctly', () => {
      const numberSummary = [
        {
          column_id: 2,
          column_name: 'Age',
          column_type: 'number',
          summary: {
            sum: 100,
            average: 25,
            count: 4
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(1, 2)} summary={numberSummary} />);

      expect(screen.getByText('Sum: 100')).toBeInTheDocument();
      expect(screen.getByText('Average: 25')).toBeInTheDocument();
      expect(screen.getByText('Count: 4')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const numberSummary = [
        {
          column_id: 2,
          column_name: 'Age',
          column_type: 'number',
          summary: {
            sum: 0,
            average: 0,
            count: 0
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(1, 2)} summary={numberSummary} />);

      expect(screen.getByText('Sum: 0')).toBeInTheDocument();
      expect(screen.getByText('Average: 0')).toBeInTheDocument();
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      const numberSummary = [
        {
          column_id: 2,
          column_name: 'Age',
          column_type: 'number',
          summary: {
            sum: 150.5,
            average: 30.1,
            count: 5
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(1, 2)} summary={numberSummary} />);

      expect(screen.getByText('Sum: 150.5')).toBeInTheDocument();
      expect(screen.getByText('Average: 30.1')).toBeInTheDocument();
    });
  });

  describe('Single Select Summary', () => {
    it('should display most frequent option', () => {
      const singleSelectSummary = [
        {
          column_id: 3,
          column_name: 'Priority',
          column_type: 'single_select',
          summary: {
            most_frequent: 'Medium',
            count: 3
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(2, 3)} summary={singleSelectSummary} />);

      expect(screen.getByText('Most frequent: Medium')).toBeInTheDocument();
    });

    it('should handle no data case', () => {
      const singleSelectSummary = [
        {
          column_id: 3,
          column_name: 'Priority',
          column_type: 'single_select',
          summary: {
            most_frequent: null,
            count: 0
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(2, 3)} summary={singleSelectSummary} />);

      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Multi Select Summary', () => {
    it('should display most frequent options as comma-separated list', () => {
      const multiSelectSummary = [
        {
          column_id: 4,
          column_name: 'Skills',
          column_type: 'multi_select',
          summary: {
            most_frequent: ['JavaScript', 'Python', 'React'],
            count: 5
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(3, 4)} summary={multiSelectSummary} />);

      expect(screen.getByText('Most frequent: JavaScript, Python, React')).toBeInTheDocument();
    });

    it('should handle single most frequent option', () => {
      const multiSelectSummary = [
        {
          column_id: 4,
          column_name: 'Skills',
          column_type: 'multi_select',
          summary: {
            most_frequent: ['JavaScript'],
            count: 3
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(3, 4)} summary={multiSelectSummary} />);

      expect(screen.getByText('Most frequent: JavaScript')).toBeInTheDocument();
    });

    it('should handle empty most frequent array', () => {
      const multiSelectSummary = [
        {
          column_id: 4,
          column_name: 'Skills',
          column_type: 'multi_select',
          summary: {
            most_frequent: [],
            count: 0
          }
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(3, 4)} summary={multiSelectSummary} />);

      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing summary data', () => {
      const incompleteSummary = [
        {
          column_id: 1,
          column_name: 'Name',
          column_type: 'text',
          summary: null
        }
      ];

      render(<SummaryRow columns={mockColumns.slice(0, 1)} summary={incompleteSummary} />);

      expect(screen.getByText('No summary')).toBeInTheDocument();
    });

    it('should handle empty columns array', () => {
      render(<SummaryRow columns={[]} summary={[]} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should handle null summary', () => {
      render(<SummaryRow columns={mockColumns} summary={null} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should handle undefined summary', () => {
      render(<SummaryRow columns={mockColumns} summary={undefined} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
    });
  });

  describe('Data Type Handling', () => {
    it('should handle unknown column types gracefully', () => {
      const unknownTypeColumns = [
        { id: 1, column_name: 'Unknown', column_type: 'unknown_type' }
      ];

      const unknownTypeSummary = [
        {
          column_id: 1,
          column_name: 'Unknown',
          column_type: 'unknown_type',
          summary: { some_data: 'value' }
        }
      ];

      render(<SummaryRow columns={unknownTypeColumns} summary={unknownTypeSummary} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply correct CSS classes', () => {
      const { container } = render(
        <SummaryRow columns={mockColumns} summary={mockSummary} />
      );

      expect(container.querySelector('.summary-row')).toBeInTheDocument();
      expect(container.querySelector('.summary-header')).toBeInTheDocument();
    });

    it('should render summary cells with proper styling', () => {
      const { container } = render(
        <SummaryRow columns={mockColumns} summary={mockSummary} />
      );

      const summaryCells = container.querySelectorAll('.summary-cell');
      expect(summaryCells.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      const largeColumns = Array(100).fill(null).map((_, index) => ({
        id: index + 1,
        column_name: `Column ${index + 1}`,
        column_type: 'text'
      }));

      const largeSummary = Array(100).fill(null).map((_, index) => ({
        column_id: index + 1,
        column_name: `Column ${index + 1}`,
        column_type: 'text',
        summary: null
      }));

      const startTime = performance.now();
      render(<SummaryRow columns={largeColumns} summary={largeSummary} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
