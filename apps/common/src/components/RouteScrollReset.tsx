import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls the window and main container back to the top whenever the route path or search changes. Render it inside a router. */
export const RouteScrollReset = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

export default RouteScrollReset;