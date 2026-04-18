import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import { type DragEvent, type ReactNode, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

interface FileUploadZoneProps {
  /**
   * Callback when files are selected or dropped.
   *
   * Args:
   *   files: Array of selected File objects
   */
  readonly onFileSelect: (files: File[]) => void;

  /**
   * Accepted file types (e.g., ".pdf,.docx" or "image/*")
   */
  readonly accept?: string;

  /**
   * Whether multiple files can be selected
   */
  readonly multiple?: boolean;

  /**
   * Whether a file is currently being uploaded
   */
  readonly isUploading?: boolean;

  /**
   * Whether files are being dragged over the zone
   */
  readonly isDragging?: boolean;

  /**
   * Callback when drag state changes
   *
   * Args:
   *   isDragging: Whether the user is currently dragging files over the zone
   */
  readonly onDragStateChange?: (isDragging: boolean) => void;

  /**
   * Custom label text (uses i18n default if not provided)
   */
  readonly label?: string;

  /**
   * Hint text showing accepted formats
   */
  readonly hint?: string;

  /**
   * Visual variant
   */
  readonly variant?: "default" | "compact";

  /**
   * Additional CSS classes
   */
  readonly className?: string;

  /**
   * Custom icon to display
   */
  readonly icon?: ReactNode;

  /**
   * Whether the zone is disabled
   */
  readonly disabled?: boolean;
}

/**
 * Unified file upload zone component with drag & drop support.
 * Provides consistent styling across all agent app pages.
 *
 * Args:
 *   onFileSelect: Called with selected files when user picks or drops files
 *   accept: Accepted file types string (e.g. ".pdf,.docx")
 *   multiple: Allow selecting multiple files at once
 *   isUploading: Show upload spinner when true
 *   isDragging: Controlled drag state (for styling)
 *   onDragStateChange: Callback to sync drag state with parent
 *   label: Custom label text
 *   hint: Secondary hint text (e.g. accepted formats)
 *   variant: "default" for normal size, "compact" for smaller version
 *   className: Additional CSS classes
 *   icon: Custom icon instead of the default upload icon
 *   disabled: Disable all interaction
 *
 * Returns:
 *   A styled drop zone with click-to-upload and drag-and-drop functionality
 */
export function FileUploadZone({
  onFileSelect,
  accept,
  multiple = false,
  isUploading = false,
  isDragging: controlledDragging,
  onDragStateChange,
  label,
  hint,
  variant = "default",
  className,
  icon,
  disabled = false,
}: FileUploadZoneProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(Array.from(files));
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStateChange?.(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        // Filter by accept if specified
        if (accept) {
          const acceptedTypes = accept.split(",").map((t) => t.trim());
          const filtered = fileArray.filter((file) =>
            acceptedTypes.some((type) => {
              if (type.startsWith(".")) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
              }
              if (type.endsWith("/*")) {
                return file.type.startsWith(type.replace("/*", "/"));
              }
              return file.type === type;
            }),
          );
          onFileSelect(multiple ? filtered : filtered.slice(0, 1));
        } else {
          onFileSelect(multiple ? fileArray : fileArray.slice(0, 1));
        }
      }
    },
    [accept, disabled, isUploading, multiple, onDragStateChange, onFileSelect],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) {
        onDragStateChange?.(true);
      }
    },
    [disabled, isUploading, onDragStateChange],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStateChange?.(false);
    },
    [onDragStateChange],
  );

  const isCompact = variant === "compact";
  const showDragging = controlledDragging && !disabled && !isUploading;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={disabled || isUploading}
        className={cn(
          "w-full border-2 border-dashed rounded-xl transition-all cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          isCompact ? "p-2" : "p-3 md:p-4",
          showDragging
            ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
            : "border-border hover:border-blue-500/50 hover:bg-muted/50",
          (disabled || isUploading) &&
            "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent",
          className,
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center text-center",
            isCompact ? "gap-0.5" : "gap-2",
          )}
        >
          {isUploading ? (
            <Loader2
              className={cn(
                "text-blue-600 animate-spin",
                isCompact ? "w-4 h-4" : "w-5 h-5",
              )}
            />
          ) : (
            <div
              className={cn(
                "text-muted-foreground",
                showDragging && "text-blue-600",
              )}
            >
              {icon || <Upload className={isCompact ? "w-4 h-4" : "w-5 h-5"} />}
            </div>
          )}

          {/* In compact mode, only render text if a label is explicitly provided */}
          {(!isCompact || label !== undefined || isUploading) && (
            <div className="space-y-0.5">
              <p
                className={cn(
                  "font-medium text-foreground",
                  isCompact ? "text-xs" : "text-sm",
                )}
              >
                {isUploading
                  ? t("agentAppCommon.uploading")
                  : (label ?? t("agentAppCommon.dropFilesHere"))}
              </p>
              {hint && (
                <p
                  className={cn(
                    "text-muted-foreground",
                    isCompact ? "text-[10px]" : "text-xs",
                  )}
                >
                  {hint}
                </p>
              )}
            </div>
          )}
        </div>
      </button>
    </>
  );
}
