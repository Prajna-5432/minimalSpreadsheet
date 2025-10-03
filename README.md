# 📊 Spreadsheet Application

A modern, full-stack spreadsheet application built with React, Node.js, and PostgreSQL. Features real-time editing, multiple data types, and a professional user interface.

Working Demo : https://screenapp.io/app/#/shared/VQBYHOvWjc
## 🚀 Features

### Core Functionality
- **Real-time Cell Editing** - Click any cell to edit inline
- **Multiple Data Types** - Text, Number, DateTime, Single Select, Multi Select
- **Dynamic Columns** - Add/remove columns with different data types
- **Row Management** - Add new rows (appears at top), delete rows
- **Data Validation** - Server-side validation for all data types
- **Summary Statistics** - Automatic calculations for each column

### Data Types Supported
- **Text** - Free-form text input
- **Number** - Numeric values with validation
- **DateTime** - Date and time picker
- **Single Select** - Dropdown with predefined options
- **Multi Select** - Checkbox group for multiple selections

### User Interface
- **Professional Design** - Modern, clean interface
- **Responsive Layout** - Works on desktop and mobile
- **Inline Editing** - Click to edit, blur/Enter to save
- **Visual Feedback** - Loading states, error handling
- **Summary Row** - Statistics displayed at the top

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful API** - Clean API endpoints
- **PostgreSQL Database** - EAV (Entity-Attribute-Value) model
- **Data Validation** - Server-side validation for all inputs
- **Error Handling** - Comprehensive error handling
- **CORS Support** - Cross-origin resource sharing

### Frontend (React)
- **React Query** - Data fetching and caching
- **Axios** - HTTP client for API calls
- **Component Architecture** - Modular, reusable components
- **Inline Editing** - Real-time cell editing
- **Optimistic Updates** - Immediate UI updates

### Database (PostgreSQL)
- **EAV Model** - Flexible schema for dynamic columns
- **UUID Primary Keys** - Unique row identifiers
- **Foreign Key Constraints** - Data integrity
- **Indexes** - Optimized queries
- **Triggers** - Automatic timestamp updates

## 📁 Project Structure

```
spreadsheet/
├── backend/                 # Node.js backend
│   ├── routes/
│   │   └── index.js        # API routes
│   ├── server.js           # Express server
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API configuration
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.js         # Main app component
│   └── package.json        # Frontend dependencies
├── db/                     # Database files
│   ├── init.sql           # Database schema
│   └── dummy-data.sql     # Sample data
└── README.md              # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd spreadsheet
```

### 2. Database Setup

#### Option A: Using pgAdmin (Recommended)
1. Open pgAdmin 4
2. Create a new database named `spreadsheet`
3. Run the SQL files in order:
   - Execute `db/init.sql` to create tables
   - Execute `db/dummy-data.sql` to add sample data

#### Option B: Using Command Line
```bash
# Create database
createdb spreadsheet

# Run schema
psql -U postgres -d spreadsheet -f db/init.sql

# Add sample data
psql -U postgres -d spreadsheet -f db/dummy-data.sql
```

### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file
echo "DB_HOST=localhost
DB_PORT=5432
DB_NAME=spreadsheet
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3001" > .env

# Start backend server
npm start
```

### 4. Frontend Setup
```bash
cd frontend
npm install

# Start frontend development server
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🗄️ Database Schema

### Core Tables

#### `columns_meta`
Stores column definitions and metadata.
```sql
CREATE TABLE columns_meta (
    id SERIAL PRIMARY KEY,
    column_name VARCHAR(100) NOT NULL,
    column_type VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `data_rows`
Stores row information with UUID identifiers.
```sql
CREATE TABLE data_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    row_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `cell_values`
Stores individual cell values (EAV model).
```sql
CREATE TABLE cell_values (
    id SERIAL PRIMARY KEY,
    row_id UUID REFERENCES data_rows(id),
    column_id INTEGER REFERENCES columns_meta(id),
    value_text TEXT,
    value_number DECIMAL,
    value_datetime TIMESTAMP,
    value_single_select INTEGER REFERENCES dropdown_options(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `dropdown_options`
Stores options for select-type columns.
```sql
CREATE TABLE dropdown_options (
    id SERIAL PRIMARY KEY,
    column_id INTEGER REFERENCES columns_meta(id),
    label VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `multi_select_values`
Stores multi-select values (many-to-many relationship).
```sql
CREATE TABLE multi_select_values (
    id SERIAL PRIMARY KEY,
    cell_value_id INTEGER REFERENCES cell_values(id),
    option_id INTEGER REFERENCES dropdown_options(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Columns API
- **GET /api/columns** - Get all columns with options
- **POST /api/columns** - Create new column

### Rows API
- **GET /api/rows** - Get paginated rows with cell values
- **POST /api/rows** - Create new row (appears at top)

### Cell API
- **PATCH /api/cell** - Update cell value with validation

### Summary API
- **GET /api/summary** - Get column statistics

### Health Check
- **GET /health** - Server health status

## 🎨 Frontend Components

### Core Components

#### `TablePage`
Main spreadsheet component that orchestrates the entire table view.
- Fetches columns, rows, and summary data
- Renders the table with headers and data
- Handles pagination
- Integrates all other components

#### `InlineCell`
Editable cell component that handles different data types.
- **Text/Number**: Direct input editing
- **DateTime**: Date picker input
- **Single Select**: Dropdown selection
- **Multi Select**: Checkbox group interface

#### `ColumnAddModal`
Modal for adding new columns with different data types.
- Form validation
- Dynamic options for select types
- Type-specific configuration

#### `AddRowButton`
Button component for adding new rows.
- Loading states
- Optimistic updates
- Error handling

#### `SummaryRow`
Displays column statistics at the top of the table.
- Real-time calculations
- Type-specific summaries
- Visual indicators

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spreadsheet
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3001
```

#### Frontend (package.json)
```json
{
  "proxy": "http://localhost:3001"
}
```

## 🚀 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # React development server
```

### Database Development
```bash
# Connect to database
psql -U postgres -d spreadsheet

# View tables
\dt

# View data
SELECT * FROM columns_meta;
SELECT * FROM data_rows LIMIT 5;
```

## 🧪 Testing

### Manual Testing
1. **Add Columns**: Test different data types
2. **Add Rows**: Verify new rows appear at top
3. **Edit Cells**: Test inline editing for all types
4. **Multi-Select**: Test Skills column functionality
5. **Summary**: Verify statistics calculations

### API Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test columns endpoint
curl http://localhost:3001/api/columns

# Test rows endpoint
curl http://localhost:3001/api/rows
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```
Error: Cannot find module 'pg'
```
**Solution**: Install dependencies
```bash
cd backend
npm install
```

#### Database Not Found
```
Error: relation "columns_meta" does not exist
```
**Solution**: Run database schema
```bash
psql -U postgres -d spreadsheet -f db/init.sql
```

#### CORS Issues
```
Error: CORS policy
```
**Solution**: Backend includes CORS middleware, ensure backend is running on port 3001.

#### Frontend Not Loading
```
Error: Cannot resolve module
```
**Solution**: Install frontend dependencies
```bash
cd frontend
npm install
```

### Debug Mode
```bash
# Backend with debug logging
DEBUG=* npm start

# Frontend with React dev tools
npm start
```

## 📊 Performance Considerations

### Database Optimization
- **Indexes**: Added on frequently queried columns
- **Pagination**: Rows are paginated (20 per page)
- **Connection Pooling**: PostgreSQL connection pooling

### Frontend Optimization
- **React Query**: Automatic caching and background updates
- **Optimistic Updates**: Immediate UI feedback
- **Component Memoization**: Prevents unnecessary re-renders

### Scalability
- **EAV Model**: Supports unlimited columns
- **UUID Keys**: Distributed system friendly
- **RESTful API**: Easy to scale horizontally

## 🔒 Security Considerations

### Input Validation
- **Server-side validation** for all data types
- **SQL injection protection** via parameterized queries
- **XSS prevention** via proper escaping

### Data Integrity
- **Foreign key constraints** ensure data consistency
- **Transaction support** for multi-step operations
- **Error handling** prevents data corruption

## 🚀 Deployment

### Production Build
```bash
# Frontend build
cd frontend
npm run build

# Backend (no build needed)
cd backend
npm start
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=spreadsheet_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
PORT=3001
```


