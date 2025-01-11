/**
 * Custom hook for detecting media query matches.
 * Features:
 * - Responsive breakpoint detection
 * - Real-time updates
 * - Cleanup on unmount
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string) => {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
};
