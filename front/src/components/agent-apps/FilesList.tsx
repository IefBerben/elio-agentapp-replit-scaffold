import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";
import { FileText, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UploadedFile {
  readonly name: string;
  readonly size?: number;
}

interface FilesListProps {
  readonly files: readonly UploadedFile[];
  readonly onDelete?: (fileName: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function FilesList({
  files,
  onDelete,
  disabled = false,
  className,
}: FilesListProps) {
  const { t } = useTranslation();

  if (files.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground italic", className)}>
        {t("agentAppCommon.noFiles")}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-1", className)}>
      {files.map((file) => (
        <li
          key={file.name}
          className="flex items-center justify-between gap-2 px-2 py-1.5 bg-muted rounded-md text-sm group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-foreground">{file.name}</span>
            {file.size != null && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(file.name)}
              disabled={disabled}
              className={cn(
                "p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500",
                disabled && "cursor-not-allowed opacity-30",
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
