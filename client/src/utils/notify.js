// Lightweight notification helpers: desktop notifications, title flash, and a soft beep

export async function ensureNotifyPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return Notification.permission;
  }
}

export async function notifyDesktop(title, { body, icon } = {}) {
  if (!('Notification' in window)) return null;
  const perm = await ensureNotifyPermission();
  if (perm !== 'granted') return null;
  try {
    const n = new Notification(title, {
      body: body || '',
      icon: icon || '/vite.svg',
      silent: true,
    });
    n.onclick = () => {
      try { window.focus(); } catch {}
      n.close?.();
    };
    return n;
  } catch {
    return null;
  }
}

let flashTimer = null;
let originalTitle = document.title;

export function startTitleFlash(message = 'Done') {
  stopTitleFlash();
  originalTitle = document.title;
  let flag = false;
  flashTimer = window.setInterval(() => {
    document.title = flag ? originalTitle : `➤ ${message}`;
    flag = !flag;
  }, 900);
  const stopOnFocus = () => stopTitleFlash();
  window.addEventListener('focus', stopOnFocus, { once: true });
}

export function stopTitleFlash() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
    document.title = originalTitle;
  }
}

export async function beep(duration = 120, frequency = 880, volume = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = frequency;
    g.gain.value = volume;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, duration);
  } catch {}
}

// Smart notify: desktop notif if tab is hidden, otherwise just beep
export async function smartNotify(title, opts = {}) {
  if (document.hidden) {
    await notifyDesktop(title, opts);
  }
  await beep();
  startTitleFlash(title);
  setTimeout(() => stopTitleFlash(), 10000);
}
