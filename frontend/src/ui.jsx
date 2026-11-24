import React from "react";

const P = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  bot: "M12 3v3M6 8h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zM9 13h.01M15 13h.01M9 18v3M15 18v3",
  edit: "M4 20h4l10-10-4-4L4 16v4zM13 7l4 4",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12l7-7",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
  bars: "M5 20V10M12 20V4M19 20v-7",
  trend: "M3 17l6-6 4 4 8-9M15 6h6v6",
  cal: "M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4",
  cube: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5",
  box: "M4 8l8-4 8 4-8 4-8-4zM4 8v8l8 4 8-4V8",
  pct: "M19 5L5 19M7.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  db: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  help: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 114 1.9c-.9.6-1.5 1.1-1.5 2.1M12 17h.01",
  user: "M20 21a8 8 0 10-16 0M12 12a4 4 0 100-8 4 4 0 000 8z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  wallet: "M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-3M3 7h15a2 2 0 012 2v3h-4a2 2 0 100 4h4M20 12v4",
  coins: "M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  doc: "M7 3h8l5 5v13H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v6h6M9 13h8M9 17h8",
  down: "M12 4v12m0 0l-4-4m4 4l4-4M5 20h14",
  pie: "M12 3v9h9a9 9 0 11-9-9zM15 3.5A9 9 0 0120.5 9H15V3.5z",
  scale: "M12 3v18M5 21h14M5 7h14M5 7l-3 7a4 4 0 006 0L5 7zM19 7l-3 7a4 4 0 006 0l-3-7z",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 12l5 5 9-10",
  warn: "M12 3l10 18H2L12 3zM12 10v5M12 18h.01",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5h.01",
  arrow: "M15 6l-6 6 6 6",
};

export function Icon({name, size = 20, stroke = 1.7}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[name] || P.info}/></svg>;
}

export function Logo({small}) {
  return <div className={"brand" + (small ? " small" : "")}>
    <svg viewBox="0 0 64 64" width={small ? 34 : 52} height={small ? 34 : 52} aria-hidden="true">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2de2c0"/><stop offset="1" stopColor="#2f8cff"/></linearGradient></defs>
      <path d="M8 56L30 6h8l18 50h-10l-4-12H22l-5 12H8zm17-22h14l-7-20-7 20z" fill="url(#lg)"/>
      <path d="M4 44c14 6 34 4 56-14" stroke="#7df3e0" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
    <div><div className="brandName">ACCTIQ<sup>®</sup></div>
      <div className="brandEn">Accounting Intelligence</div>
      <div className="brandAr">ذكاء القرار المحاسبي</div></div>
  </div>;
}

export function Ring({value, label, sub, color = "#2de2c0", size = 112}) {
  const r = 44, c = 2 * Math.PI * r;
  return <div className="ring" style={{width: size}}>
    <svg viewBox="0 0 110 110" width={size} height={size} role="img" aria-label={`${label} ${value}%`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(120,170,230,.15)" strokeWidth="9"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 55 55)" style={{filter: `drop-shadow(0 0 5px ${color})`}}/>
      <text x="55" y={sub ? 53 : 60} textAnchor="middle" className="ringV">{value}%</text>
      {sub && <text x="55" y="70" textAnchor="middle" className="ringS">{sub}</text>}
    </svg>
    <div className="ringL">{label}</div>
  </div>;
}

export function Robot() {
  return <svg viewBox="0 0 120 130" width="118" height="128" aria-hidden="true">
    <defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3f8ff"/><stop offset="1" stopColor="#a9c4ee"/></linearGradient></defs>
    <circle cx="60" cy="14" r="5" fill="#2de2c0"/><path d="M60 19v12" stroke="#a9c4ee" strokeWidth="3"/>
    <rect x="14" y="52" width="10" height="26" rx="5" fill="#2f8cff"/><rect x="96" y="52" width="10" height="26" rx="5" fill="#2f8cff"/>
    <rect x="22" y="30" width="76" height="62" rx="26" fill="url(#rb)"/>
    <rect x="31" y="42" width="58" height="38" rx="17" fill="#0a1d3d"/>
    <circle cx="47" cy="61" r="7" fill="#22d3ee" style={{filter: "drop-shadow(0 0 6px #22d3ee)"}}/>
    <circle cx="73" cy="61" r="7" fill="#22d3ee" style={{filter: "drop-shadow(0 0 6px #22d3ee)"}}/>
    <path d="M32 98c0-8 12-12 28-12s28 4 28 12v22H32V98z" fill="url(#rb)"/>
    <circle cx="60" cy="106" r="9" fill="#0a1d3d"/><text x="60" y="110" textAnchor="middle" fontSize="11" fontWeight="800" fill="#22d3ee">A</text>
  </svg>;
}

export function HeroArt() {
  return <svg viewBox="0 0 360 200" className="heroArt" aria-hidden="true">
    <defs><linearGradient id="hp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d5fa8" stopOpacity=".55"/><stop offset="1" stopColor="#0b2a55" stopOpacity=".3"/></linearGradient></defs>
    <rect x="70" y="14" width="260" height="150" rx="14" fill="url(#hp)" stroke="#3aa0ff" strokeOpacity=".5" transform="skewY(-4)"/>
    {[0, 1, 2, 3, 4].map(i => <rect key={i} x={110 + i * 28} y={110 - i * 14 - 10} width="16" height={30 + i * 14} rx="3" fill="#35c4ff" fillOpacity=".8" transform="skewY(-4)"/>)}
    <g stroke="#cfe6ff" strokeWidth="3" strokeLinecap="round" fill="none" transform="translate(240 8)">
      <path d="M40 4v76M22 82h36M10 22h60"/><path d="M10 22l-12 28a14 14 0 0024 0L10 22zM70 22L58 50a14 14 0 0024 0L70 22z" fill="#cfe6ff" fillOpacity=".15"/></g>
    <rect x="20" y="140" width="110" height="46" rx="8" fill="#0b2a55" stroke="#3aa0ff" strokeOpacity=".6"/>
    <text x="75" y="170" textAnchor="middle" fill="#9fd0ff" fontSize="18" fontWeight="800">IFRS</text>
  </svg>;
}
