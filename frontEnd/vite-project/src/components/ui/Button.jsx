import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-[#1B3F8B] text-white hover:bg-[#1B3F8B]/90 active:bg-[#0f2042] border border-transparent",
  secondary: "bg-white text-[#1B3F8B] border border-[#1B3F8B] hover:bg-[#1B3F8B]/5",
  danger: "bg-red-600 text-white border border-transparent hover:bg-red-700",
  ghost: "bg-transparent text-gray-600 border border-transparent hover:bg-gray-100",
  outline: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

const Button = forwardRef(function Button(
  {
    className,
    type = "button",
    variant = "primary",
    size = "md",
    loading = false,
    loadingText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth,
    disabled,
    children,
    ...rest
  },
  ref
) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1",
        "active:scale-95",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />}
      {!loading && LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" aria-hidden />}
      {loading ? (loadingText ?? children) : children}
      {!loading && RightIcon && <RightIcon className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
});

export default Button;
