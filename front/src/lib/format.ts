/**
 * Format a byte count into a human-readable string (e.g. "1.5 MB").
 */
export function formatFileSize(
  bytes: number,
  unknownLabel = "—",
): string {
  if (!Number.isFinite(bytes) || bytes < 0) return unknownLabel;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${i === 0 ? size : size.toFixed(1)} ${units[i]}`;
}
