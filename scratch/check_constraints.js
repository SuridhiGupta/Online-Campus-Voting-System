const pool = require('../backend/src/config/db.js');
(async () => {
    try {
        const constraintsRes = await pool.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid WHERE r.relname = 'teacher_assignments'");
        console.log('CONSTRAINTS (teacher_assignments):');
        console.log(constraintsRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
