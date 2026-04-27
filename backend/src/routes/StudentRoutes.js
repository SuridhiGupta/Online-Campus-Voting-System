const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ================================
// STUDENT LOGIN / ERP VERIFICATION
// ================================
router.post("/login", async (req, res) => {
  try {
    const { erp_id } = req.body;

    if (!erp_id) {
      return res.status(400).json({
        success: false,
        message: "ERP ID is required"
      });
    }

    const result = await pool.query(
      "SELECT id, name, erp_id, department, year, has_voted FROM students WHERE erp_id = $1",
      [erp_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // LOCK ACCOUNT AFTER FINISH
    if (result.rows[0].has_voted === true) {
      return res.status(403).json({
        success: false,
        message: "Voting already completed. Login locked."
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      student: result.rows[0]
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ================================
// CHECK ELECTION STATUS
// ================================
router.get("/election-status", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM election WHERE id = 1");
    const election = result.rows[0];

    if (!election) {
      return res.json({ success: true, status: 'NOT_SET', message: "Voting hasn’t been set up yet. Please contact the admin." });
    }

    const { is_active, start_time, end_time } = election;
    const now = new Date();

    if (!is_active && !start_time) {
      return res.json({ success: true, status: 'NOT_SET', message: "Voting hasn’t been set up yet. Please contact the admin." });
    }

    if (!is_active) {
      return res.json({ success: true, status: 'STOPPED', message: "Voting has been temporarily paused by the admin." });
    }

    if (now < new Date(start_time)) {
      return res.json({ 
        success: true,
        status: 'NOT_STARTED', 
        message: `Voting will start at ${new Date(start_time).toLocaleString()}. Please come back then.`,
        start_time
      });
    }

    if (now > new Date(end_time)) {
      return res.json({ success: true, status: 'ENDED', message: "Voting has ended. Thank you for participating." });
    }

    res.json({
      success: true,
      status: 'LIVE',
      message: "Voting is live",
      end_time
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================================
// GET ALL POSTS WITH CANDIDATES
// ================================
router.get("/vote-screen", async (req, res) => {
  try {
    // check election status first
    const electionRes = await pool.query("SELECT * FROM election WHERE id = 1");
    const election = electionRes.rows[0];
    const now = new Date();

    if (!election || !election.is_active || !election.start_time || now < new Date(election.start_time) || now > new Date(election.end_time)) {
      return res.status(403).json({
        success: false,
        message: "Voting is currently unavailable"
      });
    }

    const result = await pool.query(`
      SELECT
        p.id AS post_id,
        p.title AS post_name,
        c.id AS candidate_id,
        c.name AS candidate_name,
        c.photo_url
      FROM posts p
      LEFT JOIN candidates c
        ON p.id = c.post_id
      ORDER BY p.id, c.id
    `);

    const grouped = {};

    for (let row of result.rows) {
      if (!grouped[row.post_id]) {
        grouped[row.post_id] = {
          post_id: row.post_id,
          post_name: row.post_name,
          candidates: []
        };
      }

      if (row.candidate_id) {
        grouped[row.post_id].candidates.push({
          candidate_id: row.candidate_id,
          candidate_name: row.candidate_name,
          photo_url: row.photo_url
        });
      }
    }

    res.json({
      success: true,
      data: Object.values(grouped)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================
// SUBMIT VOTE
// ================================
router.post("/submit-vote", async (req, res) => {
  try {
    const { erp_id, post_id, candidate_id, skip } = req.body;

    // 1. Validate required fields
    if (!erp_id || !post_id) {
      return res.status(400).json({
        success: false,
        message: "ERP ID and Post ID are required"
      });
    }

    // 2. Check election active & timing
    const electionRes = await pool.query("SELECT * FROM election WHERE id = 1");
    const election = electionRes.rows[0];
    const now = new Date();

    if (!election || !election.is_active || !election.start_time || now < new Date(election.start_time) || now > new Date(election.end_time)) {
      return res.status(403).json({
        success: false,
        message: "Voting is currently unavailable. Please try again later."
      });
    }

    // 3. Get student
    const studentResult = await pool.query(
      "SELECT id, has_voted FROM students WHERE erp_id = $1",
      [erp_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const student_id = studentResult.rows[0].id;

    // 4. Prevent vote after final submission
    if (studentResult.rows[0].has_voted === true) {
      return res.status(403).json({
        success: false,
        message: "Voting already completed"
      });
    }

    // 5. Check duplicate vote for same post
    const existingVote = await pool.query(
      "SELECT id FROM votes WHERE student_id = $1 AND post_id = $2",
      [student_id, post_id]
    );

    if (existingVote.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vote already submitted for this post"
      });
    }

    // 6. Handle vote submission
    if (!skip) {
      if (!candidate_id) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID is required"
        });
      }

      // IMPORTANT FIX:
      // validate candidate belongs to selected post
      const candidateCheck = await pool.query(
        `SELECT id
         FROM candidates
         WHERE id = $1 AND post_id = $2`,
        [candidate_id, post_id]
      );

      if (candidateCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid candidate for selected post"
        });
      }

      // Insert vote
      await pool.query(
        `INSERT INTO votes (student_id, candidate_id, post_id)
         VALUES ($1, $2, $3)`,
        [student_id, candidate_id, post_id]
      );
    }

    // 7. Check if all posts completed
    const totalPosts = await pool.query(
      "SELECT COUNT(*) FROM posts"
    );

    const completedPosts = await pool.query(
      "SELECT COUNT(DISTINCT post_id) FROM votes WHERE student_id = $1",
      [student_id]
    );

    if (
      Number(completedPosts.rows[0].count) >=
      Number(totalPosts.rows[0].count)
    ) {
      await pool.query(
        "UPDATE students SET has_voted = true WHERE id = $1",
        [student_id]
      );
    }

    return res.json({
      success: true,
      message: skip
        ? "Post skipped successfully"
        : "Vote submitted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================
// FINISH VOTING
// ================================
router.post("/finish-voting", async (req, res) => {
  try {
    const { erp_id } = req.body;

    // 1. Validate input
    if (!erp_id) {
      return res.status(400).json({
        success: false,
        message: "ERP ID is required"
      });
    }

    // 2. Check student exists
    const studentCheck = await pool.query(
      "SELECT id, name, erp_id, has_voted FROM students WHERE erp_id = $1",
      [erp_id]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // 3. Prevent duplicate finish
    if (studentCheck.rows[0].has_voted === true) {
      return res.status(400).json({
        success: false,
        message: "Voting already completed"
      });
    }

    // 4. Lock student after final submission
    const result = await pool.query(
      `
      UPDATE students
      SET has_voted = true
      WHERE erp_id = $1
      RETURNING id, name, erp_id, has_voted
      `,
      [erp_id]
    );

    // 5. Success response
    return res.json({
      success: true,
      message: "Voting completed successfully",
      student: result.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================================
// REVIEW VOTING STATUS
// ================================
router.get("/review-votes/:erp_id", async (req, res) => {
  try {
    const { erp_id } = req.params;

    // find student
    const studentResult = await pool.query(
      "SELECT id, name, erp_id, has_voted FROM students WHERE erp_id = $1",
      [erp_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const student_id = studentResult.rows[0].id;

    // get all posts
    const postsResult = await pool.query(
      "SELECT id, title FROM posts ORDER BY id"
    );

    // get voted posts
    const votedResult = await pool.query(
      `
      SELECT post_id, candidate_id
      FROM votes
      WHERE student_id = $1
      `,
      [student_id]
    );

    const votedMap = {};
    votedResult.rows.forEach(vote => {
      votedMap[vote.post_id] = vote.candidate_id;
    });

    const reviewData = postsResult.rows.map(post => ({
      post_id: post.id,
      post_name: post.title,
      status: votedMap[post.id] ? "completed" : "pending",
      candidate_id: votedMap[post.id] || null
    }));

    return res.json({
      success: true,
      student: studentResult.rows[0],
      review: reviewData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;