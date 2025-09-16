// models/favorites.js
const { getPool } = require('../db/connection');

async function ensureTables() {
  const pool = await getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INT PRIMARY KEY AUTO_INCREMENT,
      device_token VARCHAR(64) NOT NULL,
      city VARCHAR(100) NOT NULL,
      lat DOUBLE NOT NULL,
      lon DOUBLE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_device_city (device_token, city)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function listFavorites(deviceToken) {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id, city, lat, lon, created_at FROM favorites WHERE device_token = ? ORDER BY created_at DESC',
    [deviceToken]
  );
  return rows;
}

async function addFavorite({ deviceToken, city, lat, lon }) {
  const pool = await getPool();
  await pool.query(
    'INSERT INTO favorites (device_token, city, lat, lon) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE lat=VALUES(lat), lon=VALUES(lon)',
    [deviceToken, city, lat, lon]
  );
}

async function removeFavorite(id, deviceToken) {
  const pool = await getPool();
  await pool.query('DELETE FROM favorites WHERE id = ? AND device_token = ?', [id, deviceToken]);
}

module.exports = { ensureTables, listFavorites, addFavorite, removeFavorite };
