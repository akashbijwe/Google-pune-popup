// Coffee personality quiz: 3 taps -> one of 8 drinks from our menu (ids match data/menu.json).
export const QUESTIONS = [
  { q: 'Rainy day or sunny day?', key: 'w', a: { v: 'rain', emoji: '🌧️', label: 'Rainy day' }, b: { v: 'sun', emoji: '☀️', label: 'Sunny day' } },
  { q: 'Sweet or bitter?', key: 't', a: { v: 'sweet', emoji: '🍯', label: 'Sweet' }, b: { v: 'bitter', emoji: '🖤', label: 'Bitter' } },
  { q: 'Work or chill?', key: 'm', a: { v: 'work', emoji: '💻', label: 'Work mode' }, b: { v: 'chill', emoji: '🛋️', label: 'Chill mode' } },
];

export const RESULTS = {
  'rain-sweet-work':  { id: 'i4',  drink: 'Café Latte',     emoji: '🥛', persona: 'The Cozy Achiever',      line: 'Smooth, warm and quietly productive.' },
  'rain-sweet-chill': { id: 'i7',  drink: 'Hot Chocolate',  emoji: '🍫', persona: 'The Comfort Seeker',     line: 'Rain on the window, chocolate in the cup.' },
  'rain-bitter-work': { id: 'i5',  drink: 'Flat White',     emoji: '☕', persona: 'The Focused Minimalist', line: 'No fuss, all flavour, deadline ready.' },
  'rain-bitter-chill':{ id: 'i2',  drink: 'Americano',      emoji: '☕', persona: 'The Quiet Observer',     line: 'Dark, deep and perfectly content.' },
  'sun-sweet-work':   { id: 'i9',  drink: 'Iced Latte',     emoji: '🧊', persona: 'The Bright Hustler',     line: 'Cool, creamy and always on the move.' },
  'sun-sweet-chill':  { id: 'i12', drink: 'Caramel Frappe', emoji: '🍨', persona: 'The Sunny Dreamer',      line: 'Life is short. Make it a little sweeter.' },
  'sun-bitter-work':  { id: 'i10', drink: 'Cold Brew',      emoji: '🥤', persona: 'The Smooth Operator',    line: 'Steeped slow, delivers strong.' },
  'sun-bitter-chill': { id: 'i11', drink: 'Iced Americano', emoji: '🧊', persona: 'The Cool Customer',      line: 'Crisp, clean and effortlessly chill.' },
};

export const resultFor = (answers) => RESULTS[answers.join('-')];

// Draw the shareable card to a PNG (1080x1350).
export async function makeCardBlob(r) {
  try { await document.fonts.load('700 80px "DM Sans"'); await document.fonts.load('500 40px "DM Sans"'); } catch {}
  const W = 1080, H = 1350;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2E1F17'); g.addColorStop(1, '#6b4430');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(181,112,58,.35)'; x.beginPath(); x.arc(W - 120, 160, 360, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(201,162,126,.18)'; x.beginPath(); x.arc(80, H - 80, 320, 0, Math.PI * 2); x.fill();
  x.textAlign = 'center'; x.fillStyle = '#C9A27E';
  x.font = '700 38px "DM Sans", sans-serif';
  x.fillText('T H I R D   W A V E   C O F F E E', W / 2, 130);
  x.fillStyle = '#FFFaf2'; x.font = '500 46px "DM Sans", sans-serif';
  x.fillText("YOU'RE A", W / 2, 360);
  x.font = '260px serif'; x.fillText(r.emoji, W / 2, 640);
  x.fillStyle = '#FFFaf2'; x.font = '800 118px "DM Sans", sans-serif';
  const words = r.drink.split(' '); const lines = words.length > 1 && x.measureText(r.drink).width > W - 160 ? [words[0], words.slice(1).join(' ')] : [r.drink];
  lines.forEach((l, i) => x.fillText(l, W / 2, 800 + i * 125));
  const y0 = 800 + lines.length * 125;
  x.fillStyle = '#E8B27D'; x.font = '700 54px "DM Sans", sans-serif'; x.fillText(r.persona, W / 2, y0 + 30);
  x.fillStyle = 'rgba(255,250,242,.85)'; x.font = '500 42px "DM Sans", sans-serif'; x.fillText(r.line, W / 2, y0 + 105);
  x.fillStyle = '#C9A27E'; x.font = '500 34px "DM Sans", sans-serif';
  x.fillText('Balewadi Highstreet, Pune  ·  Just brew it.', W / 2, H - 80);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
