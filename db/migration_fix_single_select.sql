-- Migration to fix single_select_value column type
-- This fixes the type mismatch error: operator does not exist: character varying = integer

-- First, let's check what data we currently have
-- (This is just for reference, we'll handle the data conversion)

-- Step 1: Add a temporary column to store the integer values
ALTER TABLE cell_values ADD COLUMN single_select_value_temp INTEGER;

-- Step 2: Convert existing string values to integers where possible
-- This assumes the current data contains option IDs as strings
UPDATE cell_values 
SET single_select_value_temp = single_select_value::INTEGER 
WHERE single_select_value IS NOT NULL 
  AND single_select_value ~ '^[0-9]+$';

-- Step 3: Drop the old column
ALTER TABLE cell_values DROP COLUMN single_select_value;

-- Step 4: Rename the temporary column to the original name
ALTER TABLE cell_values RENAME COLUMN single_select_value_temp TO single_select_value;

-- Step 5: Add the constraint back
ALTER TABLE cell_values ADD CONSTRAINT check_single_value_type CHECK (
    (text_value IS NOT NULL AND number_value IS NULL AND datetime_value IS NULL AND single_select_value IS NULL) OR
    (text_value IS NULL AND number_value IS NOT NULL AND datetime_value IS NULL AND single_select_value IS NULL) OR
    (text_value IS NULL AND number_value IS NULL AND datetime_value IS NOT NULL AND single_select_value IS NULL) OR
    (text_value IS NULL AND number_value IS NULL AND datetime_value IS NULL AND single_select_value IS NOT NULL) OR
    (text_value IS NULL AND number_value IS NULL AND datetime_value IS NULL AND single_select_value IS NULL)
);

-- Step 6: Add foreign key constraint to dropdown_options
ALTER TABLE cell_values 
ADD CONSTRAINT fk_single_select_option 
FOREIGN KEY (single_select_value) REFERENCES dropdown_options(id) ON DELETE CASCADE;

-- Step 7: Update the index
DROP INDEX IF EXISTS idx_cell_values_single_select;
CREATE INDEX idx_cell_values_single_select ON cell_values(single_select_value) WHERE single_select_value IS NOT NULL;
