// routes/favorites.js
const express = require('express');
const router = express.Router();
const { ensureTables, listFavorites, addFavorite, removeFavorite } = require('../models/favorites');

function getDeviceToken(req) {
  const token = (req.header('X-Device-Token') || '').trim();
  if (!token) throw new Error('MISSING_DEVICE_TOKEN');
  return token;
}

router.get('/', async (req, res) => {
  try {
    await ensureTables();
    const token = getDeviceToken(req);
    const rows = await listFavorites(token);
    res.json({ items: rows });
  } catch (e) {
    const code = e.message === 'MISSING_DEVICE_TOKEN' ? 400 : 500;
    res.status(code).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureTables();
    const token = getDeviceToken(req);
    const { city, lat, lon } = req.body || {};
    if (!city || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'city/lat/lon required' });
    }
    await addFavorite({ deviceToken: token, city, lat, lon });
    res.status(201).json({ ok: true });
  } catch (e) {
    const code = e.message === 'MISSING_DEVICE_TOKEN' ? 400 : 500;
    res.status(code).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureTables();
    const token = getDeviceToken(req);
    await removeFavorite(parseInt(req.params.id, 10), token);
    res.json({ ok: true });
  } catch (e) {
    const code = e.message === 'MISSING_DEVICE_TOKEN' ? 400 : 500;
    res.status(code).json({ error: e.message });
  }
});

module.exports = router;
