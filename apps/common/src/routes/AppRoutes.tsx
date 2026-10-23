import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../modules/login/LoginPage";
import { RedirectIfSession } from "./guards";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <RedirectIfSession>
              <LoginPage />
            </RedirectIfSession>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
