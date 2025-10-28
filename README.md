# ChessMaster

A chess study and analysis app that runs entirely in the browser. It lets you calibrate a camera view, upload a video (stubbed inference), and analyze a PGN with per‑move Cloud Eval—no local Stockfish setup required.

## Overview

What you can do now:
- Record: Open your camera with draggable board corner markers for calibration.
- Upload: Select a video file and run a simulated “video → PGN” inference with a progress bar; download the generated PGN.
- Analyze: Upload any PGN and get per‑move engine feedback using Lichess Cloud Eval. See best move, evaluation in pawns, the delta to best, and a move classification.
- Mentor: Wherever the current position is shown (e.g., Sidebar), view best move and PVs via Cloud Eval with simple controls.

Tech highlights: React + TypeScript + Vite + Tailwind + Redux Toolkit + chess.js. Engine analysis is done via Lichess Cloud Eval HTTP API.

## Pages and features

### Home
- Landing page with navigation to Record, Upload, Analyze, and FAQ.

### Record
- Live camera preview using getUserMedia.
- Draggable corner markers to align the chessboard view.
- Robust init so dragging markers doesn’t reinitialize the camera.
- Purpose: board calibration UX; capture/inference on this page is not enabled yet.

Key files: `src/components/VideoCanvas.tsx`, `src/components/CornerMarker.tsx`.

### Upload
- Choose a video file for analysis.
- Runs a simulated “inference” pipeline that produces a compact PGN and final FEN.
- Shows progress and, when done, updates the app state and offers a PGN download.
- This is a stub meant to be replaced by a real model.

Key files: `src/pages/Upload.tsx`, `src/services/videoInference.ts`.

### Analyze
- Upload a `.pgn` to analyze a game move‑by‑move.
- For each move, the app:
  1) Evaluates the pre‑move position via Lichess Cloud Eval (MultiPV 3–5).
  2) Tries to find the played move among the PVs; if absent, it evaluates the post‑move position.
  3) Converts UCI to SAN, computes eval from the mover’s perspective, and classifies the move.
- UI shows the board after each move, navigation controls, move list, evaluation in pawns, Δ vs best, and the best alternative.

Classification thresholds (delta to best, in pawns):
- Best Move ≤ 0.15
- Excellent ≤ 0.35
- Good ≤ 0.70
- Inaccuracy ≤ 1.20
- Mistake ≤ 2.50
- Blunder > 2.50

Key files: `src/pages/Analyze.tsx`, `src/services/cloudEvalService.ts`.

### FAQ
- Background notes, usage tips, and troubleshooting pointers.

## Mentor panel (Cloud Eval)

The Mentor panel uses Lichess Cloud Eval—no local engine. It displays:
- Best move (SAN + UCI), evaluation, depth, kNodes.
- Top PVs in SAN with adjustable preview length.
- Controls for perspective (White or Side‑to‑move) and number of lines (MultiPV).

Key file: `src/components/MentorPanel.tsx`.

## Components

### ChessBoard
- Renders any FEN with monochrome Unicode piece glyphs (no blue emoji pawns).
- Responsive sizing and clean styling.

### CornerMarker
- Draggable handles for board corners; positions stored in Redux.

### VideoCanvas
- Camera initialization with safe playback lifecycle.
- Non‑interactive overlay; corner markers stay interactive.

### Sidebar
- Game info + Mentor panel; hooks into current FEN/PGN from Redux.

## State management

Redux Toolkit slices:
- `gameSlice`: FEN, PGN, and helpers (`setGameState`, `resetGame`).
- `cornersSlice`: board corner positions (a1, h1, a8, h8).
- `uiSlice`: UI flags and misc state.

## Services

- `cloudEvalService.ts`: Thin wrapper over Lichess Cloud Eval JSON (depth, knodes, pvs) plus score formatting.
- `videoInference.ts`: Simulated video analysis returning `{ pgn, finalFen, sanMoves }` with a progress callback.

## Project structure (essentials)

```
src/
  components/
    ChessBoard.tsx
    MentorPanel.tsx
    Sidebar.tsx
    VideoCanvas.tsx
    CornerMarker.tsx
  pages/
    Home.tsx
    Record.tsx
    Upload.tsx
    Analyze.tsx
    FAQ.tsx
  services/
    cloudEvalService.ts
    videoInference.ts
  store/
    gameSlice.ts
    cornersSlice.ts
    uiSlice.ts
    hooks.ts
```

## How to run

Prereqs:
- Node.js 18+
- A modern browser (allow camera permission for Record)

Steps:
1) Install dependencies
   - npm install
2) Start the dev server
   - npm run dev
3) Open the app
   - Visit the printed URL (typically http://localhost:5173)

Notes:
- No local Stockfish needed—analysis uses Lichess Cloud Eval over HTTPS.
- The Vite dev server sends COOP/COEP headers (see `vite.config.ts`).

## Privacy and networking

- The app calls `https://lichess.org/api/cloud-eval` from your browser when you analyze positions.
- Video processing on Upload is simulated locally; no files are uploaded anywhere by default.

## Troubleshooting

- Cloud Eval is rate‑limited; long games may analyze progressively. Watch the progress text.
- If you see 429 or network errors, retry after a short wait or reduce MultiPV.
- For corner calibration, ensure good lighting and keep the board fully in frame.

## Roadmap

- Replace the Upload inference stub with a real model.
- Add summary stats on Analyze (counts of blunders/mistakes/inaccuracies).
- Batch or debounce Cloud Eval requests for faster long‑PGN analysis.
- Persist analyses locally to avoid re‑fetching on reload.

---
Built with React, TypeScript, Vite, Tailwind, Redux Toolkit, and chess.js. Engine insights powered by Lichess Cloud Eval.