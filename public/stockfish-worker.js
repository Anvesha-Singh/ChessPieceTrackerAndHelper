let stockfish = null;

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'init') {
    if (!stockfish) {
      const tryLoad = (url) => {
        importScripts(url);
        if (typeof STOCKFISH !== 'undefined') {
          return STOCKFISH();
        } else if (self && self.STOCKFISH) {
          return self.STOCKFISH();
        }
        throw new Error('STOCKFISH symbol not found after importScripts: ' + url);
      };

      try {
        // Prefer local engine files if present under /engine
        stockfish = tryLoad('/engine/stockfish.js');
      } catch (localErr) {
        try {
          // Fallback to CDN
          stockfish = tryLoad('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        } catch (cdnErr) {
          const msg = 'error: failed to load Stockfish locally and from CDN: ' + (cdnErr?.message || String(cdnErr));
          self.postMessage({ type: 'output', payload: msg });
          return;
        }
      }

      stockfish.onmessage = function (evt) {
        const line = typeof evt === 'object' && evt && 'data' in evt ? evt.data : evt;
        if (typeof line === 'string') {
          self.postMessage({ type: 'output', payload: line });
        }
      };

      self.postMessage({ type: 'ready' });
    }
  } else if (type === 'command') {
    if (stockfish) {
      stockfish.postMessage(payload);
    }
  }
};
