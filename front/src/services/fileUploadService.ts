/**
 * File upload service — uploads files to the backend /files/* endpoints.
 *
 * Files are stored in the backend's `tempfiles/` directory and returned with
 * their server-side paths, which can then be passed as `file_paths` in agent
 * step payloads for document processing.
 *
 * Usage:
 *   import { uploadFiles, deleteUploadedFile } from "@/services/fileUploadService";
 *
 *   const saved = await uploadFiles(files);
 *   // saved[0].path is the backend path to pass to the agent
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
 * Useful to re-sync the store after a page refresh while the backend kept
 * running with previously uploaded files.
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
 * @param files - Browser File objects to upload (sent as multipart/form-data).
 * @param signal - Optional AbortSignal to cancel the upload.
 * @returns Array of UploadedFileResponse with backend paths.
 */
export async function uploadFiles(
  files: File[],
  signal?: AbortSignal,
): Promise<UploadedFileResponse[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/files/upload", {
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
 * @param filename - The unique backend filename (basename only, as returned by uploadFiles).
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
 * Creates a temporary anchor element; the backend returns the file with the
 * original name in Content-Disposition.
 *
 * @param basename - The unique backend filename (as returned by uploadFiles).
 */
export function downloadUploadedFile(basename: string): void {
  const a = document.createElement("a");
  a.href = `/files/${encodeURIComponent(basename)}/download`;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
