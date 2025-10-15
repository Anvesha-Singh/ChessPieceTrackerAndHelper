let stockfish = null;

self.onmessage = function(e) {
  const { type, payload } = e.data;

  if (type === 'init') {
    if (!stockfish) {
      importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
      stockfish = STOCKFISH();

      stockfish.onmessage = function(line) {
        self.postMessage({ type: 'output', payload: line });
      };

      self.postMessage({ type: 'ready' });
    }
  } else if (type === 'command') {
    if (stockfish) {
      stockfish.postMessage(payload);
    }
  }
};
