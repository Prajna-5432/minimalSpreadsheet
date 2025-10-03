const express = require('express');
const pool = require('../db');
const router = express.Router();

// Helper function for database operations with proper error handling
async function withDatabaseConnection(operation) {
  const client = await pool.connect();
  try {
    return await operation(client);
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Placeholder routes for spreadsheet API
router.get('/', (req, res) => {
  res.json({ 
    message: 'Spreadsheet API',
    version: '1.0.0',
    endpoints: {
      columns: '/api/columns',
      rows: '/api/rows',
      cells: '/api/cells',
      health: '/api/health'
    }
  });
});

// GET /api/columns - Get all columns with their options
router.get('/columns', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get all active columns
    const columnsQuery = `
      SELECT id, column_name, column_type, display_order, created_at, updated_at
      FROM columns_meta 
      WHERE is_active = TRUE 
      ORDER BY display_order, id
    `;
    const columnsResult = await client.query(columnsQuery);
    console.log('Raw columns from database:', columnsResult.rows.length);
    console.log('Column IDs from database:', columnsResult.rows.map(c => c.id));
    
    // Get options for each column
    const columnsWithOptions = await Promise.all(
      columnsResult.rows.map(async (column) => {
        const optionsQuery = `
          SELECT id, option_value, display_order
          FROM dropdown_options 
          WHERE column_id = $1 AND is_active = TRUE 
          ORDER BY display_order, id
        `;
        const optionsResult = await client.query(optionsQuery, [column.id]);
        
        return {
          id: column.id,
          column_name: column.column_name,
          column_type: column.column_type,
          display_order: column.display_order,
          options: optionsResult.rows.map(option => ({
            id: option.id,
            label: option.option_value,
            value: option.option_value
          })),
          created_at: column.created_at,
          updated_at: column.updated_at
        };
      })
    );
    
    client.release();
    console.log('=== BACKEND COLUMNS DEBUG ===');
    console.log('Total columns found:', columnsWithOptions.length);
    console.log('Columns data:', columnsWithOptions);
    console.log('Column IDs being sent:', columnsWithOptions.map(c => c.id));
    console.log('Column names being sent:', columnsWithOptions.map(c => c.column_name));
    console.log('============================');
    res.json(columnsWithOptions);
    
  } catch (err) {
    console.error('Error fetching columns:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch columns: ' + err.message 
    });
  }
});

// POST /api/columns - Create a new column with options
router.post('/columns', async (req, res) => {
  const { name, data_type, options = [] } = req.body;
  
  console.log('Creating new column:', { name, data_type, options });
  
  // Validation
  if (!name || !data_type) {
    return res.status(400).json({ 
      success: false,
      error: 'name is required' 
    });
  }
  
  const validTypes = ['text', 'number', 'datetime', 'single_select', 'multi_select'];
  if (!validTypes.includes(data_type)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid column type' 
    });
  }
  
  // Validate options for select types
  if ((data_type === 'single_select' || data_type === 'multi_select') && (!options || !Array.isArray(options))) {
    return res.status(400).json({ 
      success: false,
      error: 'Options array is required for select types' 
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get next display order
    const orderQuery = 'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM columns_meta';
    const orderResult = await client.query(orderQuery);
    const nextOrder = orderResult.rows[0].next_order;
    
    // Insert new column
    const columnQuery = `
      INSERT INTO columns_meta (column_name, column_type, display_order)
      VALUES ($1, $2, $3)
      RETURNING id, column_name, column_type, display_order, created_at, updated_at
    `;
    const columnResult = await client.query(columnQuery, [name, data_type, nextOrder]);
    const column = columnResult.rows[0];
    
    let columnOptions = [];
    
    // Insert options if it's a select type
    if (data_type === 'single_select' || data_type === 'multi_select') {
      for (const option of options) {
        if (!option.label || !option.value) {
          throw new Error('Each option must have both label and value');
        }
        
        const optionQuery = `
          INSERT INTO dropdown_options (column_id, option_value, display_order)
          VALUES ($1, $2, $3)
          RETURNING id, option_value, display_order
        `;
        const optionResult = await client.query(optionQuery, [
          column.id, 
          option.value, 
          option.display_order || 0
        ]);
        
        columnOptions.push({
          id: optionResult.rows[0].id,
          label: optionResult.rows[0].option_value,
          value: optionResult.rows[0].option_value
        });
      }
    }
    
    await client.query('COMMIT');
    
    console.log('Column created successfully:', {
      id: column.id,
      name: column.column_name,
      data_type: column.column_type,
      display_order: column.display_order,
      options: columnOptions
    });
    
    res.status(201).json({
      id: column.id,
      column_name: column.column_name,
      column_type: column.column_type,
      display_order: column.display_order,
      options: columnOptions,
      created_at: column.created_at,
      updated_at: column.updated_at
    });
    
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Error creating column:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create column: ' + err.message 
    });
  }
});

// GET /api/rows - Get rows with their cell values (paginated)
router.get('/rows', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const client = await pool.connect();
    
    // Get total count of active rows
    const countQuery = 'SELECT COUNT(*) as total FROM data_rows WHERE is_active = TRUE';
    const countResult = await client.query(countQuery);
    const totalRows = parseInt(countResult.rows[0].total);
    
    // Get paginated rows
    const rowsQuery = `
      SELECT id, row_number, created_at, updated_at
      FROM data_rows 
      WHERE is_active = TRUE 
      ORDER BY row_number ASC
      LIMIT $1 OFFSET $2
    `;
    const rowsResult = await client.query(rowsQuery, [limit, offset]);
    
    // Get cell values for each row
    const rowsWithCells = await Promise.all(
      rowsResult.rows.map(async (row) => {
        // Get cell values from cell_values table
        const cellValuesQuery = `
          SELECT 
            cv.column_id,
            cm.column_type,
            cv.text_value,
            cv.number_value,
            cv.datetime_value,
            cv.single_select_value
          FROM cell_values cv
          JOIN columns_meta cm ON cv.column_id = cm.id
          WHERE cv.row_id = $1 AND cm.is_active = TRUE
        `;
        const cellValuesResult = await client.query(cellValuesQuery, [row.id]);
        
        // Get multi-select values
        const multiSelectQuery = `
          SELECT 
            msv.column_id,
            msv.option_id
          FROM multi_select_values msv
          JOIN columns_meta cm ON msv.column_id = cm.id
          WHERE msv.row_id = $1 AND cm.is_active = TRUE
        `;
        const multiSelectResult = await client.query(multiSelectQuery, [row.id]);
        
        // Process cell values
        const cells = cellValuesResult.rows.map(cell => {
          let value = null;
          let dataType = cell.column_type;
          
          if (cell.text_value !== null) {
            value = cell.text_value;
            dataType = 'text';
          } else if (cell.number_value !== null) {
            value = cell.number_value;
            dataType = 'number';
          } else if (cell.datetime_value !== null) {
            value = cell.datetime_value;
            dataType = 'datetime';
          } else if (cell.single_select_value !== null) {
            value = cell.single_select_value;
            dataType = 'single_select';
          }
          
          return {
            column_id: cell.column_id,
            data_type: dataType,
            value: value
          };
        });
        
        // Process multi-select values
        const multiSelectMap = {};
        multiSelectResult.rows.forEach(ms => {
          if (!multiSelectMap[ms.column_id]) {
            multiSelectMap[ms.column_id] = [];
          }
          multiSelectMap[ms.column_id].push(ms.option_id);
        });
        
        // Add multi-select cells
        Object.keys(multiSelectMap).forEach(columnId => {
          cells.push({
            column_id: parseInt(columnId),
            data_type: 'multi_select',
            value: multiSelectMap[columnId]
          });
        });
        
        return {
          id: row.id,
          row_number: row.row_number,
          cells: cells,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      })
    );
    
    client.release();
    
    res.json({
      rows: rowsWithCells,
      pagination: {
        page: page,
        limit: limit,
        total: totalRows,
        pages: Math.ceil(totalRows / limit)
      }
    });
    
  } catch (err) {
    console.error('Error fetching rows:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch rows: ' + err.message 
    });
  }
});

// DELETE /api/rows/:id - Delete a row
router.delete('/rows/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid row ID is required' 
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, check if row exists
    const checkQuery = 'SELECT id, row_number FROM data_rows WHERE id = $1 AND is_active = TRUE';
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false,
        error: 'Row not found' 
      });
    }
    
    const rowNumber = checkResult.rows[0].row_number;
    
    // Delete all cell values for this row
    await client.query('DELETE FROM cell_values WHERE row_id = $1', [id]);
    
    // Delete all multi-select values for this row
    await client.query('DELETE FROM multi_select_values WHERE row_id = $1', [id]);
    
    // Mark row as inactive instead of deleting
    await client.query('UPDATE data_rows SET is_active = FALSE WHERE id = $1', [id]);
    
    // Update row numbers of remaining rows
    await client.query('UPDATE data_rows SET row_number = row_number - 1 WHERE row_number > $1 AND is_active = TRUE', [rowNumber]);
    
    // Update row summary
    const summaryQuery = `
      UPDATE row_summary SET 
        total_rows = total_rows - 1,
        active_rows = active_rows - 1,
        last_updated = CURRENT_TIMESTAMP
    `;
    await client.query(summaryQuery);
    
    await client.query('COMMIT');
    client.release();
    
    console.log(`Row ${id} (row number ${rowNumber}) deleted successfully`);
    
    res.json({ 
      success: true,
      message: 'Row deleted successfully',
      deleted_row_number: rowNumber
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Delete row error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete row: ' + err.message 
    });
  }
});

// POST /api/rows - Create a new row
router.post('/rows', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    await client.query('BEGIN');
    
    // Increment all existing row numbers to make room for new row at top
    const incrementQuery = 'UPDATE data_rows SET row_number = row_number + 1';
    await client.query(incrementQuery);
    
    // Insert new row at the top (row number 1)
    const rowQuery = `
      INSERT INTO data_rows (row_number)
      VALUES (1)
      RETURNING id, row_number, created_at, updated_at
    `;
    const rowResult = await client.query(rowQuery);
    const newRow = rowResult.rows[0];
    
    // Update row summary
    const summaryQuery = `
      UPDATE row_summary SET 
        total_rows = total_rows + 1,
        active_rows = active_rows + 1,
        last_row_number = 1,
        last_updated = CURRENT_TIMESTAMP
    `;
    await client.query(summaryQuery);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      id: newRow.id,
      row_number: newRow.row_number,
      cells: [], // New row starts with no cells
      created_at: newRow.created_at,
      updated_at: newRow.updated_at
    });
    
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Error creating row:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create row: ' + err.message 
    });
  }
});

// PATCH /api/cell - Update cell value
router.patch('/cell', async (req, res) => {
  const { row_id, column_id, data_type, value } = req.body;
  
  // Validation
  if (!row_id || !column_id || !data_type) {
    return res.status(400).json({ 
      success: false,
      error: 'column_id is required' 
    });
  }
  
  const validTypes = ['text', 'number', 'datetime', 'single_select', 'multi_select'];
  if (!validTypes.includes(data_type)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid data_type. Must be one of: ' + validTypes.join(', ') 
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Validate row exists
    const rowCheckQuery = 'SELECT id FROM data_rows WHERE id = $1 AND is_active = TRUE';
    const rowResult = await client.query(rowCheckQuery, [row_id]);
    if (rowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false,
        error: 'Row not found' 
      });
    }
    
    // Validate column exists and get column info
    const columnQuery = `
      SELECT id, column_type 
      FROM columns_meta 
      WHERE id = $1 AND is_active = TRUE
    `;
    const columnResult = await client.query(columnQuery, [column_id]);
    if (columnResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false,
        error: 'Column not found' 
      });
    }
    
    const columnType = columnResult.rows[0].column_type;
    
    // Validate data type matches column type
    if (data_type !== columnType) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false,
        error: `Data type '${data_type}' does not match column type '${columnType}'` 
      });
    }
    
    // Type-specific validation
    if (data_type === 'text') {
      if (typeof value !== 'string') {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false,
          error: 'Text value must be a string' 
        });
      }
    } else if (data_type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false,
          error: 'Invalid number value' 
        });
      }
    } else if (data_type === 'datetime') {
      if (!value || isNaN(Date.parse(value))) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false,
          error: 'Invalid datetime value' 
        });
      }
    } else if (data_type === 'single_select') {
      if (typeof value !== 'number') {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false,
          error: 'Single select value must be a number' 
        });
      }
      
      // Validate option exists
      const optionQuery = `
        SELECT id FROM dropdown_options 
        WHERE column_id = $1 AND id = $2 AND is_active = TRUE
      `;
      const optionResult = await client.query(optionQuery, [column_id, value]);
      if (optionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false,
          error: 'Invalid option ID' 
        });
      }
    } else if (data_type === 'multi_select') {
      if (!Array.isArray(value)) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false,
          error: 'Multi select value must be an array' 
        });
      }
      
      // Validate all option IDs exist
      if (value.length > 0) {
        const optionIdsQuery = `
          SELECT id FROM dropdown_options 
          WHERE column_id = $1 AND id = ANY($2) AND is_active = TRUE
        `;
        const optionIdsResult = await client.query(optionIdsQuery, [column_id, value]);
        if (optionIdsResult.rows.length !== value.length) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ 
            success: false,
            error: 'Invalid option IDs' 
          });
        }
      }
    }
    
    // Delete existing cell value if it exists
    const deleteCellQuery = 'DELETE FROM cell_values WHERE row_id = $1 AND column_id = $2';
    await client.query(deleteCellQuery, [row_id, column_id]);
    
    // Delete existing multi-select values if they exist
    const deleteMultiQuery = 'DELETE FROM multi_select_values WHERE row_id = $1 AND column_id = $2';
    await client.query(deleteMultiQuery, [row_id, column_id]);
    
    // Insert new cell value based on type
    if (data_type === 'text') {
      const insertQuery = `
        INSERT INTO cell_values (row_id, column_id, text_value)
        VALUES ($1, $2, $3)
      `;
      await client.query(insertQuery, [row_id, column_id, value]);
    } else if (data_type === 'number') {
      const insertQuery = `
        INSERT INTO cell_values (row_id, column_id, number_value)
        VALUES ($1, $2, $3)
      `;
      await client.query(insertQuery, [row_id, column_id, value]);
    } else if (data_type === 'datetime') {
      const insertQuery = `
        INSERT INTO cell_values (row_id, column_id, datetime_value)
        VALUES ($1, $2, $3)
      `;
      await client.query(insertQuery, [row_id, column_id, value]);
    } else if (data_type === 'single_select') {
      const insertQuery = `
        INSERT INTO cell_values (row_id, column_id, single_select_value)
        VALUES ($1, $2, $3)
      `;
      await client.query(insertQuery, [row_id, column_id, value]);
    } else if (data_type === 'multi_select') {
      // Insert multi-select values
      for (const optionId of value) {
        const insertQuery = `
          INSERT INTO multi_select_values (row_id, column_id, option_id)
          VALUES ($1, $2, $3)
        `;
        await client.query(insertQuery, [row_id, column_id, optionId]);
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Cell updated successfully',
      row_id: row_id,
      column_id: column_id,
      data_type: data_type,
      value: value
    });
    
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Error updating cell:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update cell: ' + err.message 
    });
  }
});

// GET /api/summary - Get column summaries
router.get('/summary', async (req, res) => {
  try {
    const client = await pool.connect();
    
    
    // Get all active columns
    const columnsQuery = `
      SELECT id, column_name, column_type, display_order
      FROM columns_meta 
      WHERE is_active = TRUE 
      ORDER BY display_order, id
    `;
    const columnsResult = await client.query(columnsQuery);
    
    const summaries = await Promise.all(
      columnsResult.rows.map(async (column) => {
        let summary = null;
        
        if (column.column_type === 'text') {
          // Text columns have no summary
          summary = null;
          
        } else if (column.column_type === 'number') {
          // Sum, average, and count of all number values
          const numberQuery = `
            SELECT 
              COALESCE(SUM(number_value), 0) as sum_value, 
              COALESCE(AVG(number_value), 0) as avg_value,
              COUNT(*) as count
            FROM cell_values 
            WHERE column_id = $1 AND number_value IS NOT NULL
          `;
          const numberResult = await client.query(numberQuery, [column.id]);
          summary = {
            sum: parseFloat(numberResult.rows[0].sum_value),
            average: parseFloat(numberResult.rows[0].avg_value),
            count: parseInt(numberResult.rows[0].count)
          };
          
        } else if (column.column_type === 'datetime') {
          // Value closest to now
          const datetimeQuery = `
            SELECT datetime_value
            FROM cell_values 
            WHERE column_id = $1 AND datetime_value IS NOT NULL
            ORDER BY ABS(EXTRACT(EPOCH FROM (datetime_value - NOW())))
            LIMIT 1
          `;
          const datetimeResult = await client.query(datetimeQuery, [column.id]);
          summary = datetimeResult.rows.length > 0 ? datetimeResult.rows[0].datetime_value : null;
          
        } else if (column.column_type === 'single_select') {
          // Most frequent option - get actual department names from dropdown_options
          const singleSelectQuery = `
            SELECT 
              opt.option_value,
              COUNT(*) as frequency
            FROM cell_values cv
            JOIN dropdown_options opt ON (
              cv.single_select_value = opt.option_value OR 
              cv.single_select_value = opt.id::text
            )
            WHERE cv.column_id = $1 AND cv.single_select_value IS NOT NULL 
              AND opt.is_active = TRUE
            GROUP BY opt.option_value
            ORDER BY frequency DESC, opt.option_value ASC
            LIMIT 1
          `;
          const singleSelectResult = await client.query(singleSelectQuery, [column.id]);
          
          summary = singleSelectResult.rows.length > 0 ? {
            most_frequent: singleSelectResult.rows[0].option_value,
            count: parseInt(singleSelectResult.rows[0].frequency)
          } : null;
          
        } else if (column.column_type === 'multi_select') {
          // Most frequent option(s)
          const multiSelectQuery = `
            SELECT 
              opt.option_value,
              COUNT(*) as frequency
            FROM multi_select_values msv
            JOIN dropdown_options opt ON msv.option_id = opt.id
            WHERE msv.column_id = $1 AND opt.is_active = TRUE
            GROUP BY opt.option_value
            ORDER BY frequency DESC, opt.option_value ASC
          `;
          const multiSelectResult = await client.query(multiSelectQuery, [column.id]);
          
          if (multiSelectResult.rows.length > 0) {
            const maxFrequency = multiSelectResult.rows[0].frequency;
            const mostFrequent = multiSelectResult.rows.filter(row => 
              parseInt(row.frequency) === parseInt(maxFrequency)
            );
            summary = {
              most_frequent: mostFrequent.map(row => row.option_value),
              count: parseInt(maxFrequency)
            };
          } else {
            summary = null;
          }
        }
        
        return {
          column_id: column.id,
          column_name: column.column_name,
          column_type: column.column_type,
          display_order: column.display_order,
          summary: summary
        };
      })
    );
    
    client.release();
    
    res.json({
      summaries: summaries,
      total_columns: summaries.length,
      generated_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate summary: ' + err.message 
    });
  }
});

// DELETE /api/columns/:id - Delete a column
router.delete('/columns/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid column ID is required' 
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, check if column exists
    const checkQuery = 'SELECT id, column_name FROM columns_meta WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false,
        error: 'Column not found' 
      });
    }
    
    // Delete all cell values for this column
    await client.query('DELETE FROM cell_values WHERE column_id = $1', [id]);
    
    // Delete all multi-select values for this column
    await client.query('DELETE FROM multi_select_values WHERE column_id = $1', [id]);
    
    // Delete all dropdown options for this column
    await client.query('DELETE FROM dropdown_options WHERE column_id = $1', [id]);
    
    // Delete the column itself
    await client.query('DELETE FROM columns_meta WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    client.release();
    
    console.log(`Column ${id} deleted successfully`);
    
    res.json({ 
      success: true,
      message: 'Column deleted successfully' 
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Delete column error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete column: ' + err.message 
    });
  }
});

// POST /api/cleanup/columns - Remove all columns after Status
router.post('/cleanup/columns', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find the Status column
    const statusQuery = `
      SELECT id, display_order 
      FROM columns_meta 
      WHERE column_name = 'Status' AND is_active = TRUE
    `;
    const statusResult = await client.query(statusQuery);
    
    if (statusResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false,
        error: 'Status column not found' 
      });
    }
    
    const statusColumn = statusResult.rows[0];
    const statusOrder = statusColumn.display_order;
    
    // Find all columns after Status
    const columnsToDeleteQuery = `
      SELECT id, column_name 
      FROM columns_meta 
      WHERE display_order > $1 AND is_active = TRUE
      ORDER BY display_order
    `;
    const columnsToDelete = await client.query(columnsToDeleteQuery, [statusOrder]);
    
    console.log(`Found ${columnsToDelete.rows.length} columns to delete after Status:`);
    columnsToDelete.rows.forEach(col => console.log(`- ${col.column_name} (ID: ${col.id})`));
    
    // Delete each column and its data
    for (const column of columnsToDelete.rows) {
      console.log(`Deleting column: ${column.column_name} (ID: ${column.id})`);
      
      // Delete all cell values for this column
      await client.query('DELETE FROM cell_values WHERE column_id = $1', [column.id]);
      
      // Delete all multi-select values for this column
      await client.query('DELETE FROM multi_select_values WHERE column_id = $1', [column.id]);
      
      // Delete all dropdown options for this column
      await client.query('DELETE FROM dropdown_options WHERE column_id = $1', [column.id]);
      
      // Delete the column itself
      await client.query('DELETE FROM columns_meta WHERE id = $1', [column.id]);
    }
    
    await client.query('COMMIT');
    client.release();
    
    res.json({ 
      success: true,
      message: `Deleted ${columnsToDelete.rows.length} columns after Status`,
      deleted_columns: columnsToDelete.rows.map(col => ({
        id: col.id,
        name: col.column_name
      }))
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Cleanup columns error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cleanup columns: ' + err.message 
    });
  }
});

// Debug endpoint to check all columns
router.get('/debug/columns', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get all columns from database
    const result = await client.query(`
      SELECT 
        id, column_name, column_type, display_order, is_active, created_at
      FROM columns_meta 
      ORDER BY display_order, id
    `);
    
    // Get active columns only
    const activeResult = await client.query(`
      SELECT 
        id, column_name, column_type, display_order, is_active, created_at
      FROM columns_meta 
      WHERE is_active = TRUE
      ORDER BY display_order, id
    `);
    
    client.release();
    
    res.json({
      total_columns: result.rows.length,
      active_columns: activeResult.rows.length,
      all_columns: result.rows,
      active_columns_only: activeResult.rows,
      message: 'All columns from database'
    });
    
  } catch (err) {
    console.error('Debug columns error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to check department data
router.get('/debug/department', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Check what's actually in the department column
    const result = await client.query(`
      SELECT 
        cv.row_id,
        cv.single_select_value,
        dr.row_number
      FROM cell_values cv
      JOIN data_rows dr ON cv.row_id = dr.id
      WHERE cv.column_id = 4
      ORDER BY dr.row_number
    `);
    
    // Check if we need to fix the data
    const needsFix = result.rows.some(row => 
      !isNaN(parseInt(row.single_select_value)) && 
      parseInt(row.single_select_value) > 0 && 
      parseInt(row.single_select_value) <= 10
    );
    
    client.release();
    
    res.json({
      department_data: result.rows,
      total_records: result.rows.length,
      needs_fix: needsFix,
      message: needsFix ? 'Data appears to be stored as numbers instead of department names' : 'Data looks correct'
    });
    
  } catch (err) {
    console.error('Debug department error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fix department data endpoint
router.post('/fix/department', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // First, check what data we have
    const checkQuery = `
      SELECT single_select_value, COUNT(*) as count
      FROM cell_values 
      WHERE column_id = 4 AND single_select_value IS NOT NULL 
      GROUP BY single_select_value
    `;
    const checkResult = await client.query(checkQuery);
    console.log('Before fix - Department data:', checkResult.rows);
    
    // Department mapping: number -> department name
    const departmentMap = {
      '1': 'Engineering',
      '2': 'Marketing', 
      '3': 'Sales',
      '4': 'HR',
      '5': 'Finance'
    };
    
    let updateCount = 0;
    
    // Update all department values
    for (const [number, name] of Object.entries(departmentMap)) {
      const updateResult = await client.query(`
        UPDATE cell_values 
        SET single_select_value = $1 
        WHERE column_id = 4 AND single_select_value = $2
      `, [name, number]);
      updateCount += updateResult.rowCount;
      console.log(`Updated ${updateResult.rowCount} records from ${number} to ${name}`);
    }
    
    // Check the result
    const afterResult = await client.query(checkQuery);
    console.log('After fix - Department data:', afterResult.rows);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Department data has been fixed',
      updated_mappings: departmentMap,
      records_updated: updateCount,
      before_data: checkResult.rows,
      after_data: afterResult.rows
    });
    
  } catch (err) {
    console.error('Fix department error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cells routes (legacy endpoints)
router.get('/cells', (req, res) => {
  res.json({ message: 'Get cells - to be implemented' });
});

router.put('/cells', (req, res) => {
  res.json({ message: 'Update cell - to be implemented' });
});

module.exports = router;
