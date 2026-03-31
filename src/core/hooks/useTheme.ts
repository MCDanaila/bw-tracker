import { useEffect, useState, useCallback } from "react"

/**
 * Hook to toggle between dark and light mode.
 * Reads/writes the `dark` class on the <html> element.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("theme")
    if (saved) return saved === "dark"
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev)
  }, [])

  return { isDark, toggle }
}
