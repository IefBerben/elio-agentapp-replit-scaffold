/**
 * Format file size in human-readable format.
 *
 * Args:
 *   bytes: File size in bytes
 *   unknownLabel: Label to show when size is unknown (default: "Unknown size")
 *
 * Returns:
 *   Formatted string (e.g., "1.5 MB", "256 B")
 */
export const formatFileSize = (
  bytes?: number,
  unknownLabel = "Unknown size",
): string => {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) {
    return unknownLabel;
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const order = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / Math.pow(1024, order);

  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[order]}`;
};
