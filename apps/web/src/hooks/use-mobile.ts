import * as React from 'react';

/** Tailwind's `md`. Kept in step with the CSS by hand — there is no import. */
const MOBILE_BREAKPOINT = 768;

/**
 * Tracks whether the viewport is narrower than the mobile breakpoint. Use it
 * only when a phone needs a different component tree, not different styling.
 *
 * @returns `false` until after mount, since the server has no viewport.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
