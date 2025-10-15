(function(){
  var wasmUrl = new URL('/engine/stockfish-17.1-lite-single-03e3232.wasm', self.location.origin).toString();
  importScripts('/engine/stockfish-17.1-lite-single-03e3232.js#' + encodeURIComponent(wasmUrl) + ',worker');
})();
