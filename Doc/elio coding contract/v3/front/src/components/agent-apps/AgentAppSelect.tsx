import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  /**
   * Unique value for the option
   */
  value: string;

  /**
   * Display label for the option
   */
  label: string;
}

interface AgentAppSelectProps {
  /**
   * Currently selected value
   */
  readonly value: string | null;

  /**
   * Callback when selection changes
   */
  readonly onValueChange: (value: string) => void;

  /**
   * Available options to choose from
   */
  readonly options: SelectOption[];

  /**
   * Placeholder text when no value is selected
   */
  readonly placeholder?: string;

  /**
   * Whether the select is disabled
   */
  readonly disabled?: boolean;

  /**
   * Additional CSS classes for the trigger
   */
  readonly className?: string;
}

/**
 * Unified select dropdown for agent app pages.
 * Uses a styled native <select> for maximum compatibility without external dependencies.
 *
 * Args:
 *   value: Currently selected value (null for unselected)
 *   onValueChange: Callback when an option is selected
 *   options: Array of { value, label } objects
 *   placeholder: Text shown when nothing is selected
 *   disabled: Whether the control is interactive
 *   className: Additional CSS classes for the wrapper
 *
 * Returns:
 *   A styled dropdown select component
 */
export function AgentAppSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
}: AgentAppSelectProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value) onValueChange(e.target.value);
        }}
        disabled={disabled}
        className={cn(
          "w-full appearance-none rounded-full h-9 px-4 pr-9 text-sm",
          "border border-border/70 bg-background text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all",
          !value && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {!value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 text-foreground" />
    </div>
  );
}
