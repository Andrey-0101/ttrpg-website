import type { DiagnosticsMediaSource } from "./metrics";
import type { DiagnosticPayload } from "./contracts";
// One read-only attachment to the existing Room. No diagnostics transport/Room.
let source: DiagnosticsMediaSource | null = null;
let sessionContext: { campaign: string; session: string | null } | null = null;
const listeners = new Set<(event: DiagnosticPayload) => void>();
export function registerDiagnosticMedia(value: DiagnosticsMediaSource) {
  source = value;
  return () => {
    if (source === value) source = null;
  };
}
export function diagnosticMedia() {
  return source;
}
export function diagnosticMediaEvent(event: DiagnosticPayload) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      /* An observer must never interrupt media operations. */
    }
  }
}
export function setDiagnosticSession(campaign: string, session: string | null) {
  sessionContext = { campaign, session };
  diagnosticMediaEvent({ kind: "event", code: "session_changed", session });
}
export function diagnosticSession(campaign: string) {
  return sessionContext?.campaign === campaign ? sessionContext.session : null;
}
export function subscribeDiagnosticMedia(listener: (event: DiagnosticPayload) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
