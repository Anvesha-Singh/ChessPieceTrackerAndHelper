export interface CloudEvalPV {
  moves: string; // space-separated UCI moves
  cp?: number;   // centipawns
  mate?: number; // mate in N (positive for side to move mating)
}

export interface CloudEvalResponse {
  depth?: number;
  knodes?: number;
  pvs?: CloudEvalPV[];
}

export function formatScore(pv: CloudEvalPV): { kind: 'cp' | 'mate'; text: string; value: number } | null {
  if (typeof pv.mate === 'number') {
    const n = Math.abs(pv.mate);
    return { kind: 'mate', text: `Mate in ${n}`, value: pv.mate > 0 ? 10000 : -10000 };
  }
  if (typeof pv.cp === 'number') {
    return { kind: 'cp', text: `${(pv.cp / 100).toFixed(2)}`, value: pv.cp };
  }
  return null;
}

export async function fetchCloudEval(fen: string, multiPv = 3): Promise<CloudEvalResponse> {
  const params = new URLSearchParams({ fen, multiPv: String(multiPv) });
  const url = `https://lichess.org/api/cloud-eval?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    // Return a structured error-like object so the UI can render a message
    return {};
  }

  const data = (await res.json()) as CloudEvalResponse;
  return data ?? {};
}
