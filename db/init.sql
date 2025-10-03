-- PostgreSQL Database Schema for Spreadsheet Application
-- EAV (Entity-Attribute-Value) style design

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- CORE TABLES
-- ==============================================

-- Table to store column metadata and definitions
CREATE TABLE columns_meta (
    id SERIAL PRIMARY KEY,
    column_name VARCHAR(255) NOT NULL,
    column_type VARCHAR(50) NOT NULL CHECK (column_type IN ('text', 'number', 'datetime', 'single_select', 'multi_select')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store dropdown options for single_select and multi_select columns
CREATE TABLE dropdown_options (
    id SERIAL PRIMARY KEY,
    column_id INTEGER NOT NULL REFERENCES columns_meta(id) ON DELETE CASCADE,
    option_value VARCHAR(500) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store data rows (each row has a UUID)
CREATE TABLE data_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    row_number INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store cell values for different data types
CREATE TABLE cell_values (
    id SERIAL PRIMARY KEY,
    row_id UUID NOT NULL REFERENCES data_rows(id) ON DELETE CASCADE,
    column_id INTEGER NOT NULL REFERENCES columns_meta(id) ON DELETE CASCADE,
    text_value TEXT,
    number_value DECIMAL(20, 10),
    datetime_value TIMESTAMP WITH TIME ZONE,
    single_select_value VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one value type is set per cell
    CONSTRAINT check_single_value_type CHECK (
        (text_value IS NOT NULL AND number_value IS NULL AND datetime_value IS NULL AND single_select_value IS NULL) OR
        (text_value IS NULL AND number_value IS NOT NULL AND datetime_value IS NULL AND single_select_value IS NULL) OR
        (text_value IS NULL AND number_value IS NULL AND datetime_value IS NOT NULL AND single_select_value IS NULL) OR
        (text_value IS NULL AND number_value IS NULL AND datetime_value IS NULL AND single_select_value IS NOT NULL) OR
        (text_value IS NULL AND number_value IS NULL AND datetime_value IS NULL AND single_select_value IS NULL)
    ),
    
    -- Unique constraint to prevent duplicate cells
    UNIQUE(row_id, column_id)
);

-- Table to store multi-select values (many-to-many relationship)
CREATE TABLE multi_select_values (
    id SERIAL PRIMARY KEY,
    row_id UUID NOT NULL REFERENCES data_rows(id) ON DELETE CASCADE,
    column_id INTEGER NOT NULL REFERENCES columns_meta(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES dropdown_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate multi-select entries
    UNIQUE(row_id, column_id, option_id)
);

-- ==============================================
-- SUMMARY HELPER TABLES (for optimization)
-- ==============================================

-- Summary table for column statistics
CREATE TABLE column_summary (
    id SERIAL PRIMARY KEY,
    column_id INTEGER NOT NULL REFERENCES columns_meta(id) ON DELETE CASCADE,
    total_cells INTEGER NOT NULL DEFAULT 0,
    non_empty_cells INTEGER NOT NULL DEFAULT 0,
    text_cells INTEGER NOT NULL DEFAULT 0,
    number_cells INTEGER NOT NULL DEFAULT 0,
    datetime_cells INTEGER NOT NULL DEFAULT 0,
    single_select_cells INTEGER NOT NULL DEFAULT 0,
    multi_select_cells INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Summary table for row statistics
CREATE TABLE row_summary (
    id SERIAL PRIMARY KEY,
    total_rows INTEGER NOT NULL DEFAULT 0,
    active_rows INTEGER NOT NULL DEFAULT 0,
    last_row_number INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Summary table for dropdown option usage
CREATE TABLE dropdown_usage_summary (
    id SERIAL PRIMARY KEY,
    option_id INTEGER NOT NULL REFERENCES dropdown_options(id) ON DELETE CASCADE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    single_select_usage INTEGER NOT NULL DEFAULT 0,
    multi_select_usage INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for columns_meta
CREATE INDEX idx_columns_meta_type ON columns_meta(column_type);
CREATE INDEX idx_columns_meta_active ON columns_meta(is_active);
CREATE INDEX idx_columns_meta_order ON columns_meta(display_order);

-- Indexes for dropdown_options
CREATE INDEX idx_dropdown_options_column ON dropdown_options(column_id);
CREATE INDEX idx_dropdown_options_active ON dropdown_options(is_active);
CREATE INDEX idx_dropdown_options_order ON dropdown_options(display_order);

-- Indexes for data_rows
CREATE INDEX idx_data_rows_number ON data_rows(row_number);
CREATE INDEX idx_data_rows_active ON data_rows(is_active);
CREATE INDEX idx_data_rows_created ON data_rows(created_at);

-- Indexes for cell_values
CREATE INDEX idx_cell_values_row ON cell_values(row_id);
CREATE INDEX idx_cell_values_column ON cell_values(column_id);
CREATE INDEX idx_cell_values_text ON cell_values(text_value) WHERE text_value IS NOT NULL;
CREATE INDEX idx_cell_values_number ON cell_values(number_value) WHERE number_value IS NOT NULL;
CREATE INDEX idx_cell_values_datetime ON cell_values(datetime_value) WHERE datetime_value IS NOT NULL;
CREATE INDEX idx_cell_values_single_select ON cell_values(single_select_value) WHERE single_select_value IS NOT NULL;

-- Indexes for multi_select_values
CREATE INDEX idx_multi_select_row ON multi_select_values(row_id);
CREATE INDEX idx_multi_select_column ON multi_select_values(column_id);
CREATE INDEX idx_multi_select_option ON multi_select_values(option_id);

-- ==============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_columns_meta_updated_at 
    BEFORE UPDATE ON columns_meta 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_rows_updated_at 
    BEFORE UPDATE ON data_rows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cell_values_updated_at 
    BEFORE UPDATE ON cell_values 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Insert initial row summary
INSERT INTO row_summary (total_rows, active_rows, last_row_number) 
VALUES (0, 0, 0);

-- ==============================================
-- USEFUL VIEWS FOR QUERYING
-- ==============================================

-- View to get all cell data with proper typing
CREATE VIEW cell_data_view AS
SELECT 
    cv.row_id,
    cv.column_id,
    cm.column_name,
    cm.column_type,
    cv.text_value,
    cv.number_value,
    cv.datetime_value,
    cv.single_select_value,
    cv.created_at,
    cv.updated_at
FROM cell_values cv
JOIN columns_meta cm ON cv.column_id = cm.id
WHERE cm.is_active = TRUE;

-- View to get multi-select data with option details
CREATE VIEW multi_select_data_view AS
SELECT 
    msv.row_id,
    msv.column_id,
    cm.column_name,
    dopt.option_value,
    dopt.display_order
FROM multi_select_values msv
JOIN columns_meta cm ON msv.column_id = cm.id
JOIN dropdown_options dopt ON msv.option_id = dopt.id
WHERE cm.is_active = TRUE AND dopt.is_active = TRUE;

-- View to get complete row data
CREATE VIEW complete_row_data AS
SELECT 
    dr.id as row_id,
    dr.row_number,
    cm.column_name,
    cm.column_type,
    COALESCE(cv.text_value, cv.number_value::text, cv.datetime_value::text, cv.single_select_value) as cell_value,
    cv.created_at as cell_created_at
FROM data_rows dr
CROSS JOIN columns_meta cm
LEFT JOIN cell_values cv ON dr.id = cv.row_id AND cm.id = cv.column_id
WHERE dr.is_active = TRUE AND cm.is_active = TRUE
ORDER BY dr.row_number, cm.display_order;
