import { useEffect, useState } from "react";

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

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStorage);
  const [isLg, setIsLg] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setIsLg(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    writeStorage(collapsed);
  }, [collapsed]);

  const effectiveCollapsed = Boolean(collapsed && isLg);

  const toggle = () => setCollapsed((c) => !c);

  return { collapsed, effectiveCollapsed, setCollapsed, toggle };
}
