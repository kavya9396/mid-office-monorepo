import { useEffect } from "react";
import { assignUrl, commonPaths } from "@insurance-poc/routes";
import { redirectHandled } from "@insurance-poc/utils";
import { useAppDispatch, useAppSelector } from "./hooks";

export function AuthNavigation() {
  const dispatch = useAppDispatch();
  const redirectToLogin = useAppSelector((state) => state.auth.redirectToLogin);

  useEffect(() => {
    if (!redirectToLogin) return;
    dispatch(redirectHandled());
    assignUrl(commonPaths.login);
  }, [dispatch, redirectToLogin]);

  return null;
}
