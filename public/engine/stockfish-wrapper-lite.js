(function(){
  var wasmUrl = new URL('/engine/stockfish-17.1-lite-51f59da.wasm', self.location.origin).toString();
  importScripts('/engine/stockfish-17.1-lite-51f59da.js#' + encodeURIComponent(wasmUrl) + ',worker');
})();
