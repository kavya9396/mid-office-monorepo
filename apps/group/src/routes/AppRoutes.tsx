import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { appBasename, viteBase } from "@insurance-poc/routes";
import { GroupInboxPage } from "../modules/inbox/GroupInboxPage";
import { GroupAppLayout } from "./GroupAppLayout";
import { RequireSession } from "./RequireSession";
import GroupDrsPage from "../modules/drs/GroupDrsPage";
import { GroupAuditTrailPage } from "../modules/auditTrail/GroupAuditTrailPage";
import { GroupApplicantProfilePage } from "../modules/applicantProfile/GroupApplicantProfilePage";
import { GroupOpenTasksPage } from "../modules/openTasks/GroupOpenTasksPage";
import { GroupPreviousPolicyPage } from "../modules/previousPolicy/GroupPreviousPolicyPage";
import { GroupRiskDetailsPage } from "../modules/riskDetails/GroupRiskDetailsPage";

export function AppRoutes() {
  return (
    <BrowserRouter basename={appBasename(viteBase.group)}>
      <Routes>
        <Route
          element={
            <RequireSession>
              <GroupAppLayout />
            </RequireSession>
          }
        >
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<GroupInboxPage />} />
          <Route path="/drs" element={<GroupDrsPage />} />
          <Route path="/applicant-profile" element={<GroupApplicantProfilePage />} />
          <Route path="/previous-policy" element={<GroupPreviousPolicyPage />} />
          <Route path="/open-tasks" element={<GroupOpenTasksPage />} />
          <Route path="/risk-details" element={<GroupRiskDetailsPage />} />
          <Route path="/audit-trail" element={<GroupAuditTrailPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
