"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const initial =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Bật chế độ sáng" : "Bật chế độ tối"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition-colors duration-200 hover:bg-paper-deep hover:text-accent dark:text-ink-dark-dim dark:hover:bg-paper-dark-elev dark:hover:text-accent-soft"
    >
      {mounted && (theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />)}
    </button>
  );
}
