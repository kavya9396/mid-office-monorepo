import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { appBasename, viteBase } from "@insurance-poc/routes";
import { RetailDrsPage } from "../modules/drs/RetailDrsPage";
import { RetailInboxPage } from "../modules/inbox/RetailInboxPage";
import { RetailPreviousPolicyPage } from "../modules/previousPolicy/RetailPreviousPolicyPage";
import { RetailOpenTasksPage } from "../modules/openTasks/RetailOpenTasksPage";
import { RetailAuditTrailPage } from "../modules/auditTrail/RetailAuditTrailPage";
import { RetailRiskDetailsPage } from "../modules/riskDetails/RetailRiskDetailsPage";
import { RetailApplicantProfilePage } from "../modules/applicantProfile/RetailApplicantProfilePage";
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
          <Route path="/previous-policy" element={<RetailPreviousPolicyPage />} />
          <Route path="/open-tasks" element={<RetailOpenTasksPage />} />
          <Route path="/risk-details" element={<RetailRiskDetailsPage />} />
          <Route path="/applicant-profile" element={<RetailApplicantProfilePage />} />
          <Route path="/audit-trail" element={<RetailAuditTrailPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
