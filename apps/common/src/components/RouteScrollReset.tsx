import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls the window back to the top whenever the route path changes. Render it inside a router. */
export const RouteScrollReset = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default RouteScrollReset;
