import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  readonly key: string;
  readonly label: string;
}

interface StepIndicatorProps {
  readonly steps: readonly Step[];
  readonly currentStep: number;
  readonly maxReachedStep?: number;
  readonly onStepClick?: (step: number) => void;
  readonly variant?: "pills" | "numbered" | "line";
  readonly className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  maxReachedStep,
  onStepClick,
  variant = "pills",
  className,
}: StepIndicatorProps) {
  const clickableUpTo = maxReachedStep ?? currentStep - 1;

  const getStepState = (stepNumber: number) => {
    const isActive = currentStep === stepNumber;
    const isCompleted = currentStep > stepNumber;
    const isFutureReached =
      stepNumber > currentStep && stepNumber <= clickableUpTo;
    const isClickable =
      !isActive && (isCompleted || isFutureReached) && !!onStepClick;
    return { isActive, isCompleted, isFutureReached, isClickable };
  };

  if (variant === "pills") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 bg-muted p-1 rounded-lg",
          className,
        )}
      >
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const { isActive, isCompleted, isFutureReached, isClickable } =
            getStepState(stepNumber);

          return (
            <button
              key={step.key}
              onClick={() => isClickable && onStepClick?.(stepNumber)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                isActive && "bg-card text-blue-600 shadow-sm",
                isCompleted && "text-green-600 hover:bg-card/60",
                isFutureReached && "text-blue-500 hover:bg-card/60",
                !isActive &&
                  !isCompleted &&
                  !isFutureReached &&
                  "text-muted-foreground/70",
                isClickable && "cursor-pointer",
                !isClickable && !isActive && "cursor-default",
              )}
            >
              {isCompleted && <Check className="w-3 h-3" />}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Numbered variant
  if (variant === "numbered") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const { isActive, isCompleted, isClickable } =
            getStepState(stepNumber);
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <button
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 transition-all",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                    isActive && "bg-blue-600 text-white",
                    isCompleted && "bg-green-600 text-white",
                    !isActive &&
                      !isCompleted &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNumber}
                </span>
                <span
                  className={cn(
                    "text-sm hidden md:inline",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "w-8 h-0.5 rounded-full",
                    isCompleted ? "bg-green-500" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Line variant
  return (
    <div className={cn("flex items-center gap-0 w-full", className)}>
      {steps.map((step, idx) => {
        const stepNumber = idx + 1;
        const { isActive, isCompleted, isClickable } = getStepState(stepNumber);

        return (
          <button
            key={step.key}
            onClick={() => isClickable && onStepClick?.(stepNumber)}
            disabled={!isClickable}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 transition-all",
              isClickable && "cursor-pointer",
              !isClickable && "cursor-default",
            )}
          >
            <div
              className={cn(
                "w-full h-1 rounded-full",
                isActive && "bg-blue-600",
                isCompleted && "bg-green-500",
                !isActive && !isCompleted && "bg-border",
              )}
            />
            <span
              className={cn(
                "text-[10px] md:text-xs",
                isActive && "font-semibold text-blue-600 dark:text-blue-400",
                isCompleted && "text-green-600 dark:text-green-400",
                !isActive && !isCompleted && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
