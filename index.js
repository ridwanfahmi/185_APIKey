const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;
const express = require("express");
const { Sequelize } = require("sequelize");


app.use(express.json());

// Database connection langsung di sini
const db = mysql.createConnection({
  host: "localhost",
  user: "root",   // default MySQL (ubah kalau punya password)
  password: "(Dagadu123)0",   
  database: "apikey_db",
  port: "3309"
});

db.authenticate()
  .then(() => console.log("✅ Database connected..."))
  .catch(err => console.log("❌ Error: " + err));

// Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

// ===== In-memory storage sementara =====
let myApiKey = null;
const API_PREFIX = 'sk-sm-v1-';
const API_REGEX = new RegExp('^' + API_PREFIX + '[0-9A-F]{48}$'); // 24 bytes -> 48 hex uppercase

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate & simpan API key
app.post('/create', (req, res) => {
  const apiKey = API_PREFIX + crypto.randomBytes(24).toString('hex').toUpperCase();
  myApiKey = apiKey; // simpan sementara
  res.json({ apiKey });
});

// Cek validitas API key
app.post('/cekapi', (req, res) => {
  // Bisa kirim lewat body: { apiKey: "..." } atau Authorization: Bearer ...
  const fromHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const apiKey = (req.body && req.body.apiKey) ? String(req.body.apiKey) : fromHeader;

  if (!apiKey) {
    return res.status(400).json({ valid: false, error: 'apiKey wajib dikirim (body.apiKey atau Authorization: Bearer ...)' });
  }
  if (!API_REGEX.test(apiKey)) {
    return res.status(400).json({ valid: false, error: 'Format apiKey tidak valid' });
  }
  if (!myApiKey) {
    return res.status(409).json({ valid: false, error: 'Belum ada API key yang dibuat. Panggil /create dulu.' });
  }

  // Secure, timing-safe comparison
  const a = Buffer.from(apiKey);
  const b = Buffer.from(myApiKey);
  const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

  return res.status(isValid ? 200 : 401).json({ valid: isValid });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});