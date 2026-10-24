const api = typeof browser !== "undefined" ? browser : chrome;

const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const searchEl = document.getElementById('search');
const modal = document.getElementById('modal');
const toastEl = document.getElementById('toast');
const modalAvatar = document.getElementById('modalAvatar');

let accounts = [];
let tickHandle = null;
let currentImageBase64 = null;

const uid = () => Math.random().toString(36).slice(2, 10);
const hex = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

const POPULAR_BRANDS = {
  'google': 'google', 'github': 'github', 'gitlab': 'gitlab', 'microsoft': 'microsoft', 
  'apple': 'apple', 'amazon': 'amazon', 'aws': 'amazonaws', 'cloudflare': 'cloudflare',
  'digitalocean': 'digitalocean', 'heroku': 'heroku', 'vercel': 'vercel', 'netlify': 'netlify',
  'mongodb': 'mongodb', 'docker': 'docker', 'npm': 'npm', 'yarn': 'yarn', 'python': 'python',
  'meta': 'meta', 'facebook': 'facebook', 'instagram': 'instagram', 'whatsapp': 'whatsapp',
  'discord': 'discord', 'twitter': 'twitter', 'x': 'x', 'reddit': 'reddit', 'linkedin': 'linkedin',
  'telegram': 'telegram', 'signal': 'signal', 'slack': 'slack', 'zoom': 'zoom', 
  'skype': 'skype', 'teams': 'microsoftteams', 'snapchat': 'snapchat', 'tiktok': 'tiktok',
  'pinterest': 'pinterest', 'tumblr': 'tumblr', 'viber': 'viber', 'line': 'line',
  'steam': 'steam', 'epic games': 'epicgames', 'riot games': 'riotgames', 'battle.net': 'battledotnet',
  'playstation': 'playstation', 'xbox': 'xbox', 'nintendo': 'nintendo', 'twitch': 'twitch',
  'roblox': 'roblox', 'minecraft': 'minecraft', 'ea': 'ea', 'ubisoft': 'ubisoft',
  'coinbase': 'coinbase', 'binance': 'binance', 'kraken': 'kraken', 'crypto.com': 'cryptodotcom',
  'kucoin': 'kucoin', 'gemini': 'gemini', 'bitfinex': 'bitfinex', 'bitstamp': 'bitstamp',
  'paypal': 'paypal', 'stripe': 'stripe', 'venmo': 'venmo', 'cash app': 'cashapp',
  'wise': 'wise', 'revolut': 'revolut', 'chase': 'chase', 'bank of america': 'bankofamerica',
  'wells fargo': 'wellsfargo', 'capital one': 'capitalone', 'amex': 'americanexpress',
  'netflix': 'netflix', 'spotify': 'spotify', 'hulu': 'hulu', 'disney+': 'disneyplus',
  'hbo max': 'hbo', 'max': 'hbo', 'prime video': 'primevideo', 'youtube': 'youtube',
  'soundcloud': 'soundcloud', 'pandora': 'pandora', 'deezer': 'deezer', 'tidal': 'tidal',
  'crunchyroll': 'crunchyroll', 'paramount+': 'paramountplus', 'peacock': 'peacock',
  'dropbox': 'dropbox', 'box': 'box', 'notion': 'notion', 'evernote': 'evernote',
  'trello': 'trello', 'asana': 'asana', 'jira': 'jira', 'confluence': 'confluence',
  'monday': 'mondaydotcom', 'clickup': 'clickup', 'airtable': 'airtable', 'figma': 'figma',
  'canva': 'canva', 'adobe': 'adobe', 'autodesk': 'autodesk',
  'ebay': 'ebay', 'etsy': 'etsy', 'shopify': 'shopify', 'walmart': 'walmart', 
  'target': 'target', 'best buy': 'bestbuy', 'aliexpress': 'aliexpress', 'alibaba': 'alibaba',
  'uber': 'uber', 'lyft': 'lyft', 'doordash': 'doordash', 'instacart': 'instacart',
  'airbnb': 'airbnb', 'booking.com': 'bookingdotcom', 'expedia': 'expedia',
  'coursera': 'coursera', 'udemy': 'udemy', 'duolingo': 'duolingo', 'khan academy': 'khanacademy',
  'protonmail': 'protonmail', 'yahoo': 'yahoo', 'aol': 'aol', 'gmail': 'gmail',
  'icloud': 'icloud', 'outlook': 'microsoftoutlook', 'zoho': 'zoho', 'godaddy': 'godaddy',
  'namecheap': 'namecheap', 'porkbun': 'porkbun'
};

function toast(msg, ms = 1800) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
}

async function load() {
  const { accounts: a } = await api.storage.local.get('accounts');
  accounts = a || [];
}

async function save() {
  await api.storage.local.set({ accounts });
}

function getAvatarHTML(acc) {
  if (acc.customImage) {
    return `<div class="avatar"><img src="${acc.customImage}" alt=""></div>`;
  }
  const issuer = (acc.issuer || '').toLowerCase().trim();
  const slug = POPULAR_BRANDS[issuer] || (issuer === 'x' ? 'x' : null);
  if (slug) {
    const url = `https://cdn.simpleicons.org/${slug}`;
    return `<div class="avatar"><img src="${url}" alt=""></div>`;
  }
  const letter = (acc.issuer || '?').charAt(0).toUpperCase();
  return `<div class="avatar">${letter}</div>`;
}

function totp(secret, period = 30, digits = 6) {
  try {
    const t = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret.replace(/\s+/g, '').toUpperCase()),
      digits, period,
    });
    return t.generate();
  } catch (e) { return '------'; }
}

function remaining(period = 30) {
  return period - (Math.floor(Date.now() / 1000) % period);
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const filtered = accounts.filter(a =>
    !q || (a.issuer + ' ' + a.account).toLowerCase().includes(q)
  );

  listEl.innerHTML = filtered.map(a => `
    <div class="card" data-id="${a.id}">
      <div class="card-left">
        ${getAvatarHTML(a)}
        <div class="card-info">
          <div class="card-issuer">${hex(a.issuer || 'Unknown')}</div>
          <div class="card-account">${hex(a.account || '')}</div>
        </div>
      </div>
      <div class="card-right">
        <div class="code" data-code="${a.id}">------</div>
        <div class="ring" data-ring="${a.id}">
          <svg width="26" height="26">
            <circle class="bg" cx="13" cy="13" r="10.5"/>
            <circle class="fg" cx="13" cy="13" r="10.5" stroke-dasharray="65.97" stroke-dashoffset="0"/>
          </svg>
        </div>
      </div>
      <button class="delete-btn" data-del="${a.id}" title="Remove">×</button>
    </div>
  `).join('');

  emptyEl.classList.toggle('hidden', filtered.length !== 0);

  listEl.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.delete-btn')) return;
      const id = card.dataset.id;
      const acc = accounts.find(a => a.id === id);
      const code = totp(acc.secret);
      try { await navigator.clipboard.writeText(code); } catch {}
      const el = card.querySelector('.code');
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 180);
      toast('Copied');
    });
  });

  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.del;
      const card = btn.closest('.card');
      card.classList.add('removing');
      setTimeout(async () => {
        accounts = accounts.filter(a => a.id !== id);
        await save();
        render();
      }, 220);
    });
  });

  tick();
}

function tick() {
  if (tickHandle) return;
  const update = () => {
    const rem = remaining(30);
    const frac = rem / 30;
    document.querySelectorAll('.code[data-code]').forEach(el => {
      const id = el.dataset.code;
      const acc = accounts.find(a => a.id === id);
      if (acc) el.textContent = totp(acc.secret).replace(/(\d{3})(\d{3})/, '$1 $2');
    });
    document.querySelectorAll('.ring[data-ring]').forEach(r => {
      const fg = r.querySelector('.fg');
      const circumference = 65.97;
      fg.style.strokeDashoffset = String(circumference * (1 - frac));
      r.classList.toggle('warn', rem <= 5);
    });
  };
  update();
  tickHandle = setInterval(update, 500);
}

async function startScan() {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return toast('No active tab');

    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scanner.js']
    });
    window.close();
  } catch (e) {
    console.error(e);
    toast('Cannot scan this page');
  }
}

api.runtime.onMessage.addListener(async (msg) => {
  if (msg && msg.type === 'ADD_ACCOUNT') {
    await load();
    accounts.push({ id: uid(), ...msg.data });
    await save();
    render();
    toast('Account added');
  }
});

function openModal() {
  document.getElementById('inIssuer').value = '';
  document.getElementById('inAccount').value = '';
  document.getElementById('inSecret').value = '';
  currentImageBase64 = null;
  updateModalAvatar();
  modal.classList.add('open');
  setTimeout(() => document.getElementById('inIssuer').focus(), 120);
}
function closeModal() { modal.classList.remove('open'); }

function updateModalAvatar() {
  if (currentImageBase64) {
    modalAvatar.innerHTML = `<img src="${currentImageBase64}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  } else {
    const issuer = document.getElementById('inIssuer').value.toLowerCase().trim();
    const slug = POPULAR_BRANDS[issuer] || (issuer === 'x' ? 'x' : null);
    if (slug) {
      modalAvatar.innerHTML = `<img src="https://cdn.simpleicons.org/${slug}" alt="">`;
    } else {
      const letter = (issuer || '?').charAt(0).toUpperCase();
      modalAvatar.textContent = letter;
    }
  }
}

document.getElementById('inIssuer').addEventListener('input', updateModalAvatar);

document.getElementById('inImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentImageBase64 = ev.target.result;
    updateModalAvatar();
  };
  reader.readAsDataURL(file);
});

async function addManual() {
  const issuer = document.getElementById('inIssuer').value.trim();
  const account = document.getElementById('inAccount').value.trim();
  const secret = document.getElementById('inSecret').value.trim().replace(/\s+/g, '');
  if (!secret) return toast('Secret required');
  try {
    OTPAuth.Secret.fromBase32(secret.toUpperCase());
  } catch { return toast('Invalid Base32 secret'); }
  
  accounts.push({ 
    id: uid(), 
    issuer, 
    account, 
    secret, 
    customImage: currentImageBase64 
  });
  
  await save();
  render();
  closeModal();
  toast('Added');
}

document.getElementById('scanBtn').addEventListener('click', startScan);
document.getElementById('addBtn').addEventListener('click', openModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', addManual);
searchEl.addEventListener('input', render);

modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// Initialize App Immediately (No Login)
load().then(() => render());
