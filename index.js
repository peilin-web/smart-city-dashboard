// 1) 加载 .env（放最前）
require('dotenv').config();

// 2) 引入依赖
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 3) 引入子路由
const weatherRoutes = require('./routes/weather');
const favoritesRoutes = require('./routes/favorites');

// 4) 创建应用实例（必须在任何 app.use 之前）
const app = express();

// 5) 端口
const PORT = process.env.PORT || 3000;

// 6) 静态资源托管（放到 app 创建之后；只保留一次）
app.use(express.static(path.join(__dirname, 'public')));

// 7) 全局中间件
app.use(cors({
  origin: '*',
  methods: ['GET']
}));
app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 600
}));

// 8) 健康检查（从 '/' 改到 '/health'，避免挡住 index.html）
app.get('/health', (req, res) => {
  res.send('Smart City API is up. Try GET /api/weather?city=Hong%20Kong');
});

// 9) 业务路由
app.use('/api/weather', weatherRoutes);
app.use('/api/favorites', favoritesRoutes);

// 10) 兜底 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// 11) 统一错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', detail: err.message });
});

// 12) 启动
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
