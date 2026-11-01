import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { commonPaths } from "@insurance-poc/routes";
import { LoginPage } from "../modules/login/LoginPage";
import { ResetPasswordPage } from "../modules/login/ResetPasswordPage";
import { ChangePasswordPage } from "../modules/login/ChangePasswordPage";
import { RedirectIfSession } from "./guards";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={commonPaths.login} replace />} />
        <Route
          path={commonPaths.login}
          element={
            <RedirectIfSession>
              <LoginPage />
            </RedirectIfSession>
          }
        />
        <Route path={commonPaths.resetPassword} element={<ResetPasswordPage />} />
        <Route path={commonPaths.changePassword} element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to={commonPaths.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
