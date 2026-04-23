import { cn } from "@/lib/utils";

const variantClasses = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  navy: "bg-[#1B3F8B]/10 text-[#1B3F8B]",
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1.5",
  md: "px-2 py-0.5 text-xs gap-2",
};

export default function Badge({
  variant = "gray",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}) {
  const v = variantClasses[variant] ?? variantClasses.gray;
  const dotPulse = dot && (variant === "success" || variant === "warning");

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full font-medium",
        v,
        sizeClasses[size] ?? sizeClasses.md,
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            variant === "success" && "bg-green-600",
            variant === "warning" && "bg-amber-600",
            !["success", "warning"].includes(variant) && "bg-current opacity-60",
            dotPulse && "animate-pulse"
          )}
          aria-hidden
        />
      )}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
