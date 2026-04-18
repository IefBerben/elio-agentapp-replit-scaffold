import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface AgentAppSelectProps {
  readonly options: readonly SelectOption[];
  readonly value: string | null;
  readonly onValueChange: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly className?: string;
}

export function AgentAppSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  disabled = false,
  label,
  className,
}: AgentAppSelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
