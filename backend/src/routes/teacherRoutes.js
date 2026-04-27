const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "campus-voting-admin-secret";

// ===============================
// TEACHER AUTH MIDDLEWARE
// ===============================
const checkTeacher = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(403).json({
        error: "Token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "teacher") {
      return res.status(403).json({
        error: "Teacher access only"
      });
    }

    // REAL-TIME SECURITY CHECK
    const teacherCheck = await pool.query(
      "SELECT id FROM teachers WHERE id = $1",
      [decoded.teacher_id]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(401).json({
        message: "Account deleted. Please login again."
      });
    }

    req.teacher = decoded;
    next();

  } catch (error) {
    return res.status(403).json({
      error: "Invalid or expired token"
    });
  }
};

// ===============================
// TEACHER LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required"
      });
    }

    const result = await pool.query(
      "SELECT * FROM teachers WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username"
      });
    }

    const teacher = result.rows[0];

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        teacher_id: teacher.id,
        username: teacher.username,
        role: teacher.role
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Teacher login successful",
      teacher_id: teacher.id,
      role: teacher.role,
      token
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===============================
// ELECTION STATUS
// ===============================
router.get("/election-status", checkTeacher, async (req, res) => {
  const result = await pool.query(
    "SELECT is_active FROM election LIMIT 1"
  );

  res.json(result.rows[0]);
});

// ===============================
// TEACHER PROFILE / MY CLASS
// ===============================
router.get("/my-class", checkTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No class assigned" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/profile", checkTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );
    
    res.json({
      username: req.teacher.username,
      department: result.rows[0]?.department || null,
      year: result.rows[0]?.year || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// DASHBOARD (CLASS / DEPARTMENT SPECIFIC)
// ===============================
router.get("/dashboard/stats", checkTeacher, async (req, res) => {
  try {
    // 1. Get Assignment
    const assignResult = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );

    if (assignResult.rows.length === 0) {
      return res.status(404).json({ error: "No class assigned" });
    }

    const { department, year } = assignResult.rows[0];

    // 2. Get Stats
    const statsResult = await pool.query(
      `
      SELECT 
        COUNT(*) AS total_students,
        COUNT(*) FILTER (WHERE has_voted = true) AS total_votes,
        ROUND(
          (
            COUNT(*) FILTER (WHERE has_voted = true)::decimal /
            NULLIF(COUNT(*), 0)::decimal
          ) * 100,
          2
        ) AS turnout_percentage
      FROM students
      WHERE department = $1 AND year = $2
      `,
      [department, year]
    );

    res.json({
      department,
      year,
      ...statsResult.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/students", checkTeacher, async (req, res) => {
  try {
    const assignResult = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );

    if (assignResult.rows.length === 0) {
      return res.status(404).json({ error: "No class assigned" });
    }

    const { department, year } = assignResult.rows[0];

    const result = await pool.query(
      "SELECT erp_id, name, has_voted FROM students WHERE department = $1 AND year = $2 ORDER BY erp_id",
      [department, year]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ===============================
// VOTED STUDENTS
// ===============================
router.get("/students/voted/export", checkTeacher, async (req, res) => {
  try {
    const assignResult = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );

    if (assignResult.rows.length === 0) {
      return res.status(404).json({ error: "No class assigned" });
    }

    const { department, year } = assignResult.rows[0];

    const result = await pool.query(
      `
      SELECT erp_id, name, department, year
      FROM students
      WHERE has_voted = true
        AND department = $1
        AND year = $2
      ORDER BY erp_id
      `,
      [department, year]
    );

    let csvData = "ERP ID,Name,Department,Year,Status\n";

    result.rows.forEach((student) => {
      csvData += `${student.erp_id},${student.name},${student.department},${student.year},VOTED\n`;
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=voted_students.csv"
    );
    res.setHeader("Content-Type", "text/csv");

    res.status(200).send(csvData);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===============================
// PENDING STUDENTS
// ===============================
router.get("/students/pending/export", checkTeacher, async (req, res) => {
  try {
    const assignResult = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );

    if (assignResult.rows.length === 0) {
      return res.status(404).json({ error: "No class assigned" });
    }

    const { department, year } = assignResult.rows[0];

    const result = await pool.query(
      `
      SELECT erp_id, name, department, year
      FROM students
      WHERE has_voted = false
        AND department = $1
        AND year = $2
      ORDER BY erp_id
      `,
      [department, year]
    );

    let csvData = "ERP ID,Name,Department,Year,Status\n";

    result.rows.forEach((student) => {
      csvData += `${student.erp_id},${student.name},${student.department},${student.year},PENDING\n`;
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=pending_students.csv"
    );
    res.setHeader("Content-Type", "text/csv");

    res.status(200).send(csvData);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===============================
// FULL STUDENT EXPORT
// ===============================
router.get("/export-students", checkTeacher, async (req, res) => {
  try {
    const assignResult = await pool.query(
      "SELECT department, year FROM teacher_assignments WHERE teacher_id = $1",
      [req.teacher.teacher_id]
    );

    if (assignResult.rows.length === 0) {
      return res.status(404).json({ error: "No class assigned" });
    }

    const { department, year } = assignResult.rows[0];

    const result = await pool.query(
      `
      SELECT erp_id, name, department, year, has_voted
      FROM students
      WHERE department = $1 AND year = $2
      ORDER BY erp_id
      `,
      [department, year]
    );

    let csvData = "ERP ID,Name,Department,Year,Status\n";
    result.rows.forEach(student => {
      csvData += `${student.erp_id},${student.name},${student.department},${student.year},${student.has_voted ? 'VOTED' : 'PENDING'}\n`;
    });

    res.setHeader("Content-Disposition", `attachment; filename=class_students_${department}_${year}.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;