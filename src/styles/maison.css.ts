export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }

:root {
  --bg: #faf9f7;
  --bg2: #f2f0ec;
  --surface: #ffffff;
  --surface2: #f5f3ef;
  --border: rgba(0,0,0,0.08);
  --border2: rgba(0,0,0,0.14);
  --gold: #9e7c3c;
  --gold-light: #c8a96e;
  --gold-bg: rgba(158,124,60,0.08);
  --red: #c0392b;
  --red-bg: rgba(192,57,43,0.08);
  --amber: #d4820a;
  --amber-bg: rgba(212,130,10,0.08);
  --green: #27855a;
  --green-bg: rgba(39,133,90,0.08);
  --blue: #2872a8;
  --blue-bg: rgba(40,114,168,0.08);
  --muted: #999;
  --text: #1a1a1a;
  --text2: #666;
  --text3: #999;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Outfit', system-ui, sans-serif;
}

body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
input, select, textarea, button { font-family: var(--font-body); }
button { cursor: pointer; border: none; background: none; }
img { display: block; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
.fade-up { animation: fadeUp 0.3s ease both; }
.slide-up { animation: slideUp 0.25s ease both; }
.live-dot { animation: pulse 2s infinite; }

@media (min-width: 768px) {
  .modal-wide { max-width: 960px !important; overflow-y: hidden !important; display: flex !important; flex-direction: column !important; }
  .dress-detail-body { display: grid !important; grid-template-columns: 1fr 1fr; gap: 24px; flex: 1; min-height: 0; overflow: hidden; }
  .dress-detail-left { overflow-y: auto; padding-right: 20px; }
  .dress-detail-right { overflow-y: auto; border-left: 1px solid var(--border); padding-left: 20px; }
  .timeline-entries { max-height: none !important; flex: 1; }
}
`;
