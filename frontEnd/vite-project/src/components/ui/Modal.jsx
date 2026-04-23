import { useEffect, useRef, useCallback, useId } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const sizeToClass = {
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-lg",
  xl: "md:max-w-xl",
  full: "md:max-w-[min(100vw-2rem,1200px)]",
};

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  footer,
  hideClose = false,
  children,
  className,
  bodyClassName,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const prevActive = useRef(null);

  const handleKeydown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    prevActive.current = document.activeElement;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      if (prevActive.current && typeof prevActive.current.focus === "function") {
        prevActive.current.focus();
      }
    };
  }, [isOpen, handleKeydown]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll(focusableSelector);
    if (focusables.length) {
      const first = focusables[0];
      if (typeof first.focus === "function") first.focus();
    }

    const onTrap = (e) => {
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll(focusableSelector)).filter(
        (n) => n.offsetParent !== null && !n.hasAttribute("data-modal-no-trap")
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTrap);
    return () => document.removeEventListener("keydown", onTrap);
  }, [isOpen]);

  if (typeof document === "undefined" || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 animate-in fade-in duration-200 md:items-center md:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "flex max-h-[90vh] w-full flex-col overflow-hidden border border-gray-100 bg-white shadow-2xl",
          "animate-in duration-200 fade-in",
          "max-md:slide-in-from-bottom-8 max-md:rounded-t-2xl",
          "md:zoom-in-95 md:animate-in md:duration-200 md:rounded-2xl",
          sizeToClass[size] ?? sizeToClass.md,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 shrink-0 self-center rounded-full bg-gray-200 py-0.5 md:hidden" aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-lg font-bold text-gray-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div
          className={cn("flex-1 overflow-y-auto px-6 py-4", bodyClassName)}
        >
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-6 pb-6 pt-4 md:flex-row md:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
