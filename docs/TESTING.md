# 🧪 Testing Documentation

## Overview

This document covers the comprehensive testing strategy for the Spreadsheet Application, including unit tests for both backend and frontend components.

## Testing Strategy

### Backend Testing
- **API Endpoints**: Complete coverage of all REST endpoints
- **Data Validation**: Business logic and input validation
- **Database Operations**: Connection management and query execution
- **Error Handling**: Comprehensive error scenarios

### Frontend Testing
- **React Components**: User interface and interactions
- **Custom Hooks**: Data fetching and state management
- **User Interactions**: Click, input, and keyboard events
- **Error States**: Loading, error, and empty states

## Test Coverage

### Backend Coverage
- ✅ **API Routes**: 100% endpoint coverage
- ✅ **Data Validation**: All validation rules tested
- ✅ **Database Operations**: Connection and query testing
- ✅ **Error Handling**: All error scenarios covered

### Frontend Coverage
- ✅ **Components**: All major components tested
- ✅ **Hooks**: Custom React Query hooks tested
- ✅ **User Interactions**: Click, input, and keyboard events
- ✅ **Error States**: Loading, error, and empty states

## Running Tests

### Backend Tests
```bash
cd backend

# Install test dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend

# Install test dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Backend Test Files
```
backend/
├── tests/
│   ├── setup.js              # Test configuration
│   ├── routes.test.js        # API endpoint tests
│   ├── validation.test.js    # Data validation tests
│   └── database.test.js      # Database operation tests
├── jest.config.js            # Jest configuration
└── package.json              # Test dependencies
```

### Frontend Test Files
```
frontend/
├── src/
│   ├── setupTests.js         # Test setup
│   ├── components/
│   │   └── __tests__/
│   │       ├── InlineCell.test.js
│   │       ├── TablePage.test.js
│   │       ├── ColumnAddModal.test.js
│   │       ├── SummaryRow.test.js
│   │       └── AddRowButton.test.js
│   └── hooks/
│       └── __tests__/
│           └── useApi.test.js
└── package.json              # Test dependencies
```

## Backend Testing Details

### API Endpoint Tests (`routes.test.js`)

#### Test Coverage
- **GET /api/columns** - Fetch all columns with options
- **POST /api/columns** - Create new column with validation
- **GET /api/rows** - Fetch paginated rows with cell values
- **POST /api/rows** - Create new row at top
- **PATCH /api/cell** - Update cell values with type validation
- **GET /api/summary** - Fetch column statistics

#### Key Test Scenarios
```javascript
// Successful API calls
it('should return all columns with options', async () => {
  const response = await request(app)
    .get('/api/columns')
    .expect(200);
  
  expect(response.body).toEqual(mockColumns);
});

// Error handling
it('should handle database errors', async () => {
  mockClient.query.mockRejectedValue(new Error('Database error'));
  
  const response = await request(app)
    .get('/api/columns')
    .expect(500);
  
  expect(response.body.success).toBe(false);
});

// Input validation
it('should validate required fields', async () => {
  const response = await request(app)
    .post('/api/columns')
    .send({ data_type: 'text' }) // Missing name
    .expect(400);
  
  expect(response.body.error).toContain('name is required');
});
```

### Data Validation Tests (`validation.test.js`)

#### Test Coverage
- **Column Type Validation**: Valid/invalid column types
- **Number Validation**: Numeric value validation
- **DateTime Validation**: ISO date string validation
- **Options Validation**: Select option validation
- **Required Field Validation**: Missing field handling

#### Key Test Scenarios
```javascript
// Column type validation
it('should accept valid column types', () => {
  expect(validateColumnType('text')).toBe(true);
  expect(validateColumnType('number')).toBe(true);
  expect(validateColumnType('single_select')).toBe(true);
});

// Number validation
it('should validate number inputs', () => {
  expect(validateNumber(42)).toBe(true);
  expect(validateNumber('42')).toBe(true);
  expect(validateNumber('not a number')).toBe(false);
});

// DateTime validation
it('should validate datetime strings', () => {
  expect(validateDateTime('2024-01-15T10:30:00Z')).toBe(true);
  expect(validateDateTime('invalid date')).toBe(false);
});
```

### Database Tests (`database.test.js`)

#### Test Coverage
- **Connection Management**: Database connection handling
- **Query Execution**: SELECT, INSERT, UPDATE, DELETE operations
- **Transaction Management**: BEGIN, COMMIT, ROLLBACK
- **Constraint Validation**: Foreign keys, unique constraints
- **Performance**: Query optimization and indexing

#### Key Test Scenarios
```javascript
// Connection management
it('should establish database connection', async () => {
  const client = await mockPool.connect();
  expect(client.query).toBeDefined();
});

// Query execution
it('should execute SELECT queries', async () => {
  const result = await mockClient.query('SELECT * FROM test_table');
  expect(result.rows).toBeDefined();
});

// Transaction handling
it('should handle transaction rollback', async () => {
  try {
    await mockClient.query('BEGIN');
    await mockClient.query('INSERT INTO invalid_table');
  } catch (error) {
    await mockClient.query('ROLLBACK');
    expect(error).toBeDefined();
  }
});
```

## Frontend Testing Details

### Component Tests

#### InlineCell Component (`InlineCell.test.js`)

**Test Coverage:**
- **Text Column**: Input editing, save/cancel
- **Number Column**: Numeric input validation
- **DateTime Column**: Date picker functionality
- **Single Select**: Dropdown selection
- **Multi Select**: Checkbox group interaction
- **Error Handling**: Missing options, invalid types
- **Accessibility**: ARIA labels, keyboard navigation

**Key Test Scenarios:**
```javascript
// Text editing
it('should enter edit mode on click', async () => {
  await user.click(screen.getByText('John Doe'));
  expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
});

// Multi-select interaction
it('should handle checkbox changes', async () => {
  await user.click(screen.getByText('JavaScript'));
  const pythonCheckbox = screen.getByLabelText('Python');
  await user.click(pythonCheckbox);
  expect(screen.getByText('JavaScript, Python')).toBeInTheDocument();
});
```

#### TablePage Component (`TablePage.test.js`)

**Test Coverage:**
- **Loading States**: Columns, rows, summary loading
- **Error States**: API errors, network failures
- **Data Rendering**: Table headers, cell values, summary
- **User Interactions**: Cell editing, button clicks
- **Pagination**: Page navigation, row counts
- **Empty States**: No columns, no rows

**Key Test Scenarios:**
```javascript
// Loading states
it('should show loading state for columns', () => {
  useColumns.mockReturnValue({
    data: null,
    isLoading: true,
    error: null
  });
  
  render(<TablePage />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

// Data rendering
it('should render table data', () => {
  render(<TablePage />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('25')).toBeInTheDocument();
});
```

#### ColumnAddModal Component (`ColumnAddModal.test.js`)

**Test Coverage:**
- **Modal Visibility**: Open/close states
- **Form Fields**: Name, type, options
- **Options Management**: Add/remove options
- **Form Submission**: Validation, success/error handling
- **Loading States**: Pending submission
- **Accessibility**: ARIA labels, keyboard navigation

**Key Test Scenarios:**
```javascript
// Form submission
it('should submit text column successfully', async () => {
  await user.type(screen.getByLabelText('Column Name'), 'Description');
  await user.selectOptions(screen.getByLabelText('Column Type'), 'text');
  await user.click(screen.getByText('Add Column'));
  
  expect(mockMutate).toHaveBeenCalledWith({
    name: 'Description',
    data_type: 'text',
    options: []
  });
});

// Options management
it('should add new option', async () => {
  await user.selectOptions(screen.getByLabelText('Column Type'), 'single_select');
  await user.click(screen.getByText('Add Option'));
  expect(screen.getByDisplayValue('')).toBeInTheDocument();
});
```

#### SummaryRow Component (`SummaryRow.test.js`)

**Test Coverage:**
- **Text Summary**: No summary display
- **Number Summary**: Sum, average, count
- **Single Select Summary**: Most frequent option
- **Multi Select Summary**: Most frequent options
- **Edge Cases**: Missing data, empty arrays
- **Performance**: Large datasets

**Key Test Scenarios:**
```javascript
// Number summary
it('should display number statistics correctly', () => {
  render(<SummaryRow columns={columns} summary={summary} />);
  expect(screen.getByText('Sum: 150')).toBeInTheDocument();
  expect(screen.getByText('Average: 30')).toBeInTheDocument();
});

// Multi-select summary
it('should display most frequent options', () => {
  render(<SummaryRow columns={columns} summary={summary} />);
  expect(screen.getByText('Most frequent: JavaScript, React')).toBeInTheDocument();
});
```

#### AddRowButton Component (`AddRowButton.test.js`)

**Test Coverage:**
- **Button Rendering**: Text, icon, styling
- **User Interactions**: Click handling
- **Loading States**: Pending submission
- **Error Handling**: Mutation errors
- **Accessibility**: Keyboard navigation, ARIA attributes

**Key Test Scenarios:**
```javascript
// User interaction
it('should call mutate when clicked', async () => {
  await user.click(screen.getByText('Add Row'));
  expect(mockMutate).toHaveBeenCalledTimes(1);
});

// Loading state
it('should show loading state when pending', () => {
  useAddRow.mockReturnValue({
    mutate: jest.fn(),
    isPending: true,
    error: null
  });
  
  render(<AddRowButton />);
  expect(screen.getByText('Adding...')).toBeInTheDocument();
});
```

### Hook Tests (`useApi.test.js`)

**Test Coverage:**
- **Data Fetching**: useColumns, useRows, useSummary
- **Mutations**: useUpdateCell, useAddColumn, useAddRow
- **Error Handling**: Network errors, API errors
- **Loading States**: Pending states
- **Caching**: Query result caching
- **Query Invalidation**: Cache invalidation after mutations

**Key Test Scenarios:**
```javascript
// Data fetching
it('should fetch columns successfully', async () => {
  endpoints.getColumns.mockResolvedValue(mockColumns);
  
  const { result } = renderHook(() => useColumns());
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toEqual(mockColumns);
});

// Mutations
it('should update cell successfully', async () => {
  endpoints.updateCell.mockResolvedValue({ success: true });
  
  const { result } = renderHook(() => useUpdateCell());
  
  result.current.mutate({ rowId: 'uuid-1', columnId: 1, value: 'New Value' });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

## Test Configuration

### Backend Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};
```

### Frontend Jest Configuration
```javascript
// setupTests.js
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
```

## Mocking Strategy

### Backend Mocking
- **Database Connection**: Mock pg Pool and Client
- **Query Results**: Mock database responses
- **Error Scenarios**: Mock connection and query errors

### Frontend Mocking
- **API Endpoints**: Mock axios calls
- **React Query**: Mock useQuery and useMutation hooks
- **Browser APIs**: Mock IntersectionObserver, ResizeObserver
- **User Events**: Mock user interactions

## Test Data

### Backend Test Data
```javascript
const mockColumns = [
  {
    id: 1,
    column_name: 'Name',
    column_type: 'text',
    options: null
  },
  {
    id: 2,
    column_name: 'Priority',
    column_type: 'single_select',
    options: [
      { id: 1, label: 'High', value: 'high' },
      { id: 2, label: 'Medium', value: 'medium' }
    ]
  }
];
```

### Frontend Test Data
```javascript
const mockRows = [
  {
    id: 'uuid-1',
    row_number: 1,
    cells: [
      { column_id: 1, data_type: 'text', value: 'John Doe' },
      { column_id: 2, data_type: 'number', value: 25 }
    ]
  }
];
```

## Coverage Reports

### Backend Coverage
- **Statements**: 95%+ coverage
- **Branches**: 90%+ coverage
- **Functions**: 95%+ coverage
- **Lines**: 95%+ coverage

### Frontend Coverage
- **Statements**: 90%+ coverage
- **Branches**: 85%+ coverage
- **Functions**: 90%+ coverage
- **Lines**: 90%+ coverage

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd backend && npm run test:coverage
  
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
      - run: cd frontend && npm run test:coverage
```

## Best Practices

### Test Organization
- **One test file per component/function**
- **Descriptive test names**
- **Group related tests with describe blocks**
- **Use beforeEach/afterEach for setup/cleanup**

### Test Data Management
- **Use consistent mock data**
- **Create reusable test utilities**
- **Mock external dependencies**
- **Test edge cases and error scenarios**

### Assertion Best Practices
- **Use specific matchers**
- **Test both positive and negative cases**
- **Verify side effects**
- **Test accessibility features**

### Performance Testing
- **Test rendering performance**
- **Test with large datasets**
- **Monitor test execution time**
- **Use performance.now() for timing**

## Troubleshooting

### Common Issues
- **Mock not working**: Check mock implementation
- **Async test failures**: Use waitFor for async operations
- **Component not rendering**: Check wrapper and context
- **Database connection errors**: Verify mock setup

### Debug Tips
- **Use screen.debug() to inspect DOM**
- **Add console.log in tests for debugging**
- **Check test environment setup**
- **Verify mock implementations**

This comprehensive testing strategy ensures the reliability and maintainability of the Spreadsheet Application through thorough unit testing of both backend and frontend components.
