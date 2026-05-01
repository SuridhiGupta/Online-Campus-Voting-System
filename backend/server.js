const express = require("express");
const cors = require("cors");
const path = require("path");
const os = require("os");
const app = express();

// --- 1. INITIALIZE LAN IP DETECTION (Must be at top) ---
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};
const PORT = 5000;
const IP = getLocalIP();

// --- 2. MIDDLEWARE ---
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB Connection
const pool = require("./src/config/db");

// --- 3. DEVICE SECURITY SYSTEM ---
// Helper to check if a request is local
const checkIsLocal = (req) => {
  const remoteIp = req.ip || req.connection.remoteAddress || "";
  return req.hostname === 'localhost' || 
         remoteIp === '::1' || 
         remoteIp === '127.0.0.1' || 
         remoteIp.includes('127.0.0.1') || 
         remoteIp.includes(IP);
};

// Device Authorization Middleware
const deviceAuth = async (req, res, next) => {
  const isLocalhost = checkIsLocal(req);

  // MASTER BYPASS: Always allow the Server PC itself
  if (isLocalhost) {
    req.device = { role: 'admin', is_approved: true };
    return next();
  }

  // Allow these routes without auth (Register/Status)
  if (req.path === '/devices/register' || req.path === '/devices/status') return next();
  
  const fingerprint = req.headers['x-device-id'];
  
  if (!fingerprint) return res.status(403).json({ error: "Device Unidentified", code: "DEVICE_NO_ID" });

  try {
    const result = await pool.query("SELECT * FROM authorized_devices WHERE fingerprint = $1", [fingerprint]);
    const device = result.rows[0];

    if (!device || !device.is_approved) {
      return res.status(403).json({ error: "Device Not Authorized", code: "DEVICE_NOT_APPROVED", deviceId });
    }

    // Role-based Path Protection
    if (device.role === 'student') {
      if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/teacher')) {
        return res.status(403).json({ error: "Access Denied: Admin/Teacher privileges required" });
      }
    }
    
    if (device.role === 'admin') {
      if (req.path.startsWith('/api/student')) {
        return res.status(403).json({ error: "Access Denied: Admin cannot access Student Portal" });
      }
    }

    req.device = device;
    next();
  } catch (err) { res.status(500).json({ error: "Security check failed" }); }
};

// Apply security to all API routes
app.use('/api', deviceAuth);

// --- 4. API ROUTES ---
// Device Management Status
app.get("/api/devices/status", async (req, res) => {
  if (checkIsLocal(req)) {
    return res.json({ approved: true, role: 'admin' });
  }

  const fingerprint = req.headers['x-device-id'];
  if (!fingerprint) return res.json({ approved: false, device_no: null });
  const result = await pool.query("SELECT * FROM authorized_devices WHERE fingerprint = $1", [fingerprint]);
  const device = result.rows[0];

  if (!device) return res.json({ approved: false });

  // Calculate rank using simple JS array finding to guarantee it works
  const allDevices = await pool.query("SELECT fingerprint FROM authorized_devices ORDER BY created_at ASC, id ASC");
  const rank = allDevices.rows.findIndex(d => d.fingerprint === fingerprint) + 1;

  res.json({ 
    approved: device.is_approved || false, 
    role: device.role || 'pending',
    device_no: rank,
    deviceNo: rank
  });
});

app.post("/api/devices/register", async (req, res) => {
  const { deviceId, deviceName } = req.body;
  
  try {
    // Auto-approve if localhost
    if (checkIsLocal(req)) {
      const adminReg = await pool.query(
        "INSERT INTO authorized_devices (fingerprint, device_name, role, is_approved) VALUES ($1, $2, 'admin', TRUE) ON CONFLICT (fingerprint) DO UPDATE SET is_approved = TRUE, role = 'admin' RETURNING *",
        [deviceId, deviceName || 'Master Server PC']
      );
      const allDevices = await pool.query("SELECT fingerprint FROM authorized_devices ORDER BY created_at ASC, id ASC");
      const rank = allDevices.rows.findIndex(d => d.fingerprint === deviceId) + 1;
      return res.json({ 
        message: "Welcome Master Admin", 
        approved: true, 
        role: 'admin', 
        device_no: rank,
        deviceNo: rank
      });
    }
    // SECURITY: Block new registrations if election is live
    const electionRes = await pool.query("SELECT is_active FROM election LIMIT 1");
    if (electionRes.rows[0]?.is_active) {
      return res.status(403).json({ 
        error: "Election is currently live. Network is locked.",
        approved: false
      });
    }

    const registerRes = await pool.query(
      "INSERT INTO authorized_devices (fingerprint, device_name) VALUES ($1, $2) ON CONFLICT (fingerprint) DO UPDATE SET device_name = $2 RETURNING *" ,
      [deviceId, deviceName || 'Unknown Lab PC']
    );

    const allDevices = await pool.query("SELECT fingerprint FROM authorized_devices ORDER BY created_at ASC, id ASC");
    const rank = allDevices.rows.findIndex(d => d.fingerprint === deviceId) + 1;

    res.json({ 
      message: "Registration pending approval", 
      approved: false,
      device_no: rank,
      deviceNo: rank
    });
  } catch (err) { res.status(500).json({ error: "Registration failed" }); }
});

app.post("/api/admin/devices/approve", async (req, res) => {
  const { deviceId, role } = req.body;
  try {
    await pool.query(
      "UPDATE authorized_devices SET is_approved = TRUE, role = $1 WHERE fingerprint = $2",
      [role, deviceId]
    );
    res.json({ message: `Device approved as ${role}` });
  } catch (err) { res.status(500).json({ error: "Approval failed" }); }
});

app.get("/api/admin/devices/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM authorized_devices ORDER BY created_at ASC, id ASC");
    const devices = result.rows.map((device, index) => {
      let displayName = device.device_name || 'Unknown';
      const lowerName = displayName.toLowerCase();
      
      if (lowerName.includes('windows')) {
        displayName = 'Windows PC';
      } else if (lowerName.includes('android') || lowerName.includes('iphone') || lowerName.includes('mobile')) {
        displayName = 'Mobile Phone';
      } else if (lowerName.includes('mac')) {
        displayName = 'Mac';
      } else if (lowerName.includes('linux')) {
        displayName = 'Linux PC';
      }

      return {
        ...device,
        device_name: displayName,
        id: index + 1,
        device_no: index + 1,
        deviceNo: index + 1
      };
    });
    res.json(devices.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove Device Access
app.delete("/api/admin/devices/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM authorized_devices WHERE fingerprint = $1", [req.params.id]);
    res.json({ message: "Device access revoked" });
  } catch (err) { res.status(500).json({ error: "Removal failed" }); }
});

// Standard Project Routes
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/student", require("./src/routes/StudentRoutes"));
app.use("/api/teacher", require("./src/routes/teacherRoutes"));

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5. STATIC FILES & REACT ROUTER ---
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: "API not found" });
  }
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// --- 6. SERVER START ---
app.listen(PORT, "0.0.0.0", () => {
  console.log("------------------------------------------");
  console.log(`🚀 Voting Server running on LAN!`);
  console.log(`🏠 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${IP}:${PORT}`);
  console.log("------------------------------------------");
});
