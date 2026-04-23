import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(function Input(
  {
    className: inputClassName,
    id,
    label,
    error,
    hint,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    type = "text",
    disabled,
    required,
    ...rest
  },
  ref
) {
  const hasError = Boolean(error);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <span className="pointer-events-none absolute left-3 text-gray-400" aria-hidden>
            <LeftIcon className="h-4 w-4" />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "h-12 w-full rounded-xl border border-gray-200 px-4 text-base transition-colors duration-150 md:text-sm",
            "focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20",
            "placeholder:text-gray-400",
            "disabled:cursor-not-allowed disabled:bg-gray-50",
            LeftIcon && "pl-10",
            RightIcon && "pr-10",
            hasError && "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200",
            inputClassName
          )}
          {...rest}
        />
        {RightIcon && (
          <span className="pointer-events-none absolute right-3 text-gray-400" aria-hidden>
            <RightIcon className="h-4 w-4" />
          </span>
        )}
      </div>
      {error && (
        <p id={id ? `${id}-error` : undefined} className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={id ? `${id}-hint` : undefined} className="mt-1 text-sm text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
