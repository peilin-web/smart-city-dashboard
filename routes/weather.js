const express = require('express');
const router = express.Router();
const { fetchFromOpenMeteo } = require('../services/openMeteo');
const { getCoords } = require('../services/geocoding'); // 新增：城市名转经纬度

// 健康检查
router.get('/test', (req, res) => {
  res.json({ message: '天气 API 正常运行 ✅' });
});

// 当前 + 小时级 + 日级预测
router.get('/', async (req, res, next) => {
  try {
    // 1) 判断是否传了 city
    const city = req.query.city;

    let lat, lon, name, country;

    if (city) {
      // 用户传了 city → 调用地理编码 API
      const coords = await getCoords(city);
      lat = coords.lat;
      lon = coords.lon;
      name = coords.name;
      country = coords.country;
    } else {
      // 没传 → 用默认的香港
      lat = parseFloat(process.env.DEFAULT_LAT);
      lon = parseFloat(process.env.DEFAULT_LON);
      name = 'Hong Kong';
      country = 'China';
    }

    // 2) 调用天气 API
    const timezone = process.env.TIMEZONE || 'auto';
    const data = await fetchFromOpenMeteo({ lat, lon, timezone });

    // 3) 加上地理信息
    data.current.city = `${name}, ${country}`;

    res.json(data);
  } catch (err) {
    console.error('Weather error:', err.message);
    next(err);
  }
});

module.exports = router;
