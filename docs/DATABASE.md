# 🗄️ Database Documentation

## Overview

The spreadsheet application uses PostgreSQL with an EAV (Entity-Attribute-Value) model to support dynamic columns and flexible data types.

## Database Schema

### Core Tables

#### `columns_meta`
Stores column definitions and metadata.

```sql
CREATE TABLE columns_meta (
    id SERIAL PRIMARY KEY,
    column_name VARCHAR(100) NOT NULL,
    column_type VARCHAR(20) NOT NULL CHECK (column_type IN ('text', 'number', 'datetime', 'single_select', 'multi_select')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `column_name`: Display name of the column
- `column_type`: Data type (text, number, datetime, single_select, multi_select)
- `is_active`: Soft delete flag
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

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

**Columns:**
- `id`: Primary key (UUID)
- `row_number`: Display order (1 = top, 2 = second, etc.)
- `is_active`: Soft delete flag
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### `cell_values`
Stores individual cell values using EAV model.

```sql
CREATE TABLE cell_values (
    id SERIAL PRIMARY KEY,
    row_id UUID REFERENCES data_rows(id) ON DELETE CASCADE,
    column_id INTEGER REFERENCES columns_meta(id) ON DELETE CASCADE,
    value_text TEXT,
    value_number DECIMAL(15,2),
    value_datetime TIMESTAMP,
    value_single_select INTEGER REFERENCES dropdown_options(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `row_id`: Foreign key to data_rows
- `column_id`: Foreign key to columns_meta
- `value_text`: Text values
- `value_number`: Numeric values
- `value_datetime`: Date/time values
- `value_single_select`: Single select option ID
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### `dropdown_options`
Stores options for select-type columns.

```sql
CREATE TABLE dropdown_options (
    id SERIAL PRIMARY KEY,
    column_id INTEGER REFERENCES columns_meta(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `column_id`: Foreign key to columns_meta
- `label`: Display text for the option
- `value`: Internal value for the option
- `is_active`: Soft delete flag
- `created_at`: Creation timestamp

#### `multi_select_values`
Stores multi-select values (many-to-many relationship).

```sql
CREATE TABLE multi_select_values (
    id SERIAL PRIMARY KEY,
    cell_value_id INTEGER REFERENCES cell_values(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES dropdown_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `cell_value_id`: Foreign key to cell_values
- `option_id`: Foreign key to dropdown_options
- `created_at`: Creation timestamp

### Summary Tables

#### `column_summary`
Stores column-level statistics.

```sql
CREATE TABLE column_summary (
    column_id INTEGER PRIMARY KEY REFERENCES columns_meta(id),
    total_cells INTEGER DEFAULT 0,
    non_empty_cells INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `row_summary`
Stores row-level statistics.

```sql
CREATE TABLE row_summary (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_rows INTEGER DEFAULT 0,
    active_rows INTEGER DEFAULT 0,
    last_row_number INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `dropdown_usage_summary`
Stores option usage statistics.

```sql
CREATE TABLE dropdown_usage_summary (
    option_id INTEGER PRIMARY KEY REFERENCES dropdown_options(id),
    usage_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

### Performance Indexes
```sql
-- Cell values lookup
CREATE INDEX idx_cell_values_row_column ON cell_values(row_id, column_id);

-- Multi-select values lookup
CREATE INDEX idx_multi_select_cell ON multi_select_values(cell_value_id);

-- Dropdown options by column
CREATE INDEX idx_dropdown_options_column ON dropdown_options(column_id);

-- Active rows ordering
CREATE INDEX idx_data_rows_active_number ON data_rows(is_active, row_number) WHERE is_active = TRUE;
```

### Unique Constraints
```sql
-- Prevent duplicate cell values
CREATE UNIQUE INDEX idx_cell_values_unique ON cell_values(row_id, column_id);

-- Prevent duplicate multi-select values
CREATE UNIQUE INDEX idx_multi_select_unique ON multi_select_values(cell_value_id, option_id);
```

## Triggers

### Automatic Timestamp Updates
```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_columns_meta_updated_at BEFORE UPDATE ON columns_meta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_rows_updated_at BEFORE UPDATE ON data_rows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cell_values_updated_at BEFORE UPDATE ON cell_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Views

### Active Columns View
```sql
CREATE VIEW active_columns AS
SELECT id, column_name, column_type, created_at, updated_at
FROM columns_meta
WHERE is_active = TRUE
ORDER BY id;
```

### Active Rows View
```sql
CREATE VIEW active_rows AS
SELECT id, row_number, created_at, updated_at
FROM data_rows
WHERE is_active = TRUE
ORDER BY row_number;
```

### Cell Values with Types View
```sql
CREATE VIEW cell_values_typed AS
SELECT 
    cv.id,
    cv.row_id,
    cv.column_id,
    cm.column_name,
    cm.column_type,
    cv.value_text,
    cv.value_number,
    cv.value_datetime,
    cv.value_single_select,
    cv.created_at,
    cv.updated_at
FROM cell_values cv
JOIN columns_meta cm ON cv.column_id = cm.id
WHERE cm.is_active = TRUE;
```

## Data Types Mapping

### Column Types to Storage Fields

| Column Type | Storage Field | Validation |
|-------------|---------------|------------|
| `text` | `value_text` | Any string |
| `number` | `value_number` | Numeric value |
| `datetime` | `value_datetime` | ISO timestamp |
| `single_select` | `value_single_select` | Valid option ID |
| `multi_select` | `multi_select_values` | Array of option IDs |

### Example Data Storage

#### Text Column
```sql
INSERT INTO cell_values (row_id, column_id, value_text) 
VALUES ('uuid-123', 1, 'John Doe');
```

#### Number Column
```sql
INSERT INTO cell_values (row_id, column_id, value_number) 
VALUES ('uuid-123', 2, 25);
```

#### Single Select Column
```sql
INSERT INTO cell_values (row_id, column_id, value_single_select) 
VALUES ('uuid-123', 3, 1);
```

#### Multi Select Column
```sql
-- Insert cell value
INSERT INTO cell_values (row_id, column_id) VALUES ('uuid-123', 4);

-- Insert multi-select values
INSERT INTO multi_select_values (cell_value_id, option_id) 
VALUES (1, 1), (1, 2), (1, 3);
```

## Query Examples

### Get All Rows with Cell Values
```sql
SELECT 
    dr.id,
    dr.row_number,
    cm.column_name,
    cm.column_type,
    cv.value_text,
    cv.value_number,
    cv.value_datetime,
    cv.value_single_select
FROM data_rows dr
LEFT JOIN cell_values cv ON dr.id = cv.row_id
LEFT JOIN columns_meta cm ON cv.column_id = cm.id
WHERE dr.is_active = TRUE
ORDER BY dr.row_number, cm.id;
```

### Get Multi-Select Values
```sql
SELECT 
    cv.row_id,
    cv.column_id,
    do.label,
    do.value
FROM cell_values cv
JOIN multi_select_values msv ON cv.id = msv.cell_value_id
JOIN dropdown_options do ON msv.option_id = do.id
WHERE cv.column_id = 4; -- Skills column
```

### Get Column Summary
```sql
SELECT 
    cm.column_name,
    cm.column_type,
    COUNT(cv.id) as total_cells,
    COUNT(CASE WHEN cv.value_text IS NOT NULL OR cv.value_number IS NOT NULL 
               OR cv.value_datetime IS NOT NULL OR cv.value_single_select IS NOT NULL 
               THEN 1 END) as non_empty_cells
FROM columns_meta cm
LEFT JOIN cell_values cv ON cm.id = cv.column_id
WHERE cm.is_active = TRUE
GROUP BY cm.id, cm.column_name, cm.column_type;
```

## Performance Considerations

### Indexing Strategy
- **Primary Keys**: All tables have proper primary keys
- **Foreign Keys**: Indexed for join performance
- **Composite Indexes**: For common query patterns
- **Partial Indexes**: For active records only

### Query Optimization
- **Use EXPLAIN ANALYZE** to analyze query performance
- **Limit result sets** with pagination
- **Use appropriate WHERE clauses** to filter data
- **Avoid SELECT *** in production queries

### Maintenance
- **Regular VACUUM** to reclaim space
- **ANALYZE** to update statistics
- **Monitor slow queries** with pg_stat_statements
- **Consider partitioning** for large datasets

## Backup and Recovery

### Backup Commands
```bash
# Full database backup
pg_dump -U postgres -h localhost spreadsheet > backup.sql

# Schema only
pg_dump -U postgres -h localhost -s spreadsheet > schema.sql

# Data only
pg_dump -U postgres -h localhost -a spreadsheet > data.sql
```

### Restore Commands
```bash
# Restore from backup
psql -U postgres -h localhost spreadsheet < backup.sql

# Restore schema
psql -U postgres -h localhost spreadsheet < schema.sql

# Restore data
psql -U postgres -h localhost spreadsheet < data.sql
```

## Security Considerations

### Access Control
- **Use dedicated database user** for application
- **Limit permissions** to necessary tables only
- **Use connection pooling** to limit connections
- **Enable SSL** for production connections

### Data Protection
- **Parameterized queries** prevent SQL injection
- **Input validation** at application level
- **Audit logging** for sensitive operations
- **Regular security updates** for PostgreSQL

## Monitoring

### Key Metrics
- **Connection count**: Monitor active connections
- **Query performance**: Track slow queries
- **Disk usage**: Monitor database size
- **Lock contention**: Check for blocking queries

### Useful Queries
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('spreadsheet'));

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```
