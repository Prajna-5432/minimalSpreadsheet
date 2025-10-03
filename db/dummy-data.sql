-- Dummy data for spreadsheet application
-- Run this after creating the tables with init.sql

-- ==============================================
-- SAMPLE COLUMNS
-- ==============================================

-- Insert sample columns
INSERT INTO columns_meta (column_name, column_type, display_order) VALUES
('Name', 'text', 1),
('Age', 'number', 2),
('Email', 'text', 3),
('Department', 'single_select', 4),
('Skills', 'multi_select', 5),
('Join Date', 'datetime', 6),
('Salary', 'number', 7),
('Status', 'single_select', 8);

-- ==============================================
-- SAMPLE DROPDOWN OPTIONS
-- ==============================================

-- Department options
INSERT INTO dropdown_options (column_id, option_value, display_order) VALUES
(4, 'Engineering', 1),
(4, 'Marketing', 2),
(4, 'Sales', 3),
(4, 'HR', 4),
(4, 'Finance', 5);

-- Skills options
INSERT INTO dropdown_options (column_id, option_value, display_order) VALUES
(5, 'JavaScript', 1),
(5, 'Python', 2),
(5, 'React', 3),
(5, 'Node.js', 4),
(5, 'SQL', 5),
(5, 'Design', 6),
(5, 'Management', 7);

-- Status options
INSERT INTO dropdown_options (column_id, option_value, display_order) VALUES
(8, 'Active', 1),
(8, 'Inactive', 2),
(8, 'On Leave', 3),
(8, 'Terminated', 4);

-- ==============================================
-- SAMPLE ROWS
-- ==============================================

-- Insert sample data rows
INSERT INTO data_rows (row_number) VALUES
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10);

-- ==============================================
-- SAMPLE CELL VALUES
-- ==============================================

-- Row 1: John Doe
INSERT INTO cell_values (row_id, column_id, text_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 1), 1, 'John Doe'),
((SELECT id FROM data_rows WHERE row_number = 1), 3, 'john.doe@company.com');

INSERT INTO cell_values (row_id, column_id, number_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 1), 2, 28),
((SELECT id FROM data_rows WHERE row_number = 1), 7, 75000);

INSERT INTO cell_values (row_id, column_id, datetime_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 1), 6, '2022-03-15 09:00:00');

INSERT INTO cell_values (row_id, column_id, single_select_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 1), 4, 'Engineering'),
((SELECT id FROM data_rows WHERE row_number = 1), 8, 'Active');

-- Row 2: Jane Smith
INSERT INTO cell_values (row_id, column_id, text_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 2), 1, 'Jane Smith'),
((SELECT id FROM data_rows WHERE row_number = 2), 3, 'jane.smith@company.com');

INSERT INTO cell_values (row_id, column_id, number_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 2), 2, 32),
((SELECT id FROM data_rows WHERE row_number = 2), 7, 82000);

INSERT INTO cell_values (row_id, column_id, datetime_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 2), 6, '2021-07-20 10:30:00');

INSERT INTO cell_values (row_id, column_id, single_select_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 2), 4, 'Marketing'),
((SELECT id FROM data_rows WHERE row_number = 2), 8, 'Active');

-- Row 3: Mike Johnson
INSERT INTO cell_values (row_id, column_id, text_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 3), 1, 'Mike Johnson'),
((SELECT id FROM data_rows WHERE row_number = 3), 3, 'mike.johnson@company.com');

INSERT INTO cell_values (row_id, column_id, number_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 3), 2, 45),
((SELECT id FROM data_rows WHERE row_number = 3), 7, 95000);

INSERT INTO cell_values (row_id, column_id, datetime_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 3), 6, '2020-11-10 14:15:00');

INSERT INTO cell_values (row_id, column_id, single_select_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 3), 4, 'Sales'),
((SELECT id FROM data_rows WHERE row_number = 3), 8, 'Active');

-- Row 4: Sarah Wilson
INSERT INTO cell_values (row_id, column_id, text_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 4), 1, 'Sarah Wilson'),
((SELECT id FROM data_rows WHERE row_number = 4), 3, 'sarah.wilson@company.com');

INSERT INTO cell_values (row_id, column_id, number_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 4), 2, 29),
((SELECT id FROM data_rows WHERE row_number = 4), 7, 68000);

INSERT INTO cell_values (row_id, column_id, datetime_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 4), 6, '2023-01-08 08:45:00');

INSERT INTO cell_values (row_id, column_id, single_select_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 4), 4, 'HR'),
((SELECT id FROM data_rows WHERE row_number = 4), 8, 'Active');

-- Row 5: David Brown
INSERT INTO cell_values (row_id, column_id, text_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 5), 1, 'David Brown'),
((SELECT id FROM data_rows WHERE row_number = 5), 3, 'david.brown@company.com');

INSERT INTO cell_values (row_id, column_id, number_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 5), 2, 38),
((SELECT id FROM data_rows WHERE row_number = 5), 7, 88000);

INSERT INTO cell_values (row_id, column_id, datetime_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 5), 6, '2021-12-03 11:20:00');

INSERT INTO cell_values (row_id, column_id, single_select_value) VALUES
((SELECT id FROM data_rows WHERE row_number = 5), 4, 'Finance'),
((SELECT id FROM data_rows WHERE row_number = 5), 8, 'On Leave');

-- ==============================================
-- SAMPLE MULTI-SELECT VALUES
-- ==============================================

-- John Doe's skills
INSERT INTO multi_select_values (row_id, column_id, option_id) VALUES
((SELECT id FROM data_rows WHERE row_number = 1), 5, (SELECT id FROM dropdown_options WHERE option_value = 'JavaScript' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 1), 5, (SELECT id FROM dropdown_options WHERE option_value = 'React' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 1), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Node.js' AND column_id = 5));

-- Jane Smith's skills
INSERT INTO multi_select_values (row_id, column_id, option_id) VALUES
((SELECT id FROM data_rows WHERE row_number = 2), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Design' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 2), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Management' AND column_id = 5));

-- Mike Johnson's skills
INSERT INTO multi_select_values (row_id, column_id, option_id) VALUES
((SELECT id FROM data_rows WHERE row_number = 3), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Python' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 3), 5, (SELECT id FROM dropdown_options WHERE option_value = 'SQL' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 3), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Management' AND column_id = 5));

-- Sarah Wilson's skills
INSERT INTO multi_select_values (row_id, column_id, option_id) VALUES
((SELECT id FROM data_rows WHERE row_number = 4), 5, (SELECT id FROM dropdown_options WHERE option_value = 'JavaScript' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 4), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Design' AND column_id = 5));

-- David Brown's skills
INSERT INTO multi_select_values (row_id, column_id, option_id) VALUES
((SELECT id FROM data_rows WHERE row_number = 5), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Python' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 5), 5, (SELECT id FROM dropdown_options WHERE option_value = 'SQL' AND column_id = 5)),
((SELECT id FROM data_rows WHERE row_number = 5), 5, (SELECT id FROM dropdown_options WHERE option_value = 'Management' AND column_id = 5));

-- ==============================================
-- UPDATE ROW SUMMARY
-- ==============================================

-- Update the row summary with actual data
UPDATE row_summary SET 
    total_rows = 5,
    active_rows = 5,
    last_row_number = 5,
    last_updated = CURRENT_TIMESTAMP;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check the data was inserted correctly
SELECT 'Columns created:' as info, COUNT(*) as count FROM columns_meta
UNION ALL
SELECT 'Rows created:', COUNT(*) FROM data_rows
UNION ALL
SELECT 'Cell values created:', COUNT(*) FROM cell_values
UNION ALL
SELECT 'Multi-select values created:', COUNT(*) FROM multi_select_values;
