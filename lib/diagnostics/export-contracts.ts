import type { BuildStamp, DiagnosticRun } from "./contracts";
export type ExportSegment = {
  id: string;
  alias: string;
  epoch: number;
  role: string;
  slot: number | null;
  state: string;
  joined_at: string;
  final_at: string | null;
  checkpoint_at: string | null;
  valid_progress_at: string | null;
  next_sequence: number;
  error: string | null;
};
export type ExportChunk = {
  id: string;
  client_id: string;
  sequence: number;
  sha256: string;
  compressed_bytes: number;
  expanded_bytes: number;
  record_count: number;
};
export type ExportManifest = {
  schema: 1;
  run: DiagnosticRun;
  server_build: BuildStamp;
  exported_at: string;
  completeness: "complete" | "partial";
  clock: string;
  units: string;
  privacy: string;
};
