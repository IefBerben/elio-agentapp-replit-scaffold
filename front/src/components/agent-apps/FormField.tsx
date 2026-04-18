import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

// ─── FormField ────────────────────────────────────────────

interface FormFieldProps {
  readonly label: string;
  readonly description?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── FormInput ────────────────────────────────────────────

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly error?: boolean;
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error
          ? "border-red-400 dark:border-red-500"
          : "border-border",
        className,
      )}
      {...props}
    />
  );
}

// ─── FormTextarea ─────────────────────────────────────────

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly error?: boolean;
}

export function FormTextarea({
  error,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 resize-y min-h-[80px]",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error
          ? "border-red-400 dark:border-red-500"
          : "border-border",
        className,
      )}
      {...props}
    />
  );
}
