type StockfishCallback = (message: string) => void;

class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private readyCallbacks: (() => void)[] = [];
  private messageCallback: StockfishCallback | null = null;

  initialize(): Promise<void> {
    if (this.worker) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.worker = new Worker('/stockfish-worker.js');

      this.worker.onmessage = (e) => {
        const { type, payload } = e.data;

        if (type === 'ready') {
          this.isReady = false;
          this.sendCommand('uci');
        } else if (type === 'output') {
          if (payload === 'uciok') {
            this.sendCommand('isready');
          } else if (payload === 'readyok') {
            this.isReady = true;
            this.readyCallbacks.forEach(cb => cb());
            this.readyCallbacks = [];
            resolve();
          }

          if (this.messageCallback) {
            this.messageCallback(payload);
          }
        }
      };

      this.worker.postMessage({ type: 'init' });
    });
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'command', payload: command });
    }
  }

  private waitForReady(): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.readyCallbacks.push(resolve);
    });
  }

  setMessageCallback(callback: StockfishCallback): void {
    this.messageCallback = callback;
  }

  clearMessageCallback(): void {
    this.messageCallback = null;
  }

  async analyzePosition(fen: string, depth: number = 15): Promise<{ evaluation: string; bestMove: string }> {
    await this.waitForReady();

    return new Promise((resolve) => {
      let evaluation = '0.00';
      let bestMove = '';

      const handler = (message: string) => {
        if (message.startsWith('info') && message.includes('score')) {
          const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
          if (scoreMatch) {
            const [, type, value] = scoreMatch;
            if (type === 'mate') {
              evaluation = `Mate in ${Math.abs(parseInt(value))}`;
            } else {
              const centipawns = parseInt(value);
              evaluation = (centipawns / 100).toFixed(2);
              if (centipawns > 0) {
                evaluation = '+' + evaluation;
              }
            }
          }
        }

        if (message.startsWith('bestmove')) {
          const moveMatch = message.match(/bestmove (\w+)/);
          if (moveMatch) {
            bestMove = moveMatch[1];
          }
          this.clearMessageCallback();
          resolve({ evaluation, bestMove });
        }
      };

      this.setMessageCallback(handler);
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  async getEvaluation(fen: string, depth: number = 12): Promise<number> {
    await this.waitForReady();

    return new Promise((resolve) => {
      let evaluation = 0;

      const handler = (message: string) => {
        if (message.startsWith('info') && message.includes('score cp')) {
          const scoreMatch = message.match(/score cp (-?\d+)/);
          if (scoreMatch) {
            evaluation = parseInt(scoreMatch[1]);
          }
        }

        if (message.startsWith('bestmove')) {
          this.clearMessageCallback();
          resolve(evaluation);
        }
      };

      this.setMessageCallback(handler);
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}

export const stockfishService = new StockfishService();
