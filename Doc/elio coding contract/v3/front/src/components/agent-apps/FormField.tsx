import { cn } from "@/lib/utils";

const BASE_INPUT_CLASSES =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50";

interface FormFieldProps {
  readonly label: string;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  readonly className?: string;
};

export function FormInput({ className, ...props }: FormInputProps) {
  return <input className={cn(BASE_INPUT_CLASSES, className)} {...props} />;
}

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  readonly className?: string;
};

export function FormTextarea({ className, ...props }: FormTextareaProps) {
  return (
    <textarea
      className={cn(BASE_INPUT_CLASSES, "resize-none", className)}
      {...props}
    />
  );
}
