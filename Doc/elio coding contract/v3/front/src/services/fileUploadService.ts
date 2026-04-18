/**
 * File upload service for the toolkit.
 *
 * Posts files to the backend /files/upload endpoint, which saves them locally
 * under the `tempfiles/` directory and returns their server-side paths.
 */

export interface UploadedFileResponse {
  /** Original file name */
  name: string;
  /** Absolute path on the backend where the file was saved */
  path: string;
  /** File size in bytes */
  size: number;
}

/**
 * List all files currently stored in the backend tempfiles directory.
 *
 * Called on app startup to synchronise the store with reality (e.g. after a
 * page refresh while the backend kept running with existing files).
 *
 * Returns:
 *   Array of UploadedFileResponse for each file present on the backend.
 *
 * Raises:
 *   Error: If the request fails.
 */
export async function listUploadedFiles(): Promise<UploadedFileResponse[]> {
  const response = await fetch("/files");

  if (!response.ok) {
    const detail = await response.text().catch(() => String(response.status));
    throw new Error(`List files failed: ${detail}`);
  }

  const data = (await response.json()) as { files: UploadedFileResponse[] };
  return data.files;
}

/**
 * Upload an array of File objects to the backend.
 *
 * Args:
 *   files: Browser File objects to upload (multipart/form-data).
 *
 * Returns:
 *   Array of UploadedFileResponse with backend paths.
 *
 * Raises:
 *   Error: If the upload request fails.
 */
export async function uploadFiles(
  files: File[],
  signal?: AbortSignal,
): Promise<UploadedFileResponse[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(`/files/upload`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => String(response.status));
    throw new Error(`Upload failed: ${detail}`);
  }

  const data = (await response.json()) as { files: UploadedFileResponse[] };
  return data.files;
}

/**
 * Delete a previously uploaded file from the backend.
 *
 * Args:
 *   filename: The unique backend filename (basename only, as returned by uploadFiles).
 *
 * Returns:
 *   void — resolves when the file has been deleted.
 *
 * Raises:
 *   Error: If the deletion request fails.
 */
export async function deleteUploadedFile(filename: string): Promise<void> {
  const response = await fetch(`/files/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => String(response.status));
    throw new Error(`Delete failed: ${detail}`);
  }
}

/**
 * Trigger a browser download for a previously uploaded file.
 *
 * Creates a temporary anchor element to initiate the download; the backend
 * returns the file with the original name in Content-Disposition.
 *
 * Args:
 *   basename: The unique backend filename (as returned by uploadFiles, basename only).
 *
 * Returns:
 *   void
 */
export function downloadUploadedFile(basename: string): void {
  const a = document.createElement("a");
  a.href = `/files/${encodeURIComponent(basename)}/download`;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
