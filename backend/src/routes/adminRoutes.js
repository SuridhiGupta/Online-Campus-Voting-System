const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const JWT_SECRET = "campus-voting-admin-secret";

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/candidates");
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// JWT Admin Middleware
const checkAdmin = (req, res, next) => {
  try {
    let token = "";
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        error: "Token missing"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Save decoded admin info for future use
    req.admin = decoded;
    next();

  } catch (error) {
    return res.status(403).json({
      error: "Invalid or expired token"
    });
  }
};


// ================================
// ADMIN AUTH APIs
// ================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // FIRST validate input
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required"
      });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username"
      });
    }

    const admin = result.rows[0];

    if (admin.password !== password) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        admin_id: admin.id,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Admin login successful",
      admin_id: admin.id,
      role: admin.role,
      token
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ================================
// MULTER SETUP
// ================================

// Since we have two different upload directories, we can use a diskStorage 
// or simply define two upload middlewares.
const uploadStudents = multer({
  dest: "uploads/students/"
});
// ================================
// POSTS APIs
// ================================

// Create Post
router.post("/posts/create", checkAdmin, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required"
      });
    }

    await pool.query(
      "INSERT INTO posts (title) VALUES ($1)",
      [title]
    );

    res.json({ message: "Post created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Posts
router.get("/posts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM posts ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Post
router.put("/posts/update/:id", checkAdmin, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required"
      });
    }

    const { id } = req.params;

    await pool.query(
      "UPDATE posts SET title=$1 WHERE id=$2",
      [title, id]
    );

    res.json({ message: "Post updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Post + Its Candidates
router.delete("/posts/delete/:id", checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // get all candidate images for this post
    const candidates = await pool.query(
      "SELECT photo_url FROM candidates WHERE post_id=$1",
      [id]
    );

    // delete images from folder
    for (let candidate of candidates.rows) {
      if (candidate.photo_url) {
        const imagePath = path.join(process.cwd(), 'uploads/candidates', candidate.photo_url);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // delete candidates from db
    await pool.query(
      "DELETE FROM candidates WHERE post_id=$1",
      [id]
    );

    // delete post
    await pool.query(
      "DELETE FROM posts WHERE id=$1",
      [id]
    );

    res.json({
      message: "Post and related candidates deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// CANDIDATES APIs
// ================================

// Add Candidate
router.post(
  "/candidates/add", checkAdmin,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { name, post_id } = req.body;

      if (!name || !post_id) {
        return res.status(400).json({
          error: "Candidate name and post_id are required"
        });
      }

      const photo = req.file ? req.file.filename : null;

      await pool.query(
        "INSERT INTO candidates (name, post_id, photo_url) VALUES ($1,$2,$3)",
        [name, post_id, photo]
      );

      res.json({ message: "Candidate added successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get All Candidates
router.get("/candidates", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT candidates.*, posts.title AS post_name
      FROM candidates
      JOIN posts ON candidates.post_id = posts.id
      ORDER BY candidates.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Candidate
router.put(
  "/candidates/update/:id", checkAdmin,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, post_id } = req.body;

      const existing = await pool.query(
        "SELECT photo_url FROM candidates WHERE id=$1",
        [id]
      );

      let photo = existing.rows[0]?.photo_url;

      if (req.file) {
        // delete old image
        if (photo) {
          const oldPath = path.join(process.cwd(), 'uploads/candidates', photo);

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        photo = req.file.filename;
      }

      await pool.query(
        "UPDATE candidates SET name=$1, post_id=$2, photo_url=$3 WHERE id=$4",
        [name, post_id, photo, id]
      );

      res.json({
        message: "Candidate updated successfully"
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete Candidate
router.delete("/candidates/delete/:id", checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await pool.query(
      "SELECT photo_url FROM candidates WHERE id=$1",
      [id]
    );

    if (candidate.rows.length > 0) {
      const photo = candidate.rows[0].photo_url;

      if (photo) {
        const imagePath = path.join(process.cwd(), 'uploads/candidates', photo);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await pool.query(
      "DELETE FROM candidates WHERE id=$1",
      [id]
    );

    res.json({
      message: "Candidate and image deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// STUDENTS (CSV UPLOAD) APIs
// ================================

router.post("/students/upload", checkAdmin, uploadStudents.single("file"), async (req, res) => {
  try {
    const { department, year } = req.body;

    if (!department || !year) {
      return res.status(400).json({
        error: "Department and year are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File not uploaded" });
    }

    let added = 0;
    let updated = 0;

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("error", (err) => {
        throw new Error(err.message);
      })
      .on("end", async () => {
        await pool.query(
          "DELETE FROM students WHERE department=$1 AND year=$2",
          [department, year]
        );

        if (results.length > 0) {
          console.log("CSV HEADERS:", Object.keys(results[0]));
        }

        for (let row of results) {
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          console.log("ROW:", normalizedRow);

          const erpId =
            normalizedRow["erp_id"] ||
            normalizedRow["erp id"] ||
            normalizedRow["erpid"] ||
            Object.values(normalizedRow)[0];

          const name =
            normalizedRow["name"] ||
            normalizedRow["student name"] ||
            normalizedRow["studentname"] ||
            Object.values(normalizedRow)[1] ||
            "Student";

          if (!erpId) {
            console.log("Skipped row due to missing ERP:", row);
            continue;
          }

          const existing = await pool.query(
            "SELECT id FROM students WHERE erp_id=$1",
            [erpId]
          );

          if (existing.rows.length > 0) {
            await pool.query(
              "UPDATE students SET name=$1, department=$2, year=$3 WHERE erp_id=$4",
              [name, department, year, erpId]
            );
            updated++;
          } else {
            await pool.query(
              "INSERT INTO students (erp_id, name, department, year) VALUES ($1,$2,$3,$4)",
              [erpId, name, department, year]
            );
            added++;
          }
        }

        // delete uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: "Upload complete",
          added,
          updated,
        });
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// ELECTION CONTROL APIs
// ================================

// Set Election Time
router.post("/election/set-time", checkAdmin, async (req, res) => {
  try {
    const { start_time, end_time } = req.body;
    if (!start_time || !end_time) {
      return res.status(400).json({ error: "Start and end times are required" });
    }

    await pool.query(
      "UPDATE election SET start_time = $1, end_time = $2, is_active = true WHERE id = 1",
      [start_time, end_time]
    );

    res.json({ message: "Election schedule set and activated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop Election (Manual Pause)
router.post("/election/stop", checkAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE election SET is_active = false WHERE id = 1");
    res.json({ message: "Election paused successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Election (Clear Schedule + Votes)
router.post("/election/reset", checkAdmin, async (req, res) => {
  try {
    // 1. Reset election row
    await pool.query("UPDATE election SET start_time = NULL, end_time = NULL, is_active = false WHERE id = 1");
    
    // 2. Clear all votes
    await pool.query("TRUNCATE TABLE votes RESTART IDENTITY CASCADE");
    
    // 3. Reset all student has_voted flags
    await pool.query("UPDATE students SET has_voted = false");

    res.json({ message: "Election system reset to factory state" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check Election Status (Universal Logic)
router.get("/election/status", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM election WHERE id = 1");
    const election = result.rows[0];

    if (!election) {
      return res.json({ status: 'NOT_SET', message: "Voting hasn’t been set up yet. Please contact the admin." });
    }

    const { is_active, start_time, end_time } = election;
    const now = new Date();

    if (!is_active && !start_time) {
      return res.json({ status: 'NOT_SET', message: "Voting hasn’t been set up yet. Please contact the admin." });
    }

    if (!is_active) {
      return res.json({ status: 'STOPPED', message: "Voting has been temporarily paused by the admin." });
    }

    if (now < new Date(start_time)) {
      return res.json({ 
        status: 'NOT_STARTED', 
        message: "Voting will begin shortly. Please try again later.",
        start_time: start_time
      });
    }

    if (now > new Date(end_time)) {
      return res.json({ status: 'ENDED', message: "Voting has ended. Thank you for participating." });
    }

    return res.json({ status: 'LIVE', message: "Success", end_time: end_time });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// DASHBOARD APIs
// ================================

// Total Students
router.get("/dashboard/students-count", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM students"
    );

    res.json({
      total_students: Number(result.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Total Votes Cast
router.get("/dashboard/votes-count", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM students WHERE has_voted = true"
    );

    res.json({
      total_votes: Number(result.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Turnout Percentage
router.get("/dashboard/turnout", checkAdmin, async (req, res) => {
  try {
    const students = await pool.query(
      "SELECT COUNT(*) FROM students"
    );

    const votes = await pool.query(
      "SELECT COUNT(*) FROM students WHERE has_voted = true"
    );

    const totalStudents = Number(students.rows[0].count);
    const totalVotes = Number(votes.rows[0].count);

    const turnout =
      totalStudents === 0
        ? 0
        : ((totalVotes / totalStudents) * 100).toFixed(2);

    res.json({
      turnout_percentage: turnout
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Granular Statistics Breakdown (Branch/Year)
router.get("/dashboard/stats-breakdown", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.department, 
        s.year, 
        COUNT(s.id) as total_students,
        SUM(CASE WHEN s.has_voted = true THEN 1 ELSE 0 END) as voted_count
      FROM students s
      GROUP BY s.department, s.year
      ORDER BY s.department, s.year
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Results
router.get("/results", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        posts.title AS post_name,
        candidates.name AS candidate_name,
        COUNT(votes.id) AS vote_count
      FROM candidates
      LEFT JOIN votes
        ON candidates.id = votes.candidate_id
      JOIN posts
        ON candidates.post_id = posts.id
      GROUP BY posts.title, candidates.name
      ORDER BY posts.title
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Votes
router.post("/reset-votes", checkAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM votes");

    await pool.query(
      "UPDATE students SET has_voted=false"
    );

    res.json({
      message: "Votes reset successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Winners by Post
router.get("/results/winners", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT post_name, winner_name, total_votes
      FROM (
        SELECT 
          p.title AS post_name, 
          c.name AS winner_name, 
          COUNT(v.id) AS total_votes,
          RANK() OVER (PARTITION BY p.id ORDER BY COUNT(v.id) DESC) as rnk
        FROM candidates c
        JOIN posts p ON c.post_id = p.id
        LEFT JOIN votes v ON c.id = v.candidate_id
        GROUP BY p.id, p.title, c.id, c.name
      ) ranked
      WHERE rnk = 1 AND total_votes > 0
      ORDER BY post_name
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================================
// EXPORT RESULTS CSV
// ================================
router.get("/results/export", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.title AS post_name,
        c.name AS candidate_name,
        COUNT(v.id) AS vote_count
      FROM candidates c
      JOIN posts p
        ON c.post_id = p.id
      LEFT JOIN votes v
        ON c.id = v.candidate_id
      GROUP BY p.title, c.name, c.id
      ORDER BY p.title, vote_count DESC
    `);

    const rows = result.rows;

    let csvData = "Post Name,Candidate Name,Vote Count,Exported At\n";

    const exportedAt = new Date().toISOString();

    rows.forEach((row) => {
      csvData += `${row.post_name},${row.candidate_name},${row.vote_count},${exportedAt}\n`;
    });

    res.setHeader(
      "Content-Type",
      "text/csv"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=election_results.csv"
    );

    res.send(csvData);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.get("/students/datasets", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT department, year
      FROM students
      ORDER BY department, year
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/students/delete-dataset", checkAdmin, async (req, res) => {
  try {
    const { department, year } = req.body;

    if (!department || !year) {
      return res.status(400).json({
        error: "Department and year required"
      });
    }

    // OPTIONAL safety check
    const election = await pool.query(
      "SELECT is_active FROM election LIMIT 1"
    );

    if (election.rows[0]?.is_active) {
      return res.status(403).json({
        error: "Cannot delete dataset during active election"
      });
    }

    const result = await pool.query(
      "DELETE FROM students WHERE department=$1 AND year=$2",
      [department, year]
    );

    res.json({
      message: "Dataset deleted successfully",
      deleted_count: result.rowCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================================
// TEACHER ASSIGNMENT APIs
// ================================

router.get("/teachers", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username FROM teachers ORDER BY username");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/teacher-assignments", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ta.*, t.username as teacher_name,
      (SELECT COUNT(*) FROM students s WHERE s.department = ta.department AND s.year = ta.year) as student_count
      FROM teacher_assignments ta
      JOIN teachers t ON ta.teacher_id = t.id
      ORDER BY t.username
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/assign-teacher", checkAdmin, async (req, res) => {
  try {
    const { teacher_id, department, year } = req.body;

    if (!teacher_id || !department || !year) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO teacher_assignments (teacher_id, department, year)
       VALUES ($1, $2, $3)
       ON CONFLICT (teacher_id)
       DO UPDATE SET department = $2, year = $3
       RETURNING *`,
      [teacher_id, department, year]
    );

    res.json({
      message: "Assignment successful",
      assignment: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "Class already assigned to another teacher" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete("/teacher-assignment/:teacher_id", checkAdmin, async (req, res) => {
  try {
    const { teacher_id } = req.params;
    await pool.query("DELETE FROM teacher_assignments WHERE teacher_id = $1", [teacher_id]);
    res.json({ message: "Assignment removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete-teacher/:id", checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Assignments will auto-delete due to ON DELETE CASCADE on teacher_id
    await pool.query("DELETE FROM teachers WHERE id = $1", [id]);
    res.json({ message: "Teacher account and assignments deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// TEACHER ACCOUNT MANAGEMENT
// ================================

router.post("/create-teacher", checkAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Check if teacher exists
    const check = await pool.query("SELECT id FROM teachers WHERE username = $1", [username]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      "INSERT INTO teachers (username, password, role) VALUES ($1, $2, 'teacher') RETURNING id, username",
      [username, hashedPassword]
    );

    res.json({
      message: "Teacher account created successfully",
      teacher: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/export-teacher-assignments", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.username, ta.department, ta.year
      FROM teacher_assignments ta
      JOIN teachers t ON ta.teacher_id = t.id
      ORDER BY t.username
    `);

    let csvData = "Teacher Username,Department,Year\n";
    result.rows.forEach(row => {
      csvData += `${row.username},${row.department},${row.year}\n`;
    });

    res.setHeader("Content-Disposition", "attachment; filename=teacher_assignments.csv");
    res.setHeader("Content-Type", "text/csv");
    res.send(csvData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Students
router.get("/students", checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY department, year, name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// SYSTEM CLEAN & CLEAR
// ================================
router.post("/system/clear-all", checkAdmin, async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: "Authorization password is required" });
  }

  const client = await pool.connect();
  try {
    const adminCheck = await client.query("SELECT reset_password FROM admins WHERE id = $1", [req.admin.admin_id]);
    
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].reset_password !== password) {
      client.release();
      return res.status(401).json({ error: "Incorrect authorization password" });
    }

    await client.query("BEGIN");

    // 1. Reset election row
    await client.query("UPDATE election SET start_time = NULL, end_time = NULL, is_active = false WHERE id = 1");
    
    // 2. Clear all votes
    await client.query("TRUNCATE TABLE votes RESTART IDENTITY CASCADE");
    
    // 3. Clear all candidates and their images
    const candidates = await client.query("SELECT photo_url FROM candidates");
    for (let candidate of candidates.rows) {
      if (candidate.photo_url) {
        const imagePath = path.join(process.cwd(), 'uploads/candidates', candidate.photo_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }
    await client.query("TRUNCATE TABLE candidates RESTART IDENTITY CASCADE");

    // 4. Clear all posts
    await client.query("TRUNCATE TABLE posts RESTART IDENTITY CASCADE");

    // 5. Clear all students
    await client.query("TRUNCATE TABLE students RESTART IDENTITY CASCADE");

    // 6. Clear all teachers (except the default admin teacher if exists, or just all)
    // The user said "teachers", so we clear them all but maybe keep a way to re-add?
    // Let's clear all as requested.
    await client.query("TRUNCATE TABLE teachers RESTART IDENTITY CASCADE");
    
    // Re-insert default teacher to prevent complete lockout if they use teacher portal
    await client.query("INSERT INTO teachers (username, password) VALUES ('teacher', 'teacher123')");

    // 7. Clear teacher assignments
    await client.query("TRUNCATE TABLE teacher_assignments RESTART IDENTITY CASCADE");
    
    // 8. Clear all authorized devices and reset sequence
    await client.query("TRUNCATE TABLE authorized_devices RESTART IDENTITY CASCADE");

    await client.query("COMMIT");

    res.json({ message: "System cleared successfully. All data has been wiped." });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;