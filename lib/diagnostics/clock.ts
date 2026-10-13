import { diagnosticRequest } from "./http";
export type Clock = { offset: number; uncertainty: number; rtt: number };
export function selectClock(probes: { sent: number; received: number; server: number }[]): Clock {
  const best = probes.reduce((a, b) => (b.received - b.sent < a.received - a.sent ? b : a));
  const rtt = best.received - best.sent;
  return { offset: best.server - (best.sent + best.received) / 2, uncertainty: rtt / 2, rtt };
}
export async function syncClock(campaign: string): Promise<Clock> {
  const probes = [];
  for (let i = 0; i < 3; i++) {
    const sent = Date.now();
    const result = await diagnosticRequest<{ serverNow: number }>({ action: "state", campaign });
    probes.push({ sent, received: Date.now(), server: result.serverNow });
  }
  return selectClock(probes);
}
