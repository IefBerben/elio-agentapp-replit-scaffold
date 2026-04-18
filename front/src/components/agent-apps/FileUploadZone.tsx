import { cn } from "@/lib/utils";
import { CloudUpload, Loader2 } from "lucide-react";
import { type ChangeEvent, type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface FileUploadZoneProps {
  readonly onFileSelect: (files: FileList) => void;
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly disabled?: boolean;
  readonly isUploading?: boolean;
  readonly isDragging?: boolean;
  readonly onDragStateChange?: (dragging: boolean) => void;
  readonly label?: string;
  readonly hint?: string;
  readonly variant?: "default" | "compact";
  readonly className?: string;
}

export function FileUploadZone({
  onFileSelect,
  accept,
  multiple = true,
  disabled = false,
  isUploading = false,
  isDragging: controlledDragging,
  onDragStateChange,
  label,
  hint,
  variant = "default",
  className,
}: FileUploadZoneProps) {
  const { t } = useTranslation();
  const [internalDrag, setInternalDrag] = useState(false);
  const isDragging = controlledDragging ?? internalDrag;

  const setDrag = (v: boolean) => {
    setInternalDrag(v);
    onDragStateChange?.(v);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (!disabled && !isUploading && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
      e.target.value = "";
    }
  };

  if (variant === "compact") {
    return (
      <label
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer transition-all",
          "text-sm text-muted-foreground hover:border-blue-400 hover:text-blue-600",
          isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
          (disabled || isUploading) &&
            "opacity-50 cursor-not-allowed pointer-events-none",
          className,
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CloudUpload className="w-4 h-4" />
        )}
        <span>
          {isUploading
            ? t("agentAppCommon.uploading")
            : (label ?? t("agentAppCommon.dropFilesHere"))}
        </span>
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || isUploading}
        />
      </label>
    );
  }

  return (
    <label
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all",
        isDragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : "border-border hover:border-blue-400 dark:hover:border-blue-500",
        (disabled || isUploading) &&
          "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      ) : (
        <CloudUpload className="w-8 h-8 text-muted-foreground" />
      )}
      <span className="text-sm font-medium text-muted-foreground">
        {isUploading
          ? t("agentAppCommon.uploading")
          : (label ?? t("agentAppCommon.dropFilesHere"))}
      </span>
      {hint && (
        <span className="text-xs text-muted-foreground/80">{hint}</span>
      )}
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled || isUploading}
      />
    </label>
  );
}
