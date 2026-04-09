import { useState, useEffect } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("dordod-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("dordod-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("dordod-theme", "light");
    }
  }, [dark]);

  return { dark, toggleDark: () => setDark((d) => !d) };
}
