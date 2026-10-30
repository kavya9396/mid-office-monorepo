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
import DvtUser from "../modules/drs/DvtUser";
import { GroupPreviousPolicyPage } from "../modules/previousPolicy/GroupPreviousPolicyPage";
import { GuwDrsPage } from "../modules/guw/GuwDrsPage";

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
          <Route path="/drs" element={<DvtUser />} />
          <Route path="/guw/drs" element={<GuwDrsPage />} />
          <Route path="/previous-policy" element={<GroupPreviousPolicyPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
