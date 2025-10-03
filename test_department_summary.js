// Test script to verify department summary functionality
const { Pool } = require('pg');

async function testDepartmentSummary() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'spreadsheet_db',
    password: 'password',
    port: 5432
  });

  try {
    console.log('Testing department summary functionality...');
    
    // Test the improved single_select query
    const testQuery = `
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
    
    // Test with department column (assuming column_id = 4)
    const result = await pool.query(testQuery, [4]);
    console.log('Department summary result:', result.rows);
    
    if (result.rows.length > 0) {
      console.log(`Most frequent department: ${result.rows[0].option_value} (${result.rows[0].frequency} times)`);
    } else {
      console.log('No department data found');
    }
    
    // Also test what raw data looks like
    const rawDataQuery = `
      SELECT 
        cv.single_select_value,
        COUNT(*) as count
      FROM cell_values cv
      WHERE cv.column_id = 4 AND cv.single_select_value IS NOT NULL
      GROUP BY cv.single_select_value
      ORDER BY count DESC
    `;
    
    const rawResult = await pool.query(rawDataQuery);
    console.log('Raw department data:', rawResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === '42883') {
      console.error('Type mismatch error still exists!');
    }
  } finally {
    await pool.end();
  }
}

testDepartmentSummary();
