const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'voting_system',
  password: 'postgres',
  port: 5432,
});

async function updateData() {
  try {
    // Sync the teacher's department to the students' format
    await pool.query("UPDATE teachers SET department = 'AI/DS' WHERE username = 'teacher'");
    console.log('Successfully synced teacher department to AI/DS');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

updateData();
