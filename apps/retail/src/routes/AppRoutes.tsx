import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { appBasename, viteBase } from "@insurance-poc/routes";
import { RetailDrsPage } from "../modules/drs/RetailDrsPage";
import { RetailInboxPage } from "../modules/inbox/RetailInboxPage";
import { MasDrsPage } from "../modules/mas/MasDrsPage";
import { MmtGrievanceDrsPage } from "../modules/mmt-grievance/MmtGrievanceDrsPage";
import { PivvDrsPage } from "../modules/pivv/PivvDrsPage";
import { RetailPreviousPolicyPage } from "../modules/previousPolicy/RetailPreviousPolicyPage";
import { RequireSession } from "./RequireSession";
import { RetailAppLayout } from "./RetailAppLayout";

export function AppRoutes() {
  return (
    <BrowserRouter basename={appBasename(viteBase.retail)}>
      <Routes>
        <Route
          element={
            <RequireSession>
              <RetailAppLayout />
            </RequireSession>
          }
        >
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<RetailInboxPage />} />
          <Route path="/drs" element={<RetailDrsPage />} />
          <Route path="/mas/drs" element={<MasDrsPage />} />
          <Route path="/mmt-grievance/drs" element={<MmtGrievanceDrsPage />} />
          <Route path="/pivv/drs" element={<PivvDrsPage />} />
          <Route path="/previous-policy" element={<RetailPreviousPolicyPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
