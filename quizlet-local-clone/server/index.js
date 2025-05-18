const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { nanoid } = require('nanoid');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Port unique pour frontend + backend
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base de données (JSON)
const file = path.join(__dirname, 'data', 'sets.json');
const adapter = new FileSync(file);
const db = low(adapter);
db.defaults({ sets: [] }).write();

// Multer pour upload de fichier
const upload = multer({ dest: 'uploads/' });

// === API ROUTES ===

// GET all sets
app.get('/api/sets', (req, res) => {
  res.json(db.get('sets').value());
});

// GET one set
app.get('/api/sets/:id', (req, res) => {
  const set = db.get('sets').find({ id: req.params.id }).value();
  if (!set) return res.status(404).json({ error: 'Not found' });
  res.json(set);
});

// POST new set (JSON)
app.post('/api/sets', (req, res) => {
  const newSet = { ...req.body, id: nanoid() };
  db.get('sets').push(newSet).write();
  res.json(newSet);
});

// POST /api/sets/upload : upload fichier TXT
app.post('/api/sets/upload', upload.single('file'), (req, res) => {
  const { title, description } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = req.file.path;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const cards = lines.map(line => {
      const [term, definition] = line.split(';');
      if (!term || !definition) throw new Error("Ligne invalide: " + line);
      return { term: term.trim(), definition: definition.trim(), image: "" };
    });
    const newSet = {
      id: nanoid(),
      title: title || "Importé",
      description: description || "",
      cards
    };
    db.get('sets').push(newSet).write();
    res.json(newSet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    fs.unlink(filePath, () => {}); // Nettoie le fichier temporaire
  }
});

// PUT update set
app.put('/api/sets/:id', (req, res) => {
  const set = db.get('sets').find({ id: req.params.id });
  if (!set.value()) return res.status(404).json({ error: 'Not found' });
  set.assign(req.body).write();
  res.json(set.value());
});

// DELETE set
app.delete('/api/sets/:id', (req, res) => {
  db.get('sets').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// === FRONTEND (React/Vite buildé) ===

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// === Lancement du serveur ===

app.listen(PORT, () => {
  console.log(`App ready on http://localhost:${PORT}`);
});
