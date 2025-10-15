(function(){
  // asm.js build requires no wasm; include ',worker' to signal worker mode to the engine
  importScripts('/engine/stockfish-17.1-asm-341ff22.js#worker');
})();
