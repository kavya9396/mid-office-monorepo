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
import DvtUser from "../modules/drs/DvtUser";
import { GroupPreviousPolicyPage } from "../modules/previousPolicy/GroupPreviousPolicyPage";

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
          <Route path="/drs" element={<DvtUser />} />
          <Route path="/previous-policy" element={<GroupPreviousPolicyPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
