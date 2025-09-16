// db/connection.js
const mysql = require('mysql2/promise'); // 使用 promise 版
require('dotenv').config();

// 创建连接池（比单一 connection 更稳定）
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_city',
  waitForConnections: true,
  connectionLimit: 10,   // 同时最大连接数
  queueLimit: 0          // 无限排队
});

// 测试连接
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    conn.release();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
  }
})();

module.exports = pool;
