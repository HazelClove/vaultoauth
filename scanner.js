(async () => {
  if (window.__vaultScannerActive) return;
  window.__vaultScannerActive = true;

  const api = typeof browser !== "undefined" ? browser : chrome;

  const shotPromise = new Promise((resolve) => {
    api.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (resp) => resolve(resp?.dataUrl || null));
  });

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483647;
    background: rgba(0,0,0,0.55); cursor: crosshair;
    backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);
    animation: vaultFade .18s ease-out;
    user-select: none;
  `;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes vaultFade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes vaultPulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
    .vault-hint {
      position: fixed; left: 50%; top: 24px; transform: translateX(-50%);
      color: #f2f2f2; font: 13px -apple-system, system-ui, sans-serif;
      background: #1c1c1e; border: 1px solid #38383a;
      padding: 8px 14px; border-radius: 10px; letter-spacing: .2px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .vault-box {
      position: fixed; border: 1.5px solid #30d158; border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);
      pointer-events: none;
      transition: border-color .15s ease;
    }
  `;
  document.documentElement.appendChild(style);

  const hint = document.createElement('div');
  hint.className = 'vault-hint';
  hint.textContent = 'Drag to select the QR code · Esc to cancel';
  overlay.appendChild(hint);

  const box = document.createElement('div');
  box.className = 'vault-box';
  box.style.display = 'none';
  overlay.appendChild(box);

  document.documentElement.appendChild(overlay);

  let start = null;
  let dragging = false;

  const cleanup = () => {
    overlay.remove();
    box.remove();
    style.remove();
    document.removeEventListener('keydown', onKey);
    window.__vaultScannerActive = false;
  };

  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('mousedown', (e) => {
    start = { x: e.clientX, y: e.clientY };
    dragging = true;
    box.style.display = 'block';
    box.style.left = e.clientX + 'px';
    box.style.top = e.clientY + 'px';
    box.style.width = '0px';
    box.style.height = '0px';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!dragging || !start) return;
    const x = Math.min(e.clientX, start.x);
    const y = Math.min(e.clientY, start.y);
    const w = Math.abs(e.clientX - start.x);
    const h = Math.abs(e.clientY - start.y);
    box.style.left = x + 'px';
    box.style.top = y + 'px';
    box.style.width = w + 'px';
    box.style.height = h + 'px';
  });

  overlay.addEventListener('mouseup', async (e) => {
    if (!dragging || !start) return;
    dragging = false;
    const x = Math.min(e.clientX, start.x);
    const y = Math.min(e.clientY, start.y);
    const w = Math.abs(e.clientX - start.x);
    const h = Math.abs(e.clientY - start.y);
    if (w < 20 || h < 20) { box.style.display = 'none'; return; }

    hint.textContent = 'Reading QR…';
    hint.style.animation = 'vaultPulse 1s infinite';

    const dataUrl = await shotPromise;
    if (!dataUrl) { hint.textContent = 'Screenshot failed'; setTimeout(cleanup, 900); return; }

    const dpr = window.devicePixelRatio || 1;
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x * dpr, y * dpr, w * dpr, h * dpr, 0, 0, w * dpr, h * dpr);

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    api.runtime.sendMessage({ 
      type: 'DECODE_QR', 
      imageData: Array.from(data), 
      width, 
      height 
    }, (response) => {
      if (api.runtime.lastError || !response) {
        hint.textContent = 'Error decoding';
        setTimeout(cleanup, 1100);
        return;
      }

      if (!response.success || !response.data) {
        hint.textContent = 'No QR code found — try again';
        hint.style.animation = '';
        setTimeout(cleanup, 1100);
        return;
      }

      const raw = response.data;
      let parsed = null;

      if (raw.startsWith('otpauth://totp/')) {
        try {
          const url = new URL(raw);
          const label = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
          let issuer = url.searchParams.get('issuer') || '';
          let account = label;
          if (label.includes(':')) {
            const [i, a] = label.split(':');
            issuer = issuer || i.trim();
            account = a.trim();
          }
          const secret = url.searchParams.get('secret');
          if (secret) parsed = { issuer, account, secret };
        } catch {}
      } else if (/^[A-Z2-7\s]+$/i.test(raw) && raw.replace(/\s+/g,'').length >= 16) {
        parsed = { issuer: '', account: '', secret: raw.replace(/\s+/g,'') };
      }

      if (!parsed) {
        hint.textContent = 'Not a TOTP QR code';
        hint.style.animation = '';
        setTimeout(cleanup, 1100);
        return;
      }

      api.runtime.sendMessage({ type: 'ADD_ACCOUNT', data: parsed }, (res) => {
        hint.textContent = 'Added ✓';
        hint.style.animation = '';
        setTimeout(cleanup, 500);
      });
    });
  });
})();
