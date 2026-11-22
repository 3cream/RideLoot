  /* ---------- this site makes no sound. A short vibration, on phones that allow it, is the only feedback beyond what you see. ---------- */
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }
