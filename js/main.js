'use strict';

const COIN_IDS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'ripple',
  'the-open-network',
];

const API_URL =
  `https://api.coingecko.com/api/v3/coins/markets` +
  `?vs_currency=usd` +
  `&ids=${COIN_IDS.join(',')}` +
  `&order=market_cap_desc` +
  `&sparkline=false` +
  `&price_change_percentage=24h`;

/* ---- Formatters ---- */

function formatPrice(price) {
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1000)  return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (price >= 1)     return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function formatCap(cap) {
  if (!cap) return '—';
  if (cap >= 1e12) return '$' + (cap / 1e12).toFixed(2) + 'T';
  if (cap >= 1e9)  return '$' + (cap / 1e9).toFixed(1) + 'B';
  if (cap >= 1e6)  return '$' + (cap / 1e6).toFixed(0) + 'M';
  return '$' + cap.toLocaleString('en-US');
}

/* ---- Renderers ---- */

function renderCoins(data) {
  const grid = document.getElementById('coinsGrid');

  grid.innerHTML = data.map(coin => {
    const change = coin.price_change_percentage_24h ?? 0;
    const up = change >= 0;
    return `
      <div class="coin-card">
        <div class="coin-header">
          <img class="coin-logo" src="${coin.image}" alt="${coin.name}" width="44" height="44" loading="lazy" />
          <div>
            <div class="coin-name">${coin.name}</div>
            <div class="coin-symbol">${coin.symbol}</div>
          </div>
          <div class="coin-rank">#${coin.market_cap_rank}</div>
        </div>
        <div class="coin-price">${formatPrice(coin.current_price)}</div>
        <div class="coin-footer">
          <div class="coin-change ${up ? 'up' : 'down'}">
            ${up ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
          </div>
          <div class="coin-cap">Cap: ${formatCap(coin.market_cap)}</div>
        </div>
      </div>`;
  }).join('');
}

function renderTicker(data) {
  const track = document.getElementById('tickerTrack');

  const items = data.map(coin => {
    const change = coin.price_change_percentage_24h ?? 0;
    const up = change >= 0;
    const sign = up ? '+' : '';
    return `
      <span class="ticker-item">
        <span class="ticker-name">${coin.symbol.toUpperCase()}</span>
        <span class="ticker-price">${formatPrice(coin.current_price)}</span>
        <span class="ticker-change ${up ? 'up' : 'down'}">${sign}${change.toFixed(2)}%</span>
      </span>`;
  }).join('');

  // Duplicate for seamless infinite scroll
  track.innerHTML = items + items;
}

function renderError() {
  const grid = document.getElementById('coinsGrid');
  grid.innerHTML = `
    <div class="error-state">
      Не удалось загрузить курсы.
      <button class="error-retry" onclick="fetchPrices()">Попробовать снова →</button>
    </div>`;
}

function updateTimestamp() {
  const el = document.getElementById('updateTime');
  const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  el.textContent = `Обновлено: ${time}`;
}

/* ---- Data fetch ---- */

async function fetchPrices() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderCoins(data);
    renderTicker(data);
    updateTimestamp();
  } catch (err) {
    console.error('[MyCrypto] Ошибка загрузки:', err.message);
    renderError();
  }
}

/* ---- Burger menu ---- */

(function initBurger() {
  const burger = document.getElementById('burger');
  const nav    = document.getElementById('mobileNav');

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ---- Smooth anchor offset (sticky header + ticker) ---- */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ---- Init ---- */

fetchPrices();
setInterval(fetchPrices, 60_000);
