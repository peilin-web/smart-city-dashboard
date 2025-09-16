// services/openMeteo.js
const axios = require('axios');
const NodeCache = require('node-cache');

// NodeCache 基础配置
const cache = new NodeCache({ stdTTL: 900, checkperiod: 320 }); // 硬过期最长 15 分钟

// ---- 缓存增强：stale-while-revalidate ----
const SOFT_TTL_MS = 5 * 60 * 1000;   // 软过期 5分钟
const HARD_TTL_MS = 15 * 60 * 1000;  // 硬过期 15分钟

function setEnhanced(key, data) {
  cache.set(key, { data, ts: Date.now() }, HARD_TTL_MS / 1000);
}

function getEnhanced(key) {
  const v = cache.get(key);
  return v || null; // { data, ts } 或 null
}

// ---- 天气代码 → 可读文本 ----
const WEATHER_MAP = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  80: 'Rain showers',
};

// ---- 构建 URL ----
function buildUrl({ lat, lon, timezone }) {
  const base = 'https://api.open-meteo.com/v1/forecast';
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    hourly:
      'temperature_2m,relative_humidity_2m,precipitation,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: timezone || 'auto',
  });
  return `${base}?${params.toString()}`;
}

// ---- DTO 转换 ----
function toCurrentDTO(json) {
  const c = json.current;
  return {
    city: 'Hong Kong',
    temperature: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    conditionCode: c.weather_code,
    conditionText: WEATHER_MAP[c.weather_code] || 'Unknown',
    isDay: Boolean(c.is_day),
    time: c.time,
  };
}

function toHourlyDTO(json, hours = 24) {
  const h = json.hourly;
  const out = [];
  const len = Math.min(h.time.length, hours);
  for (let i = 0; i < len; i++) {
    out.push({
      time: h.time[i],
      temp: h.temperature_2m[i],
      humidity: h.relative_humidity_2m[i],
      precipitation: h.precipitation[i],
      conditionCode: h.weather_code[i],
      conditionText: WEATHER_MAP[h.weather_code[i]] || 'Unknown',
    });
  }
  return out;
}

function toDailyDTO(json) {
  const d = json.daily;
  const days = [];
  for (let i = 0; i < d.time.length; i++) {
    days.push({
      date: d.time[i],
      min: d.temperature_2m_min[i],
      max: d.temperature_2m_max[i],
      precipitationSum: d.precipitation_sum[i],
      conditionCode: d.weather_code[i],
      conditionText: WEATHER_MAP[d.weather_code[i]] || 'Unknown',
    });
  }
  return days;
}

// ---- 请求上游 API & 转换 ----
async function requestOpenMeteo(url) {
  const { data } = await axios.get(url, { timeout: 8000 });
  return {
    source: 'open-meteo',
    current: toCurrentDTO(data),
    hourly: toHourlyDTO(data, 24),
    daily: toDailyDTO(data),
  };
}

// ---- 对外统一函数：带 stale-while-revalidate ----
async function fetchFromOpenMeteo({ lat, lon, timezone, refresh = false }) {
  const url = buildUrl({ lat, lon, timezone });
  const key = url;

  if (!refresh) {
    const hit = getEnhanced(key);
    if (hit) {
      // 命中缓存 → 判断软过期
      if (Date.now() - hit.ts < SOFT_TTL_MS) {
        return hit.data;
      }
      // 已过软 TTL，尝试刷新
      try {
        const fresh = await requestOpenMeteo(url);
        setEnhanced(key, fresh);
        return fresh;
      } catch (e) {
        // 刷新失败 → 回退旧值
        return hit.data;
      }
    }
  }

  // 没缓存 → 请求新数据
  const fresh = await requestOpenMeteo(url);
  setEnhanced(key, fresh);
  return fresh;
}

module.exports = { fetchFromOpenMeteo };
