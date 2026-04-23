import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "bwpost_sidebar_collapsed";

function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStorage(collapsed) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
  } catch {
    /* ignore */
  }
}

function getWidthBucket() {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStorage);
  const [widthBucket, setWidthBucket] = useState(getWidthBucket);

  useEffect(() => {
    const onResize = () => setWidthBucket(getWidthBucket());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    writeStorage(collapsed);
  }, [collapsed]);

  const isMobile = widthBucket === "mobile";
  const isTablet = widthBucket === "tablet";
  const isDesktop = widthBucket === "desktop";

  const effectiveCollapsed = isTablet || (isDesktop && collapsed);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return {
    collapsed,
    setCollapsed,
    toggle,
    isMobile,
    isTablet,
    isDesktop,
    widthBucket,
    effectiveCollapsed,
  };
}
