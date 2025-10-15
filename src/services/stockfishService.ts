class StockfishService {
  private worker!: Worker;
  private onMessageCallback: ((message: string) => void) | null = null;
  private isReady = false;
  private pending: string[] = [];
  private readyTimer: number | null = null;
  private attemptIndex = 0;
  private readonly assets: Array<{ js: string; wasm: string; label: string }>; 

  constructor() {
    // Available engine variants to try (fallback order)
    // Static assets served from public/engine (Plan C)
    this.assets = [
      { js: '/engine/stockfish-wrapper-lite-single.js', wasm: '', label: 'lite-single' },
      { js: '/engine/stockfish-wrapper-lite.js', wasm: '', label: 'lite' },
      { js: '/engine/stockfish-wrapper-asm.js', wasm: '', label: 'asm' },
    ];

    this.initWorker();
  }

  private initWorker() {
    this.isReady = false;
    // Use the NPM package assets directly via classic Worker and pass the wasm URL via hash
    const asset = this.assets[this.attemptIndex];
    const workerJs = asset.js;
    const workerUrlWithHash = workerJs; // wrapper handles wasm URL and hash
    console.debug('[Stockfish] creating worker', {
      attempt: this.attemptIndex + 1,
      variant: asset.label,
      workerUrl: workerJs,
      wasmUrl: '(via wrapper)',
      fullUrl: workerUrlWithHash,
    });
    try {
      this.worker = new Worker(workerUrlWithHash, { type: 'classic' });
    } catch (err) {
      console.error('[Stockfish] Worker construction failed:', err);
      this.tryFallback();
      return;
    }

    this.worker.onerror = (ev: ErrorEvent) => {
      console.error('[Stockfish:worker error]', ev.message, ev);
    };
    // When structured clone fails
    (this.worker as unknown as { onmessageerror?: (ev: MessageEvent) => void }).onmessageerror = (ev: MessageEvent) => {
      console.error('[Stockfish:messageerror]', ev);
    };

    this.worker.onmessage = (e: MessageEvent) => {
      const text = typeof e.data === 'string' ? e.data : String(e.data ?? '');
      console.debug('[Stockfish:onmessage]', text);
      // UCI handshake handling
      if (text.includes('uciok')) {
        console.debug('[Stockfish] uciok received -> isready');
        if (this.readyTimer) {
          clearTimeout(this.readyTimer);
          this.readyTimer = null;
        }
        this.postRaw('isready');
      } else if (text.includes('readyok')) {
        console.debug('[Stockfish] readyok received');
        if (this.readyTimer) {
          clearTimeout(this.readyTimer);
          this.readyTimer = null;
        }
        this.isReady = true;
        // flush queued commands
        while (this.pending.length) {
          const cmd = this.pending.shift()!;
          console.debug('[Stockfish] flushing queued cmd:', cmd);
          this.postRaw(cmd);
        }
      }
      if (this.onMessageCallback) this.onMessageCallback(text);
    };

    console.debug('[Stockfish] init -> uci');
    this.postRaw('uci');

    // If we don't see any handshake within a few seconds, try another variant
    this.readyTimer = window.setTimeout(() => {
      console.warn('[Stockfish] No uciok/readyok within timeout; attempting fallback');
      try {
        this.worker.terminate();
      } catch {}
      this.tryFallback();
    }, 5000);
  }

  private tryFallback() {
    this.attemptIndex += 1;
    if (this.attemptIndex < this.assets.length) {
      this.initWorker();
    } else {
      console.error('[Stockfish] All worker variants failed to initialize.');
    }
  }

  public onMessage(callback: (message: string) => void) {
    this.onMessageCallback = callback;
  }

  private postRaw(command: string) {
    console.debug('[Stockfish:post]', command);
    this.worker.postMessage(command);
  }

  public sendCommand(command: string) {
    if (this.isReady) {
      console.debug('[Stockfish:send] immediate', command);
      this.postRaw(command);
    } else {
      console.debug('[Stockfish:send] queued (not ready)', command);
      this.pending.push(command);
    }
  }

  public analyzePosition(fen: string, depth: number = 15) {
    // stop any previous search and start fresh
    console.debug('[Stockfish] analyzePosition', { fen, depth });
    this.sendCommand('stop');
    this.sendCommand('ucinewgame');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }
}

export const stockfishService = new StockfishService();
