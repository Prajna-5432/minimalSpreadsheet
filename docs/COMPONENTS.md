# 🧩 Frontend Components Documentation

## Overview

The frontend is built with React and uses a component-based architecture. Each component is self-contained with its own CSS file and specific responsibilities.

## Component Architecture

```
src/
├── components/
│   ├── TablePage.js          # Main spreadsheet component
│   ├── TablePage.css         # Main table styling
│   ├── InlineCell.js         # Editable cell component
│   ├── InlineCell.css         # Cell editing styles
│   ├── ColumnAddModal.js      # Add column modal
│   ├── ColumnAddModal.css     # Modal styling
│   ├── AddRowButton.js        # Add row button
│   ├── AddRowButton.css       # Button styling
│   ├── SummaryRow.js          # Summary statistics
│   └── SummaryRow.css         # Summary styling
├── api/
│   ├── axios.js              # HTTP client config
│   └── endpoints.js          # API functions
└── hooks/
    └── useApi.js             # React Query hooks
```

## Core Components

### TablePage

**File:** `src/components/TablePage.js`

**Purpose:** Main spreadsheet component that orchestrates the entire table view.

**Props:** None (fetches all data internally)

**Features:**
- Fetches columns, rows, and summary data
- Renders the complete table structure
- Handles pagination
- Integrates all other components
- Manages loading and error states

**Key Methods:**
- `useColumns()` - Fetches column definitions
- `useRows()` - Fetches row data with pagination
- `useSummary()` - Fetches column statistics

**State Management:**
- Uses React Query for data fetching
- Automatic background updates
- Optimistic UI updates
- Error handling and retry logic

**Usage:**
```jsx
import TablePage from './components/TablePage';

function App() {
  return <TablePage />;
}
```

### InlineCell

**File:** `src/components/InlineCell.js`

**Purpose:** Editable cell component that handles different data types.

**Props:**
- `row` - Row object with ID and metadata
- `column` - Column object with type and options
- `value` - Current cell value

**Features:**
- **Text/Number**: Direct input editing
- **DateTime**: Date picker input
- **Single Select**: Dropdown selection
- **Multi Select**: Checkbox group interface
- **Inline editing**: Click to edit, blur/Enter to save
- **Optimistic updates**: Immediate UI feedback
- **Validation**: Client-side validation

**Data Types Supported:**
- `text` - Free-form text input
- `number` - Numeric input with validation
- `datetime` - Date/time picker
- `single_select` - Dropdown with options
- `multi_select` - Checkbox group

**Usage:**
```jsx
<InlineCell 
  row={row} 
  column={column} 
  value={cell?.value} 
/>
```

**Key Methods:**
- `handleCellClick()` - Start editing mode
- `handleSave()` - Save cell value
- `handleMultiSelectChange()` - Handle multi-select changes
- `formatDisplayValue()` - Format value for display

### ColumnAddModal

**File:** `src/components/ColumnAddModal.js`

**Purpose:** Modal for adding new columns with different data types.

**Props:**
- `isOpen` - Modal visibility state
- `onClose` - Close modal callback
- `onSuccess` - Success callback

**Features:**
- **Form validation**: Client-side validation
- **Dynamic options**: For select-type columns
- **Type-specific configuration**: Different fields per type
- **Option management**: Add/remove options for selects
- **Error handling**: Display validation errors

**Column Types:**
- `text` - Basic text column
- `number` - Numeric column
- `datetime` - Date/time column
- `single_select` - Dropdown column
- `multi_select` - Multi-select column

**Usage:**
```jsx
<ColumnAddModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    setShowModal(false);
    // Refresh data
  }}
/>
```

### AddRowButton

**File:** `src/components/AddRowButton.js`

**Purpose:** Button component for adding new rows.

**Props:** None (handles state internally)

**Features:**
- **Loading states**: Shows spinner during creation
- **Optimistic updates**: Immediate UI feedback
- **Error handling**: Displays error messages
- **Disabled state**: Prevents multiple clicks

**Usage:**
```jsx
<AddRowButton />
```

**Key Methods:**
- `handleAddRow()` - Create new row
- `useCreateRow()` - React Query mutation

### SummaryRow

**File:** `src/components/SummaryRow.js`

**Purpose:** Displays column statistics at the top of the table.

**Props:**
- `columns` - Array of column definitions
- `summary` - Summary data from API

**Features:**
- **Real-time calculations**: Updates with data changes
- **Type-specific summaries**: Different stats per type
- **Visual indicators**: Color-coded statistics
- **Responsive design**: Adapts to column count

**Summary Types:**
- `text` - No summary (null)
- `number` - Sum, average, count
- `datetime` - Closest to now
- `single_select` - Most frequent option
- `multi_select` - Most frequent options

**Usage:**
```jsx
<SummaryRow 
  columns={columns} 
  summary={summary} 
/>
```

## API Integration

### Axios Configuration

**File:** `src/api/axios.js`

**Purpose:** Centralized HTTP client configuration.

**Features:**
- Base URL configuration
- Request/response interceptors
- Error handling
- Timeout settings

**Configuration:**
```javascript
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### API Endpoints

**File:** `src/api/endpoints.js`

**Purpose:** API function definitions.

**Functions:**
- `getColumns()` - Fetch all columns
- `getRows(page, limit)` - Fetch paginated rows
- `updateCell(rowId, columnId, value)` - Update cell value
- `getSummary()` - Fetch column summaries
- `addColumn(columnData)` - Create new column
- `addRow()` - Create new row

### React Query Hooks

**File:** `src/hooks/useApi.js`

**Purpose:** Custom hooks for data fetching and mutations.

**Hooks:**
- `useColumns()` - Columns query
- `useRows(page, limit)` - Rows query
- `useSummary()` - Summary query
- `useUpdateCell()` - Cell update mutation
- `useAddColumn()` - Column creation mutation
- `useAddRow()` - Row creation mutation

**Features:**
- Automatic caching
- Background updates
- Optimistic updates
- Error handling
- Retry logic

## Styling

### CSS Architecture

Each component has its own CSS file for scoped styling:

- **TablePage.css** - Main table layout and styling
- **InlineCell.css** - Cell editing styles
- **ColumnAddModal.css** - Modal styling
- **AddRowButton.css** - Button styling
- **SummaryRow.css** - Summary display styles

### Design System

**Colors:**
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Yellow)
- Error: `#ef4444` (Red)
- Neutral: `#6b7280` (Gray)

**Typography:**
- Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`
- Font Sizes: `12px`, `14px`, `16px`, `20px`, `24px`
- Font Weights: `400`, `500`, `600`

**Spacing:**
- Base Unit: `4px`
- Common Spacing: `8px`, `12px`, `16px`, `20px`, `24px`

**Border Radius:**
- Small: `4px`
- Medium: `6px`
- Large: `8px`

## State Management

### React Query Integration

**Data Fetching:**
```javascript
const { data: columns, isLoading, error } = useColumns();
```

**Mutations:**
```javascript
const updateCellMutation = useUpdateCell();

const handleSave = () => {
  updateCellMutation.mutate({
    rowId: row.id,
    columnId: column.id,
    value: newValue
  });
};
```

**Cache Management:**
```javascript
// Invalidate queries after mutations
queryClient.invalidateQueries({ queryKey: ['rows'] });
```

### Component State

**Local State:**
- Editing mode (`isEditing`)
- Form values (`editValue`)
- Loading states (`isLoading`)
- Error states (`error`)

**Shared State:**
- Column definitions
- Row data
- Summary statistics
- Pagination state

## Event Handling

### Cell Editing Events

**Click to Edit:**
```javascript
const handleCellClick = () => {
  if (column.column_type === 'multi_select') {
    setIsEditing(!isEditing);
    return;
  }
  setIsEditing(true);
  setEditValue(value || '');
};
```

**Save on Blur/Enter:**
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    handleSave();
  } else if (e.key === 'Escape') {
    setIsEditing(false);
  }
};
```

### Form Events

**Input Changes:**
```javascript
const handleInputChange = (e) => {
  setEditValue(e.target.value);
};
```

**Select Changes:**
```javascript
const handleSelectChange = (e) => {
  const newValue = e.target.value;
  setEditValue(newValue);
  handleSave(newValue);
};
```

## Performance Optimization

### React Query Benefits

- **Automatic Caching**: Reduces API calls
- **Background Updates**: Keeps data fresh
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Automatic retry logic

### Component Optimization

- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Load components on demand
- **Virtual Scrolling**: For large datasets
- **Debounced Inputs**: Reduce API calls

### Bundle Optimization

- **Code Splitting**: Split components by route
- **Tree Shaking**: Remove unused code
- **Compression**: Gzip/Brotli compression
- **CDN**: Serve static assets from CDN

## Testing

### Component Testing

**Test Structure:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import InlineCell from './InlineCell';

test('renders text cell', () => {
  render(<InlineCell row={mockRow} column={mockColumn} value="test" />);
  expect(screen.getByText('test')).toBeInTheDocument();
});
```

**Test Cases:**
- Component rendering
- User interactions
- Event handling
- Error states
- Loading states

### Integration Testing

**API Integration:**
- Mock API responses
- Test error handling
- Verify data flow
- Test optimistic updates

## Accessibility

### ARIA Labels

```jsx
<input
  type="text"
  aria-label={`Edit ${column.column_name}`}
  value={editValue}
  onChange={handleInputChange}
/>
```

### Keyboard Navigation

- **Tab**: Navigate between cells
- **Enter**: Save cell value
- **Escape**: Cancel editing
- **Arrow Keys**: Navigate within cell

### Screen Reader Support

- **Semantic HTML**: Proper table structure
- **ARIA Labels**: Descriptive labels
- **Focus Management**: Clear focus indicators
- **Error Announcements**: Screen reader friendly errors

## Browser Support

### Supported Browsers

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Polyfills

- **Date Input**: Fallback for older browsers
- **CSS Grid**: Graceful degradation
- **Fetch API**: Axios handles compatibility

## Deployment

### Build Process

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Serve static files
npm start
```

### Environment Configuration

**Development:**
```javascript
const API_BASE_URL = 'http://localhost:3001';
```

**Production:**
```javascript
const API_BASE_URL = 'https://api.yourdomain.com';
```

### Performance Monitoring

- **Bundle Analysis**: Webpack bundle analyzer
- **Performance Metrics**: Core Web Vitals
- **Error Tracking**: Sentry integration
- **Analytics**: User behavior tracking
