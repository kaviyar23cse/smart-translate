import express from 'express';
import jwt from 'jsonwebtoken';
import History from '../models/History.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const [, token] = h.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const items = await History.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
  	res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load history' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { original, translated, lang } = req.body || {};
    if (!original || !translated || !lang) return res.status(400).json({ error: 'Missing fields' });
    const item = await History.create({ user: req.userId, original, translated, lang });
    res.json({ item });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// DELETE /api/history - permanently delete all history for current user
router.delete('/', auth, async (req, res) => {
  try {
    const result = await History.deleteMany({ user: req.userId });
    return res.json({ deletedCount: result.deletedCount || 0 });
  } catch (e) {
    console.error('Failed to clear history:', e);
    return res.status(500).json({ error: 'Failed to clear history' });
  }
});

// DELETE /api/history/:id - delete single history item (must belong to current user)
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await History.findOne({ _id: id, user: req.userId });
    if (!doc) return res.status(404).json({ error: 'History item not found' });
    await History.deleteOne({ _id: id });
    return res.json({ deleted: true, id });
  } catch (e) {
    console.error('Failed to delete history item:', e);
    return res.status(500).json({ error: 'Failed to delete history item' });
  }
});

// POST /api/history/bulk-restore - restore multiple history items (expects array of items)
// (undo/restore removed — permanent delete only)

export default router;
