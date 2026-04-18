import { cn } from "@/lib/utils";

interface AgentAppSwitchProps {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly className?: string;
}

export function AgentAppSwitch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: AgentAppSwitchProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => !disabled && onCheckedChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009de0] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          checked ? "bg-[#009de0]" : "bg-input dark:bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-foreground select-none">{label}</span>
      )}
    </label>
  );
}
