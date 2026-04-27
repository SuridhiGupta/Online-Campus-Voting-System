const pool = require('../backend/src/config/db.js');
(async () => {
    try {
        const tables = ['teachers', 'teacher_assignments', 'votes'];
        for (const t of tables) {
            const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [t]);
            console.log(`TABLE: ${t}`);
            console.log(res.rows);
        }
        const constraintsRes = await pool.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid WHERE r.relname = 'votes'");
        console.log('CONSTRAINTS (votes):');
        console.log(constraintsRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
