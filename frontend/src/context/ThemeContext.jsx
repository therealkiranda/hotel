// ============================================================
// src/context/ThemeContext.jsx
// FIX #2: Live currency conversion (USD → any currency)
// FIX #3: Button/font colors update via JS-computed CSS vars
// ============================================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

export const COLOR_SCHEMES = {
  'dark-green':  { label: 'Forest & Gold',      primary: '#1a3c2e', secondary: '#c9a96e', accent: '#ffffff', background: '#f8f5f0', text: '#1a1a1a', preview: ['#1a3c2e','#c9a96e','#f8f5f0'] },
  'dark-blue':   { label: 'Navy & Champagne',   primary: '#1a2744', secondary: '#d4af6a', accent: '#ffffff', background: '#f5f7fa', text: '#1a1a1a', preview: ['#1a2744','#d4af6a','#f5f7fa'] },
  'charcoal':    { label: 'Charcoal & Ivory',   primary: '#2c2c2c', secondary: '#c8b89a', accent: '#ffffff', background: '#faf9f6', text: '#1a1a1a', preview: ['#2c2c2c','#c8b89a','#faf9f6'] },
  'burgundy':    { label: 'Burgundy & Gold',    primary: '#5c1a1a', secondary: '#c9a66b', accent: '#ffffff', background: '#fdf8f5', text: '#1a1a1a', preview: ['#5c1a1a','#c9a66b','#fdf8f5'] },
  'light-green': { label: 'Sage & Cream',       primary: '#4a7c59', secondary: '#8b6914', accent: '#ffffff', background: '#f0f5f1', text: '#1a1a1a', preview: ['#4a7c59','#8b6914','#f0f5f1'] },
  'midnight':    { label: 'Midnight & Rose',    primary: '#0f0f1a', secondary: '#d4a0a0', accent: '#ffffff', background: '#f5f3f8', text: '#1a1a1a', preview: ['#0f0f1a','#d4a0a0','#f5f3f8'] },
  'ocean':       { label: 'Ocean & Coral',      primary: '#1a4a6e', secondary: '#e07b54', accent: '#ffffff', background: '#f3f8fc', text: '#1a1a1a', preview: ['#1a4a6e','#e07b54','#f3f8fc'] },
  'terracotta':  { label: 'Terracotta & Cream', primary: '#8b3a2a', secondary: '#c9a66b', accent: '#ffffff', background: '#fdf6f0', text: '#1a1a1a', preview: ['#8b3a2a','#c9a66b','#fdf6f0'] },
  'slate':       { label: 'Slate & Amber',      primary: '#334155', secondary: '#d97706', accent: '#ffffff', background: '#f8fafc', text: '#1a1a1a', preview: ['#334155','#d97706','#f8fafc'] },
  'noir':        { label: 'Noir & Gold',        primary: '#111111', secondary: '#b8972e', accent: '#ffffff', background: '#f5f5f5', text: '#111111', preview: ['#111111','#b8972e','#f5f5f5'] },
};

export const FONT_OPTIONS = {
  heading: [
    { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
    { value: 'Playfair Display',   label: 'Playfair Display' },
    { value: 'Libre Baskerville',  label: 'Libre Baskerville' },
    { value: 'Cinzel',             label: 'Cinzel' },
    { value: 'DM Serif Display',   label: 'DM Serif Display' },
    { value: 'Fraunces',           label: 'Fraunces' },
    { value: 'Yeseva One',         label: 'Yeseva One' },
    { value: 'Tenor Sans',         label: 'Tenor Sans' },
  ],
  body: [
    { value: 'Jost',          label: 'Jost' },
    { value: 'Raleway',       label: 'Raleway' },
    { value: 'Lato',          label: 'Lato' },
    { value: 'Nunito Sans',   label: 'Nunito Sans' },
    { value: 'Source Sans 3', label: 'Source Sans 3' },
    { value: 'Karla',         label: 'Karla' },
    { value: 'Mulish',        label: 'Mulish' },
  ],
};

const DEFAULT_THEME = {
  color_scheme: 'dark-green', primary_color: '#1a3c2e', secondary_color: '#c9a96e',
  accent_color: '#ffffff', background_color: '#f8f5f0', text_color: '#1a1a1a',
  font_heading: 'Cormorant Garamond', font_body: 'Jost', font_accent: 'Playfair Display',
  animation_speed: 'normal', animations_enabled: true, hero_type: 'animated', hero_video_url: null,
};

const ThemeContext = createContext(null);

function hexToRgb(hex) {
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function mixHex(hex, target, amount) {
  const [r1,g1,b1] = hexToRgb(hex); const [r2,g2,b2] = hexToRgb(target);
  return `rgb(${Math.round(r1+(r2-r1)*amount)},${Math.round(g1+(g2-g1)*amount)},${Math.round(b1+(b2-b1)*amount)})`;
}
function hexToRgba(hex, alpha) { const [r,g,b] = hexToRgb(hex); return `rgba(${r},${g},${b},${alpha})`; }

function applyThemeToDom(theme) {
  const root = document.documentElement;
  const p = theme.primary_color || '#1a3c2e';
  const s = theme.secondary_color || '#c9a96e';
  root.style.setProperty('--color-primary',         p);
  root.style.setProperty('--color-secondary',       s);
  root.style.setProperty('--color-accent',          theme.accent_color     || '#ffffff');
  root.style.setProperty('--color-background',      theme.background_color || '#f8f5f0');
  root.style.setProperty('--color-text',            theme.text_color       || '#1a1a1a');
  root.style.setProperty('--color-primary-dark',    mixHex(p, '#000000', 0.18));
  root.style.setProperty('--color-primary-light',   mixHex(p, '#ffffff', 0.88));
  root.style.setProperty('--color-secondary-light', mixHex(s, '#ffffff', 0.82));
  root.style.setProperty('--color-secondary-dark',  mixHex(s, '#000000', 0.18));
  root.style.setProperty('--color-surface',         '#ffffff');
  root.style.setProperty('--color-muted',           '#6b7280');
  root.style.setProperty('--color-border',          'rgba(0,0,0,0.08)');
  root.style.setProperty('--color-focus-ring',      hexToRgba(p, 0.18));
  root.style.setProperty('--font-heading', `'${theme.font_heading || 'Cormorant Garamond'}', serif`);
  root.style.setProperty('--font-body',    `'${theme.font_body    || 'Jost'}', sans-serif`);
  root.style.setProperty('--font-accent',  `'${theme.font_accent  || 'Playfair Display'}', serif`);
  const speeds = { slow:'0.8s', normal:'0.4s', fast:'0.2s' };
  root.style.setProperty('--transition-speed', speeds[theme.animation_speed] || '0.4s');
  const fonts = [...new Set([theme.font_heading, theme.font_body, theme.font_accent].filter(Boolean))];
  const el = document.getElementById('dynamic-google-fonts');
  if (el) el.remove();
  const link = document.createElement('link');
  link.id = 'dynamic-google-fonts'; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${fonts.map(f=>`family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`).join('&')}&display=swap`;
  document.head.appendChild(link);
  const ec = document.getElementById('custom-theme-css');
  if (ec) ec.remove();
  if (theme.custom_css) {
    const style = document.createElement('style');
    style.id = 'custom-theme-css'; style.textContent = theme.custom_css;
    document.head.appendChild(style);
  }
}

// Rate cache — 1 hour TTL
const rateCache = { rates: {}, ts: 0 };
async function getExchangeRate(currency) {
  if (!currency || currency === 'USD') return 1;
  if (rateCache.rates[currency] && Date.now() - rateCache.ts < 3600000) return rateCache.rates[currency];
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const d = await r.json();
    if (d.rates) { rateCache.rates = d.rates; rateCache.ts = Date.now(); return d.rates[currency] || 1; }
  } catch {}
  return 1;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme]           = useState(DEFAULT_THEME);
  const [hotel, setHotel]           = useState({ default_currency:'USD', currency_symbol:'$', cash_payment_enabled:1, qr_payment_enabled:0, online_payment_enabled:0 });
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/public/settings')
      .then(({ data }) => {
        const merged = { ...DEFAULT_THEME, ...(data.theme || {}) };
        setTheme(merged);
        if (data.hotel) {
          setHotel(data.hotel);
          const currency = data.hotel.default_currency || 'USD';
          if (currency !== 'USD') getExchangeRate(currency).then(setExchangeRate);
        }
        applyThemeToDom(merged);
      })
      .catch(() => applyThemeToDom(DEFAULT_THEME))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { applyThemeToDom(theme); }, [theme]);

  const updateTheme = (updates) => {
    setTheme(prev => { const next = { ...prev, ...updates }; applyThemeToDom(next); return next; });
  };

  const applyColorScheme = (key) => {
    const s = COLOR_SCHEMES[key]; if (!s) return;
    updateTheme({ color_scheme:key, primary_color:s.primary, secondary_color:s.secondary, accent_color:s.accent, background_color:s.background, text_color:s.text });
  };

  const formatPrice = useCallback((amountUSD) => {
    const converted = (parseFloat(amountUSD) || 0) * exchangeRate;
    const currency = hotel.default_currency || 'USD';
    const symbol   = hotel.currency_symbol  || '$';
    try {
      return new Intl.NumberFormat('en-US', { style:'currency', currency, maximumFractionDigits: 0 }).format(converted);
    } catch {
      return `${symbol}${Math.round(converted).toLocaleString()}`;
    }
  }, [exchangeRate, hotel.currency_symbol, hotel.default_currency]);

  return (
    <ThemeContext.Provider value={{ theme, hotel, loading, updateTheme, applyColorScheme, formatPrice, exchangeRate }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
