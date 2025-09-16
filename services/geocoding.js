// services/geocoding.js
const axios = require('axios');

// Open-Meteo 自带的地理编码 API
async function getCoords(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const { data } = await axios.get(url, { timeout: 5000 });

  if (!data.results || data.results.length === 0) {
    throw new Error(`找不到城市: ${city}`);
  }

  const result = data.results[0];
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: result.name,
    country: result.country
  };
}

module.exports = { getCoords };
