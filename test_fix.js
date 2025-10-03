// Test script to verify the fix for the PostgreSQL type mismatch error
const { Pool } = require('pg');

async function testFix() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'spreadsheet_db',
    password: 'password',
    port: 5432
  });

  try {
    console.log('Testing the fixed query...');
    
    // Test the fixed query (this should work now)
    const testQuery = `
      SELECT 
        opt.option_value,
        COUNT(*) as frequency
      FROM cell_values cv
      JOIN dropdown_options opt ON cv.single_select_value = opt.option_value
      WHERE cv.column_id = $1 AND cv.single_select_value IS NOT NULL 
        AND opt.is_active = TRUE
      GROUP BY opt.option_value
      ORDER BY frequency DESC, opt.option_value ASC
      LIMIT 1
    `;
    
    const result = await pool.query(testQuery, [1]); // Test with column_id = 1
    console.log('Query executed successfully!');
    console.log('Result:', result.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === '42883') {
      console.error('Type mismatch error still exists!');
    }
  } finally {
    await pool.end();
  }
}

testFix();
