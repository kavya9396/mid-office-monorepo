import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { appBasename, viteBase } from "@insurance-poc/routes";
import { AuthNavigation } from "../app/AuthNavigation";
import { GroupInboxPage } from "../modules/inbox/GroupInboxPage";
import { GroupAppLayout } from "./GroupAppLayout";
import { RequireSession } from "./RequireSession";
import { GroupAuditTrailPage } from "../modules/auditTrail/GroupAuditTrailPage";
// import { GroupApplicantProfilePage } from "../modules/applicantProfile/GroupApplicantProfilePage";
import { GroupOpenTasksPage } from "../modules/openTasks/GroupOpenTasksPage";
import { GroupPreviousPolicyPage } from "../modules/previousPolicy/GroupPreviousPolicyPage";
import { GroupRiskDetailsPage } from "../modules/riskDetails/GroupRiskDetailsPage";
import GroupDrsRouter from "../modules/drs/GroupDrsRouter";
import { GuwMemberSelection } from "../modules/guw/GuwMemberSelection";

export function AppRoutes() {
  return (
    <BrowserRouter basename={appBasename(viteBase.group)}>
      <AuthNavigation />
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
          {/* <Route path="/drs" element={<GroupDrsRouter />} /> */}
          <Route path="/guw/member-selection" element={<GuwMemberSelection />} />
          <Route path="/guw/drs" element={<GroupDrsRouter />} />
          {/* <Route path="/applicant-profile" element={<GroupApplicantProfilePage />} /> */}
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
