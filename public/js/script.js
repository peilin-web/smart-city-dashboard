// 生产环境（Render）和本地 3000 端口都能工作
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? (location.port === '3000' ? '/api/weather' : 'http://localhost:3000/api/weather')
  : '/api/weather';


const qs = sel => document.querySelector(sel);
const el = {
  curTemp: qs('#curTemp'),
  curCond: qs('#curCond'),
  curCity: qs('#curCity'),
  curTime: qs('#curTime'),
  curFeels: qs('#curFeels'),
  curHum: qs('#curHum'),
  curWind: qs('#curWind'),
  daysWrap: qs('#daysWrap'),
  cityInput: qs('#cityInput'),
  btnHK: qs('#useHK'),
  btnRefresh: qs('#refreshBtn'),
  hourlyCanvas: qs('#hourlyChart')
};

let chart; // Chart.js 实例

function fmtTime(iso){
  try{
    return new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', month:'short', day:'2-digit' });
  }catch{ return iso; }
}
function dow(iso){
  try{ return new Date(iso).toLocaleDateString([], { weekday: 'short' }); }
  catch{ return '--'; }
}

// 简单图标映射
function iconByText(t){
  t = (t||'').toLowerCase();
  if(t.includes('clear')) return '☀️';
  if(t.includes('cloud')) return '⛅';
  if(t.includes('overcast')) return '☁️';
  if(t.includes('rain')) return '🌧️';
  if(t.includes('fog')) return '🌫️';
  if(t.includes('snow')) return '❄️';
  return '🌡️';
}

async function fetchWeather(city){
  const url = `${API_BASE}?city=${encodeURIComponent(city || 'Hong Kong')}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('API Error');
  return await res.json();
}

function renderCurrent(cur){
  el.curTemp.textContent = `${Math.round(cur.temperature)}°`;
  el.curCond.textContent = cur.conditionText || '—';
  el.curCity.textContent = cur.city || '—';
  el.curTime.textContent = fmtTime(cur.time);
  el.curFeels.textContent = `${Math.round(cur.feelsLike)}°`;
  el.curHum.textContent = `${Math.round(cur.humidity)}%`;
  el.curWind.textContent = `${cur.windSpeed}`;
}

function renderDaily(days){
  el.daysWrap.innerHTML = '';
  days.slice(0,7).forEach(d=>{
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <div class="dow">${dow(d.date)}</div>
      <div class="cond">${iconByText(d.conditionText)} ${d.conditionText}</div>
      <div class="minmax">${Math.round(d.min)}° / ${Math.round(d.max)}°</div>
      <div class="badge" title="Precipitation sum">
        💧 <span>${(d.precipitationSum ?? 0).toFixed(1)} mm</span>
      </div>
    `;
    el.daysWrap.appendChild(card);
  });
}

function renderHourly(hourly){
  const labels = hourly.slice(0,24).map(h => new Date(h.time).toLocaleTimeString([], { hour: '2-digit' }));
  const temps  = hourly.slice(0,24).map(h => h.temp);
  const rain   = hourly.slice(0,24).map(h => h.precipitation);

  if(chart) chart.destroy();

  const ctx = el.hourlyCanvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 140);
  grad.addColorStop(0, 'rgba(124,58,237,0.85)');
  grad.addColorStop(1, 'rgba(6,182,212,0.35)');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temp °C',
          data: temps,
          borderColor: grad,
          backgroundColor: 'rgba(124,58,237,0.15)',
          borderWidth: 3,
          tension: .35,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Precip mm',
          data: rain,
          backgroundColor: 'rgba(6,182,212,0.35)',
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#cbd5e1' } },
        tooltip: { mode:'index', intersect:false }
      },
      scales: {
        x: { ticks: { color: '#9ca3af' }, grid: { color:'rgba(255,255,255,0.06)' } },
        y: {
          position:'left',
          ticks: { color:'#9ca3af' },
          grid: { color:'rgba(255,255,255,0.06)' }
        },
        y1: {
          position:'right',
          beginAtZero:true,
          ticks: { color:'#9ca3af' },
          grid: { drawOnChartArea:false }
        }
      }
    }
  });
}

async function load(city){
  try{
    const data = await fetchWeather(city);
    renderCurrent(data.current);
    renderHourly(data.hourly || []);
    renderDaily(data.daily || []);
  }catch(e){
    alert('Failed to load weather. Please try again.');
    console.error(e);
  }
}

function bind(){
  el.btnHK.addEventListener('click', ()=> load('Hong Kong'));
  el.btnRefresh.addEventListener('click', ()=>{
    const c = el.cityInput.value.trim() || 'Hong Kong';
    load(c);   // ✅ 输入啥城市就传啥
  });
  el.cityInput.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){
      load(el.cityInput.value.trim() || 'Hong Kong'); // ✅ 回车也支持输入的城市
    }
  });
}

bind();
load('Hong Kong');
