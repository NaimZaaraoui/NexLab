"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full p-1 opacity-0 pointer-events-none">
        <div className="p-1.5 rounded-full"><Sun size={14} /></div>
        <div className="p-1.5 rounded-full"><Moon size={14} /></div>
        <div className="p-1.5 rounded-full"><Laptop size={14} /></div>
      </div>
    );
  }

  return (
    <div className="flex bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-full p-1 shadow-inner gap-1">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === "light"
            ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-[var(--color-border)]"
            : "text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 border border-transparent"
        }`}
        aria-label="Light mode"
      >
        <Sun size={14} />
      </button>
      
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === "dark"
            ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[0_2px_4px_rgba(0,0,0,0.4)] border border-[var(--color-border)]"
            : "text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 border border-transparent"
        }`}
        aria-label="Dark mode"
      >
        <Moon size={14} />
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
          theme === "system"
            ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-[var(--color-border)]"
            : "text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 border border-transparent"
        }`}
        aria-label="System theme"
      >
        <Laptop size={14} />
      </button>
    </div>
  );
}
