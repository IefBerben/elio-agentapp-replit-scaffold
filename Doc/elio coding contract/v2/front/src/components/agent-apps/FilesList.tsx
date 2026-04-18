import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Download, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FileItem {
  /**
   * File name
   */
  readonly name: string;

  /**
   * File size in bytes
   */
  readonly size: number;

  /**
   * Optional file path
   */
  readonly path?: string;
}

interface FilesListProps {
  /**
   * Array of files to display
   */
  readonly files: FileItem[];

  /**
   * Callback when delete is clicked
   *
   * Args:
   *   fileName: Name of the file to delete
   */
  readonly onDelete?: (fileName: string) => void;

  /**
   * Callback when download is clicked
   *
   * Args:
   *   fileName: Name of the file to download
   */
  readonly onDownload?: (fileName: string) => void;

  /**
   * Whether the list is loading
   */
  readonly isLoading?: boolean;

  /**
   * Name of file currently being deleted (shows spinner)
   */
  readonly deletingFile?: string | null;

  /**
   * Title to display above the list
   */
  readonly title?: string;

  /**
   * Additional CSS classes
   */
  readonly className?: string;

  /**
   * Show empty state when no files
   */
  readonly showEmptyState?: boolean;
}

/**
 * Unified file list component for displaying uploaded/generated files.
 *
 * Args:
 *   files: Array of file objects to display
 *   onDelete: Callback for file deletion (shows delete button if provided)
 *   onDownload: Callback for file download (shows download button if provided)
 *   isLoading: Shows a spinner when true
 *   deletingFile: Name of file currently being deleted (shows spinner for that file)
 *   title: Optional label above the list
 *   className: Additional CSS classes
 *   showEmptyState: Whether to render an empty state message when no files
 *
 * Returns:
 *   A styled list of files with optional delete/download buttons
 */
export function FilesList({
  files,
  onDelete,
  onDownload,
  isLoading = false,
  deletingFile,
  title,
  className,
  showEmptyState = true,
}: FilesListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {title}
          </h4>
        )}
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {title}
          </h4>
        )}
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("agentAppCommon.noFiles")}
        </p>
      </div>
    );
  }

  // Sort files alphabetically by name
  const sortedFiles = [...files].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          {title}
        </h4>
      )}
      <div className="rounded-2xl border border-border/60 bg-muted shadow-sm">
        <div>
          {sortedFiles.map((file, index) => {
            const isDeleting =
              deletingFile === file.name ||
              deletingFile?.startsWith(`${file.name}-`);
            const fileSizeLabel = formatFileSize(file.size);

            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between px-4 py-2 first:pt-2.5 last:pb-2.5"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="truncate text-sm font-normal">{file.name}</p>
                </div>
                <div className="flex items-center flex-shrink-0 gap-1">
                  {onDownload && (
                    <button
                      type="button"
                      onClick={() => onDownload(file.name)}
                      disabled={!!isDeleting}
                      aria-label={`Download ${file.name}`}
                      className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-background/70 transition-colors disabled:opacity-50"
                    >
                      <span className="relative top-px">{fileSizeLabel}</span>
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(file.name)}
                      disabled={!!isDeleting}
                      aria-label={`Delete ${file.name}`}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
