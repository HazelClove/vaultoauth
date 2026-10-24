const api = typeof browser !== "undefined" ? browser : chrome;

if (typeof importScripts !== 'undefined' && typeof jsQR === 'undefined') {
  try {
    importScripts('lib/jsQR.js', 'lib/otpauth.min.js');
  } catch (e) {
    console.warn("importScripts failed, assuming Firefox environment.");
  }
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'CAPTURE_TAB') {
    api.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (api.runtime.lastError) {
        sendResponse({ error: api.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl });
      }
    });
    return true;
  }

  if (msg?.type === 'DECODE_QR') {
    try {
      const data = new Uint8ClampedArray(msg.imageData);
      const qr = jsQR(data, msg.width, msg.height, { inversionAttempts: 'attemptBoth' });
      if (qr && qr.data) {
        sendResponse({ success: true, data: qr.data });
      } else {
        sendResponse({ success: false });
      }
    } catch (e) {
      sendResponse({ success: false, error: e.toString() });
    }
    return true;
  }

  if (msg?.type === 'ADD_ACCOUNT') {
    api.storage.local.get('accounts').then(({ accounts = [] }) => {
      accounts.push({
        id: Math.random().toString(36).slice(2, 10),
        issuer: msg.data.issuer || '',
        account: msg.data.account || '',
        secret: msg.data.secret
      });
      api.storage.local.set({ accounts }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
