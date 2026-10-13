export async function exportDiagnostics(
  run: string,
): Promise<{ blob: Blob; filename: string; partial: boolean }> {
  const worker = new Worker(new URL("./export.worker.ts", import.meta.url), { type: "module" });
  return new Promise((resolve, reject) => {
    let deadline: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(deadline);
      deadline = setTimeout(() => {
        worker.terminate();
        reject(new Error("export_unavailable"));
      }, 60_000);
    };
    arm();
    worker.onmessage = ({ data }) => {
      if (data.progress) {
        arm();
        return;
      }
      clearTimeout(deadline);
      worker.terminate();
      if (data.error) reject(new Error(data.error));
      else resolve(data);
    };
    worker.onerror = () => {
      clearTimeout(deadline);
      worker.terminate();
      reject(new Error("export_unavailable"));
    };
    worker.postMessage({ run });
  });
}
export function initiateDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
