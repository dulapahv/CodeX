import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { DEFAULT_THEME } from "../constants";

export const useMonacoTheme = () => {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    const storedTheme =
      localStorage.getItem("editorTheme") ||
      (resolvedTheme === "dark" ? "vs-dark" : "light");
    setTheme(storedTheme);
    localStorage.setItem("editorTheme", storedTheme);
  }, [resolvedTheme]);

  return { theme, setTheme };
};
