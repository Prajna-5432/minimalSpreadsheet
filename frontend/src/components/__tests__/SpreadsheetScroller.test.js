import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpreadsheetScroller from '../SpreadsheetScroller';

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

describe('SpreadsheetScroller', () => {
  const defaultProps = {
    children: <div data-testid="content">Test Content</div>,
    width: '100%',
    height: '400px'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<SpreadsheetScroller {...defaultProps} />);
    
    const scroller = screen.getByRole('grid');
    expect(scroller).toBeInTheDocument();
    expect(scroller).toHaveStyle({ width: '100%', height: '400px' });
    
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
  });

  it('applies custom className and style', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <SpreadsheetScroller 
        {...defaultProps} 
        className="custom-class"
        style={customStyle}
      />
    );
    
    const scroller = screen.getByRole('grid');
    expect(scroller).toHaveClass('custom-class');
    expect(scroller).toHaveStyle({ backgroundColor: 'red' });
  });

  it('handles keyboard navigation', async () => {
    const onViewportChange = jest.fn();
    const onCellFocus = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onViewportChange={onViewportChange}
        onCellFocus={onCellFocus}
        enableKeyboard={true}
      />
    );
    
    const scroller = screen.getByRole('grid');
    scroller.focus();
    
    // Test arrow key navigation
    fireEvent.keyDown(scroller, { key: 'ArrowRight' });
    fireEvent.keyDown(scroller, { key: 'ArrowDown' });
    
    await waitFor(() => {
      expect(onViewportChange).toHaveBeenCalled();
      expect(onCellFocus).toHaveBeenCalled();
    });
  });

  it('handles wheel events', () => {
    const onViewportChange = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onViewportChange={onViewportChange}
        enableWheel={true}
      />
    );
    
    const scroller = screen.getByRole('grid');
    
    // Mock scroll properties
    Object.defineProperty(scroller, 'scrollLeft', {
      writable: true,
      value: 0
    });
    Object.defineProperty(scroller, 'scrollTop', {
      writable: true,
      value: 0
    });
    Object.defineProperty(scroller, 'clientWidth', {
      value: 400
    });
    Object.defineProperty(scroller, 'clientHeight', {
      value: 300
    });
    Object.defineProperty(scroller, 'scrollWidth', {
      value: 800
    });
    Object.defineProperty(scroller, 'scrollHeight', {
      value: 600
    });
    
    fireEvent.wheel(scroller, { deltaX: 50, deltaY: 30 });
    
    expect(onViewportChange).toHaveBeenCalled();
  });

  it('handles touch events', () => {
    const onViewportChange = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onViewportChange={onViewportChange}
        enableTouch={true}
      />
    );
    
    const scroller = screen.getByRole('grid');
    
    // Mock scroll properties
    Object.defineProperty(scroller, 'scrollLeft', {
      writable: true,
      value: 0
    });
    Object.defineProperty(scroller, 'scrollTop', {
      writable: true,
      value: 0
    });
    Object.defineProperty(scroller, 'clientWidth', {
      value: 400
    });
    Object.defineProperty(scroller, 'clientHeight', {
      value: 300
    });
    Object.defineProperty(scroller, 'scrollWidth', {
      value: 800
    });
    Object.defineProperty(scroller, 'scrollHeight', {
      value: 600
    });
    
    // Touch start
    fireEvent.touchStart(scroller, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    // Touch move
    fireEvent.touchMove(scroller, {
      touches: [{ clientX: 80, clientY: 80 }]
    });
    
    // Touch end
    fireEvent.touchEnd(scroller, {
      changedTouches: [{ clientX: 80, clientY: 80 }]
    });
    
    expect(onViewportChange).toHaveBeenCalled();
  });

  it('respects disabled features', () => {
    const onViewportChange = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onViewportChange={onViewportChange}
        enableKeyboard={false}
        enableWheel={false}
        enableTouch={false}
      />
    );
    
    const scroller = screen.getByRole('grid');
    scroller.focus();
    
    // These should not trigger callbacks
    fireEvent.keyDown(scroller, { key: 'ArrowRight' });
    fireEvent.wheel(scroller, { deltaX: 50, deltaY: 30 });
    fireEvent.touchStart(scroller, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it('handles scroll start and end callbacks', async () => {
    const onScrollStart = jest.fn();
    const onScrollEnd = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onScrollStart={onScrollStart}
        onScrollEnd={onScrollEnd}
      />
    );
    
    const scroller = screen.getByRole('grid');
    
    // Trigger scroll
    fireEvent.scroll(scroller);
    
    await waitFor(() => {
      expect(onScrollStart).toHaveBeenCalled();
    });
    
    // Wait for scroll end timeout
    await waitFor(() => {
      expect(onScrollEnd).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('handles Home and End keys', () => {
    const onViewportChange = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onViewportChange={onViewportChange}
        enableKeyboard={true}
      />
    );
    
    const scroller = screen.getByRole('grid');
    
    // Mock scroll properties
    Object.defineProperty(scroller, 'scrollLeft', {
      writable: true,
      value: 100
    });
    Object.defineProperty(scroller, 'scrollTop', {
      writable: true,
      value: 100
    });
    Object.defineProperty(scroller, 'clientWidth', {
      value: 400
    });
    Object.defineProperty(scroller, 'clientHeight', {
      value: 300
    });
    Object.defineProperty(scroller, 'scrollWidth', {
      value: 800
    });
    Object.defineProperty(scroller, 'scrollHeight', {
      value: 600
    });
    
    fireEvent.keyDown(scroller, { key: 'Home' });
    fireEvent.keyDown(scroller, { key: 'End' });
    
    expect(onViewportChange).toHaveBeenCalled();
  });

  it('handles Page Up and Page Down keys', () => {
    const onViewportChange = jest.fn();
    
    render(
      <SpreadsheetScroller 
        {...defaultProps}
        onViewportChange={onViewportChange}
        enableKeyboard={true}
      />
    );
    
    const scroller = screen.getByRole('grid');
    
    // Mock scroll properties
    Object.defineProperty(scroller, 'scrollLeft', {
      writable: true,
      value: 100
    });
    Object.defineProperty(scroller, 'scrollTop', {
      writable: true,
      value: 100
    });
    Object.defineProperty(scroller, 'clientWidth', {
      value: 400
    });
    Object.defineProperty(scroller, 'clientHeight', {
      value: 300
    });
    Object.defineProperty(scroller, 'scrollWidth', {
      value: 800
    });
    Object.defineProperty(scroller, 'scrollHeight', {
      value: 600
    });
    
    fireEvent.keyDown(scroller, { key: 'PageUp' });
    fireEvent.keyDown(scroller, { key: 'PageDown' });
    
    expect(onViewportChange).toHaveBeenCalled();
  });

  it('does not interfere with form inputs', () => {
    const onViewportChange = jest.fn();
    
    render(
      <div>
        <input data-testid="input" />
        <SpreadsheetScroller 
          {...defaultProps}
          onViewportChange={onViewportChange}
          enableKeyboard={true}
        />
      </div>
    );
    
    const input = screen.getByTestId('input');
    input.focus();
    
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<SpreadsheetScroller {...defaultProps} />);
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });
});
